export const runtime = 'edge';

const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  'https://heroic-bull-282870.upstash.io';
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  'gQAAAAAABFD2AAIgcDI5MThiYzFmODQ2N2U0Yjc0OTI2YTgxZTBkOTNhZmNkNg';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldIncrement = searchParams.get('inc') === '1';

  try {
    const endpoint = shouldIncrement
      ? `${UPSTASH_URL}/incr/toolbox_visitors`
      : `${UPSTASH_URL}/get/toolbox_visitors`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Upstash Redis error:', res.status, errText);
      return Response.json({ count: null, error: 'Redis error' }, { status: 500 });
    }

    const data = (await res.json()) as { result: number | string | null };
    const raw = data.result;
    const count = raw !== null ? Number(raw) : 0;

    return Response.json(
      { count },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Visitor counter error:', error);
    return Response.json({ count: null, error: 'Counter unavailable' }, { status: 500 });
  }
}
