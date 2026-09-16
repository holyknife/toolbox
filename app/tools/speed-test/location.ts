export interface ConnectionLocation { country: string; server: string }
const cities: Record<string,string> = { KTM:'Kathmandu', DEL:'New Delhi', BOM:'Mumbai', SIN:'Singapore', HKG:'Hong Kong', NRT:'Tokyo', LHR:'London', FRA:'Frankfurt', LAX:'Los Angeles', SJC:'San Jose', SYD:'Sydney', DFW:'Dallas', CDG:'Paris' };
export function parseLocation(trace: string): ConnectionLocation {
  const fields = Object.fromEntries(trace.split('\n').map(line => line.trim().split('=')));
  const code = /^[A-Z]{3}$/.test(fields.colo ?? '') ? fields.colo : '';
  const country = /^[A-Z]{2}$/.test(fields.loc ?? '') ? fields.loc : '';
  let name = country || 'Unavailable';
  try { if (country) name = new Intl.DisplayNames(['en'],{type:'region'}).of(country) ?? country; } catch { /* Keep the reported country code. */ }
  return {country:name,server:code ? `${cities[code] ? `${cities[code]} · ` : 'Cloudflare · '}${code}` : 'Unavailable'};
}
// Lookup only after Start, at the same origin as test traffic. Never store IP data.
export async function getConnectionLocation(signal: AbortSignal): Promise<ConnectionLocation> {
  const response = await fetch('https://speed.cloudflare.com/cdn-cgi/trace',{cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(4000)])});
  if (!response.ok) throw new Error('Location lookup unavailable');
  return parseLocation(await response.text());
}
