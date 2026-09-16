export interface ConnectionLocation {
  country: string;
  server: string;
  ip?: string;
  isp?: string;
  city?: string;
  asn?: number;
  region?: string;
}

export interface NetworkInfoResponse {
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  asn: number | null;
  isp: string | null;
  colo: string | null;
}

const cities: Record<string,string> = { KTM:'Kathmandu', DEL:'New Delhi', BOM:'Mumbai', SIN:'Singapore', HKG:'Hong Kong', NRT:'Tokyo', LHR:'London', FRA:'Frankfurt', LAX:'Los Angeles', SJC:'San Jose', SYD:'Sydney', DFW:'Dallas', CDG:'Paris' };

export function parseLocation(trace: string): ConnectionLocation {
  const fields = Object.fromEntries(trace.split('\n').map(line => line.trim().split('=')));
  const code = /^[A-Z]{3}$/.test(fields.colo ?? '') ? fields.colo : '';
  const country = /^[A-Z]{2}$/.test(fields.loc ?? '') ? fields.loc : '';
  let name = country || 'Unavailable';
  try { if (country) name = new Intl.DisplayNames(['en'],{type:'region'}).of(country) ?? country; } catch { /* Keep the reported country code. */ }
  return {country:name,server:code ? `${cities[code] ? `${cities[code]} · ` : 'Cloudflare · '}${code}` : 'Unavailable'};
}

export function parseTraceIp(trace: string): string | undefined {
  const fields = Object.fromEntries(trace.split('\n').map(line => line.trim().split('=')));
  const rawIp = fields.ip?.trim() ?? '';
  return /^[0-9a-fA-F:.]+$/.test(rawIp) && rawIp.length >= 7 ? rawIp : undefined;
}

export function maskIp(ip: string): string {
  if (!ip) return '';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.•••.•••`;
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:••••:••••`;
    }
  }
  return '•••.•••.•••';
}

export function formatNetworkInfo(data: Partial<NetworkInfoResponse>): ConnectionLocation {
  let country = 'Unavailable';
  if (data.country) {
    country = data.country;
    if (/^[A-Za-z]{2}$/.test(data.country)) {
      try {
        country = new Intl.DisplayNames(['en'], { type: 'region' }).of(data.country.toUpperCase()) ?? data.country;
      } catch {
        /* Keep reported country code */
      }
    }
  }

  let server = 'Unavailable';
  const colo = data.colo ? data.colo.toUpperCase() : '';
  if (/^[A-Z]{3}$/.test(colo)) {
    server = `${cities[colo] ? `${cities[colo]} · ` : 'Cloudflare · '}${colo}`;
  } else if (data.city) {
    server = `${data.city} · Cloudflare`;
  }

  return {
    country,
    server,
    ...(data.ip ? { ip: data.ip } : {}),
    ...(data.isp ? { isp: data.isp } : {}),
    ...(data.city ? { city: data.city } : {}),
    ...(typeof data.asn === 'number' ? { asn: data.asn } : {}),
    ...(data.region ? { region: data.region } : {}),
  };
}

// Lookup via same-origin backend using Cloudflare server-side connection info.
// Never calls third-party tracking APIs or WebRTC, ensuring compatibility with Brave Shields.
export async function getConnectionLocation(signal: AbortSignal): Promise<ConnectionLocation> {
  const response = await fetch('/api/network-info', {
    cache: 'no-store',
    signal: AbortSignal.any([signal, AbortSignal.timeout(4000)])
  });
  if (!response.ok) throw new Error('Location lookup unavailable');
  const data = await response.json() as Partial<NetworkInfoResponse>;
  return formatNetworkInfo(data);
}


