// Cloudflare Pages Function: Query Payment Status
// Path: GET /api/payment/status?key={paymentkey}
//       GET /api/payment/status?paymentkey={paymentkey}
//
// Used by the frontend after payment callback to verify status.

interface Env {
  FIREBASE_DATABASE_URL: string;
  FIREBASE_DB_SECRET: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const dbUrl = env.FIREBASE_DATABASE_URL;
  const dbSecret = env.FIREBASE_DB_SECRET;

  if (!dbUrl || !dbSecret) {
    return new Response(
      JSON.stringify({ error: 'Server not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const paymentkey = url.searchParams.get('key') || url.searchParams.get('paymentkey');

  if (!paymentkey) {
    return new Response(
      JSON.stringify({ error: 'Missing paymentkey parameter.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Try indexed query
    const queryUrl = `${dbUrl}/payments.json?orderBy="paymentkey"&equalTo="${encodeURIComponent(paymentkey)}"&auth=${dbSecret}`;
    const queryResponse = await fetch(queryUrl);

    if (!queryResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Firebase query failed.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await queryResponse.json();

    if (!data || typeof data !== 'object' || data.error) {
      return new Response(
        JSON.stringify({ error: 'Payment not found.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const entries = Object.entries(data);
    if (entries.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Payment not found.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [id, record] = entries[0];
    const rec = record as Record<string, unknown>;
    return new Response(
      JSON.stringify({
        id,
        status: rec.status,
        amount: rec.amount,
        full_name: rec.full_name,
        fund_title: rec.fund_title,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[Payment Status] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
