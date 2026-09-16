export interface ConnectionLocation {
  country: string;
  server: string;
  ip?: string;
  isp?: string;
  city?: string;
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

// Lookup at test traffic origin with optional privacy-safe ISP enrichment. Never store IP data.
export async function getConnectionLocation(signal: AbortSignal): Promise<ConnectionLocation> {
  const response = await fetch('https://speed.cloudflare.com/cdn-cgi/trace',{cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(4000)])});
  if (!response.ok) throw new Error('Location lookup unavailable');
  const trace = await response.text();
  const base = parseLocation(trace);
  const ip = parseTraceIp(trace);
  let isp: string | undefined;
  let city: string | undefined;

  try {
    const geoResponse = await fetch('https://ipwho.is/?fields=connection,city,country',{cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(2500)])});
    if (geoResponse.ok) {
      const geo = await geoResponse.json();
      if (geo && typeof geo === 'object') {
        if (typeof geo.city === 'string' && geo.city) city = geo.city;
        const org = geo.connection?.isp || geo.connection?.org;
        if (typeof org === 'string' && org) isp = org;
      }
    }
  } catch {
    // ISP detection failure is non-fatal: route and country are preserved.
  }

  return { ...base, ...(ip ? { ip } : {}), ...(isp ? { isp } : {}), ...(city ? { city } : {}) };
}

