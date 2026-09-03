// Cloudflare Pages Function — Bohudur Payment Query
// Endpoint: POST /api/bohudur/query
// Checks payment status at any time.
// Statuses: PENDING, COMPLETED, EXECUTED, CANCELLED

interface Env {
  BOHUDUR_API_KEY?: string;
}

const statusMap: Record<string, string> = {
  'PENDING': 'pending',
  'COMPLETED': 'completed',
  'EXECUTED': 'success',
  'CANCELLED': 'cancel',
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();

    const apiKey =
      context.request.headers.get('x-bohudur-api-key') ||
      context.request.headers.get('ah-bohudur-api-key') ||
      body.apiKey ||
      context.env.BOHUDUR_API_KEY ||
      '';

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'API Key not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.paymentkey) {
      return new Response(
        JSON.stringify({ success: false, message: 'paymentkey is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let bohudurResponse: Response;
    try {
      bohudurResponse = await fetch('https://request.bohudur.one/query/v2/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AH-BOHUDUR-API-KEY': apiKey,
        },
        body: JSON.stringify({ paymentkey: body.paymentkey }),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Network error';
      return new Response(
        JSON.stringify({ success: false, message: `Failed to reach Bohudur API: ${msg}` }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    let data: any;
    try {
      data = await bohudurResponse.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid response from Bohudur API.' }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(JSON.stringify({
      success: true,
      bohudurStatus: data.status,
      status: statusMap[data.status] || data.status || 'unknown',
      paymentkey: data.paymentkey || body.paymentkey,
      full_name: data.full_name || null,
      email: data.email || null,
      amount: data.amount || 0,
      converted_amount: data.converted_amount || null,
      payment_currency: data.payment_currency || null,
      created_time: data.created_time || null,
      payment_time: data.payment_time || null,
      payment_info: data.payment_info || null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error.';
    return new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-bohudur-api-key, ah-bohudur-api-key',
    },
  });
};
