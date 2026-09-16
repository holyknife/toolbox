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

const cities: Record<string, string> = {
  KTM: 'Kathmandu',
  DEL: 'New Delhi',
  BOM: 'Mumbai',
  CCU: 'Kolkata',
  MAA: 'Chennai',
  BLR: 'Bengaluru',
  HYD: 'Hyderabad',
  AMD: 'Ahmedabad',
  DAC: 'Dhaka',
  CMB: 'Colombo',
  KHI: 'Karachi',
  LHE: 'Lahore',
  ISB: 'Islamabad',
  DXB: 'Dubai',
  DOH: 'Doha',
  SIN: 'Singapore',
  BKK: 'Bangkok',
  KUL: 'Kuala Lumpur',
  HKG: 'Hong Kong',
  TPE: 'Taipei',
  NRT: 'Tokyo',
  HND: 'Tokyo',
  ICN: 'Seoul',
  LHR: 'London',
  LGW: 'London',
  FRA: 'Frankfurt',
  CDG: 'Paris',
  AMS: 'Amsterdam',
  MAD: 'Madrid',
  MXP: 'Milan',
  ZRH: 'Zurich',
  LAX: 'Los Angeles',
  SJC: 'San Jose',
  SFO: 'San Francisco',
  SEA: 'Seattle',
  ORD: 'Chicago',
  DFW: 'Dallas',
  ATL: 'Atlanta',
  IAD: 'Ashburn',
  EWR: 'Newark',
  JFK: 'New York',
  MIA: 'Miami',
  SYD: 'Sydney',
  MEL: 'Melbourne',
};

export function parseLocation(trace: string): ConnectionLocation {
  const fields = Object.fromEntries(trace.split('\n').map(line => line.trim().split('=')));
  const rawCode = fields.colo?.trim().toUpperCase() ?? '';
  const code = /^[A-Z0-9]{3,4}$/.test(rawCode) ? rawCode : '';
  const rawCountry = fields.loc?.trim().toUpperCase() ?? '';
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : '';
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
  const colo = data.colo ? data.colo.trim().toUpperCase() : '';
  if (/^[A-Z0-9]{3,4}$/.test(colo)) {
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

// Primary client-side lookup (works in Chrome, mobile, and Brave Shields OFF)
async function getPrimaryLocation(signal: AbortSignal): Promise<Partial<ConnectionLocation>> {
  let base: ConnectionLocation = { country: 'Unavailable', server: 'Unavailable' };
  let ip: string | undefined;

  try {
    const response = await fetch('https://speed.cloudflare.com/cdn-cgi/trace', {
      cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(3500)]),
    });
    if (response.ok) {
      const trace = await response.text();
      base = parseLocation(trace);
      ip = parseTraceIp(trace);
    }
  } catch {
    // Blocked by Brave Shields or network error - will try same-origin or fallback
  }

  // If cross-origin trace was blocked (e.g. Brave Shields ON), try same-origin /cdn-cgi/trace
  // which Cloudflare edge serves directly and is never blocked by Shields
  if ((base.server === 'Unavailable' || !ip) && typeof window !== 'undefined') {
    try {
      const sameOriginRes = await fetch('/cdn-cgi/trace', {
        cache: 'no-store',
        signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]),
      });
      if (sameOriginRes.ok) {
        const trace = await sameOriginRes.text();
        if (trace.includes('colo=')) {
          const sameOriginLoc = parseLocation(trace);
          if (sameOriginLoc.server !== 'Unavailable') base = sameOriginLoc;
          if (!ip) ip = parseTraceIp(trace);
        }
      }
    } catch {
      // Ignored
    }
  }

  let isp: string | undefined;
  let city: string | undefined;

  try {
    const geoResponse = await fetch('https://ipwho.is/?fields=connection,city,country', {
      cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(2500)]),
    });
    if (geoResponse.ok) {
      const geo = await geoResponse.json();
      if (geo && typeof geo === 'object') {
        if (typeof geo.city === 'string' && geo.city) city = geo.city;
        const org = geo.connection?.isp || geo.connection?.org;
        if (typeof org === 'string' && org) isp = org;
      }
    }
  } catch {
    // ISP detection failure is non-fatal: will fall back if missing
  }

  return {
    ...base,
    ...(ip ? { ip } : {}),
    ...(isp ? { isp } : {}),
    ...(city ? { city } : {}),
  };
}

// Same-origin server-side fallback using Cloudflare incoming request data (request.headers and request.cf)
async function getFallbackLocation(signal: AbortSignal): Promise<ConnectionLocation | null> {
  try {
    const response = await fetch('/api/network-info', {
      cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
    });
    if (!response.ok) return null;
    const data = await response.json() as Partial<NetworkInfoResponse>;
    return formatNetworkInfo(data);
  } catch {
    return null;
  }
}

// Main lookup: Primary client-side source first.
// If any metadata is blocked or missing (e.g. Brave Shields ON), transparently falls back to /api/network-info.
export async function getConnectionLocation(signal: AbortSignal): Promise<ConnectionLocation> {
  const primary = await getPrimaryLocation(signal);

  const isComplete =
    primary.ip &&
    primary.isp &&
    primary.server && primary.server !== 'Unavailable' &&
    primary.country && primary.country !== 'Unavailable';

  if (isComplete) {
    return {
      country: primary.country!,
      server: primary.server!,
      ...(primary.ip ? { ip: primary.ip } : {}),
      ...(primary.isp ? { isp: primary.isp } : {}),
      ...(primary.city ? { city: primary.city } : {}),
      ...(typeof primary.asn === 'number' ? { asn: primary.asn } : {}),
      ...(primary.region ? { region: primary.region } : {}),
    };
  }

  // Brave Shields ON or partial failure: query same-origin Cloudflare Worker endpoint
  const fallback = await getFallbackLocation(signal);

  const country = (primary.country && primary.country !== 'Unavailable')
    ? primary.country
    : (fallback?.country && fallback.country !== 'Unavailable' ? fallback.country : 'Unavailable');

  const server = (primary.server && primary.server !== 'Unavailable')
    ? primary.server
    : (fallback?.server && fallback.server !== 'Unavailable' ? fallback.server : 'Unavailable');

  const ip = primary.ip ?? fallback?.ip;
  const isp = primary.isp ?? fallback?.isp;
  const city = primary.city ?? fallback?.city;
  const asn = primary.asn ?? fallback?.asn;
  const region = primary.region ?? fallback?.region;

  if (country === 'Unavailable' && server === 'Unavailable' && !ip) {
    throw new Error('Location lookup unavailable');
  }

  return {
    country,
    server,
    ...(ip ? { ip } : {}),
    ...(isp ? { isp } : {}),
    ...(city ? { city } : {}),
    ...(typeof asn === 'number' ? { asn } : {}),
    ...(region ? { region } : {}),
  };
}


