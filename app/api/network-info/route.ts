export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Read Cloudflare's client IP header provided to Workers/Pages
  const ip = request.headers.get("CF-Connecting-IP") ?? null;
  const cf = (request as Request & { cf?: Record<string, unknown> }).cf || {};

  return Response.json({
    ip,
    country: (cf.country as string) ?? null,
    city: (cf.city as string) ?? null,
    region: (cf.region as string) ?? null,
    asn: (cf.asn as number) ?? null,
    isp: (cf.asOrganization as string) ?? null,
    colo: (cf.colo as string) ?? null,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
