// Cloudflare Pages Function: Bohudur Payment Webhook
// Path: POST /api/payment/webhook
//
// Bohudur v2 webhook payload (flat):
//   Success: { full_name, email, amount, paymentkey, status: "COMPLETED" }
//   Cancel:  { full_name, email, amount, paymentkey, status: "CANCELLED" }
//
// Environment Variables (set in Cloudflare Pages Dashboard):
//   FIREBASE_DATABASE_URL - Your Firebase RTDB URL
//   FIREBASE_DB_SECRET    - Firebase database secret (for server-side auth)

interface WebhookPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  amount?: number;
  paymentkey?: string;
  status?: string;
  [key: string]: unknown;
}

interface Env {
  FIREBASE_DATABASE_URL: string;
  FIREBASE_DB_SECRET: string;
}

// Map Bohudur statuses to internal statuses
function mapStatus(bohudurStatus: string): string {
  const map: Record<string, string> = {
    'COMPLETED': 'success',
    'CANCELLED': 'cancel',
    'FAILED': 'failed',
    'PENDING': 'pending',
  };
  return map[bohudurStatus.toUpperCase()] || bohudurStatus.toLowerCase();
}

function isValidPayload(payload: WebhookPayload): boolean {
  if (!payload.paymentkey) return false;
  const validStatuses = ['COMPLETED', 'CANCELLED', 'PENDING', 'FAILED'];
  return !!payload.status && validStatuses.includes(payload.status.toUpperCase());
}

async function findPaymentByKey(
  dbUrl: string,
  secret: string,
  paymentkey: string
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  // Try indexed query first
  try {
    const queryUrl = `${dbUrl}/payments.json?orderBy="paymentkey"&equalTo="${encodeURIComponent(paymentkey)}"&auth=${secret}`;
    const queryResponse = await fetch(queryUrl);
    if (queryResponse.ok) {
      const queryData = await queryResponse.json();
      if (queryData && typeof queryData === 'object' && !queryData.error) {
        const entries = Object.entries(queryData);
        if (entries.length > 0) {
          return { id: entries[0][0], data: entries[0][1] as Record<string, unknown> };
        }
      }
    }
  } catch (err) {
    console.warn('[Webhook] Indexed query failed, falling back to full scan:', err);
  }

  // Fallback: download all payments
  try {
    const allResponse = await fetch(`${dbUrl}/payments.json?auth=${secret}`);
    if (allResponse.ok) {
      const allData = await allResponse.json();
      if (allData && typeof allData === 'object') {
        for (const [id, record] of Object.entries(allData)) {
          const rec = record as Record<string, unknown>;
          if (rec.paymentkey === paymentkey) {
            return { id, data: rec };
          }
        }
      }
    }
  } catch (err) {
    console.error('[Webhook] Full scan failed:', err);
  }

  return null;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const dbUrl = env.FIREBASE_DATABASE_URL;
  const dbSecret = env.FIREBASE_DB_SECRET;

  if (!dbUrl || !dbSecret) {
    console.error('[Webhook] Firebase env vars not configured.');
    return new Response(
      JSON.stringify({ success: false, message: 'Server not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload: WebhookPayload = await request.json();

    console.log(`[Webhook] Received: paymentkey=${payload.paymentkey}, status=${payload.status}`);

    if (!isValidPayload(payload)) {
      console.warn('[Webhook] Invalid payload:', JSON.stringify(payload));
      return new Response(
        JSON.stringify({ success: true, message: 'Invalid payload, ignored.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payment = await findPaymentByKey(dbUrl, dbSecret, payload.paymentkey);

    if (!payment) {
      console.warn(`[Webhook] No payment found for paymentkey: ${payload.paymentkey}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Payment not found.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newStatus = mapStatus(payload.status || 'pending');

    // Idempotency check
    if (payment.data.status === newStatus) {
      console.log(`[Webhook] Payment ${payment.id} already has status: ${newStatus}. Skipping.`);
      return new Response(
        JSON.stringify({ success: true, message: 'Already updated.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const oldStatus = payment.data.status as string;

    // Update payment record
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: Date.now(),
      bohudurStatus: payload.status,
    };

    if (payload.amount) updateData.amount = payload.amount;
    if (payload.full_name) updateData.full_name = payload.full_name;

    const updateUrl = `${dbUrl}/payments/${payment.id}.json?auth=${dbSecret}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (!updateResponse.ok) {
      console.error(`[Webhook] Firebase update failed: ${updateResponse.status}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to update.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Auto-increment donation fund on COMPLETED
    if (newStatus === 'success' && payload.amount) {
      try {
        const fundsResponse = await fetch(`${dbUrl}/donations.json?auth=${dbSecret}`);
        if (fundsResponse.ok) {
          const fundsData = await fundsResponse.json();
          if (fundsData && typeof fundsData === 'object') {
            const fundTitle = payment.data.fund_title as string | undefined;
            let matchedFundId: string | null = null;

            if (fundTitle) {
              for (const [id, fund] of Object.entries(fundsData)) {
                if ((fund as Record<string, unknown>).title === fundTitle) {
                  matchedFundId = id;
                  break;
                }
              }
            }

            const targetFundId = matchedFundId || Object.keys(fundsData)[0];
            if (targetFundId) {
              const targetFund = fundsData[targetFundId] as Record<string, unknown>;
              const newCollected = (Number(targetFund.collected) || 0) + Number(payload.amount);

              await fetch(`${dbUrl}/donations/${targetFundId}.json?auth=${dbSecret}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collected: newCollected }),
              });
              console.log(`[Webhook] Fund ${targetFundId} collected: ${newCollected}`);
            }
          }
        }
      } catch (fundErr) {
        console.warn('[Webhook] Fund update failed (non-critical):', fundErr);
      }
    }

    console.log(`[Webhook] Payment ${payment.id}: ${oldStatus} -> ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true, message: `Updated to ${newStatus}.`, oldStatus, newStatus }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
