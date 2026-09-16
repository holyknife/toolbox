export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Read Cloudflare's client IP header provided to Workers/Pages/Proxies
  const ip =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(',')[0]?.trim() ??
    null;

  let cf: Record<string, unknown> = {};
  try {
    // In OpenNext Cloudflare Worker runtime, getCloudflareContext() provides cf metadata
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx && ctx.cf) {
      cf = ctx.cf as Record<string, unknown>;
    }
  } catch {
    // Not running in OpenNext worker context or context unavailable
  }

  if (!cf || Object.keys(cf).length === 0) {
    cf = (request as Request & { cf?: Record<string, unknown> }).cf || {};
  }

  // Extract colo from cf metadata or parse Cloudflare's CF-Ray header (e.g. "8c3b2901c89f1a2b-KTM" -> "KTM")
  const ray = request.headers.get("cf-ray") ?? request.headers.get("CF-RAY") ?? "";
  const rayColoMatch = ray.match(/-([A-Za-z0-9]{3,4})$/);
  const headerColo = rayColoMatch ? rayColoMatch[1].toUpperCase() : null;

  const headerCountry = request.headers.get("cf-ipcountry") ?? request.headers.get("CF-IPCountry") ?? null;
  const headerCity = request.headers.get("cf-ipcity") ?? request.headers.get("CF-IPCity") ?? null;
  const headerRegion = request.headers.get("cf-region") ?? request.headers.get("CF-Region") ?? null;

  return Response.json({
    ip,
    country: (cf.country as string) ?? (headerCountry ? headerCountry.toUpperCase() : null),
    city: (cf.city as string) ?? headerCity,
    region: (cf.region as string) ?? headerRegion,
    asn: typeof cf.asn === 'number' ? cf.asn : null,
    isp: (cf.asOrganization as string) ?? null,
    colo: (cf.colo as string) ?? headerColo,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

