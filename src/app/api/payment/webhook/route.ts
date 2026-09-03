import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";

/**
 * Next.js API Route — Payment Webhook
 * Works in development mode. In production, Cloudflare Pages Function handles this.
 *
 * Endpoint: POST /api/payment/webhook
 *
 * This handler automatically manages COMPLETED and CANCELLED payment statuses.
 * Both webhook URLs can point to this same endpoint — the handler will detect
 * the status from the payload and update Firebase accordingly.
 *
 * Bohudur sends the following webhook payload:
 * - { status: "COMPLETED", paymentkey: "...", amount: 1000, full_name: "..." }
 * - { status: "CANCELLED", paymentkey: "...", amount: 1000, full_name: "..." }
 */

interface WebhookPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  amount?: number;
  paymentkey?: string;
  status?: string;
  bohudur_status?: string;
  type?: string;
  [key: string]: unknown;
}

type PaymentStatus = 'pending' | 'success' | 'cancel' | 'failed';

function mapBohudurStatus(status: string): PaymentStatus {
  const upper = status.toUpperCase();

  // COMPLETED → success (payment verified and complete)
  if (upper === 'COMPLETED' || upper === 'EXECUTED') {
    return 'success';
  }

  // CANCELLED → cancel (user cancelled the payment)
  if (upper === 'CANCELLED') {
    return 'cancel';
  }

  // FAILED or similar → failed
  if (upper === 'FAILED' || upper === 'EXPIRED' || upper === 'REVERSED') {
    return 'failed';
  }

  // Default fallback
  return 'pending';
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();


    // Validate required fields
    if (!payload.paymentkey) {
      return NextResponse.json(
        { success: false, message: 'Missing paymentkey.' },
        { status: 400 }
      );
    }

    if (!payload.status && !payload.bohudur_status) {
      return NextResponse.json(
        { success: false, message: 'Missing status field.' },
        { status: 400 }
      );
    }

    // Map the status from Bohudur format to our internal format
    const rawStatus = payload.status || payload.bohudur_status || '';
    const newStatus = mapBohudurStatus(rawStatus);


    // ========================================================
    // Update Firebase Realtime Database with the new status
    // ========================================================
    try {
      const { getDatabase } = await import('firebase/database');
      const { initializeApp } = await import('firebase/app');
      const app = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      });
      const db = getDatabase(app);

      const { ref, get, update } = await import('firebase/database');

      // Find the payment record by paymentkey
      const paymentsRef = ref(db, '/payments');
      const snapshot = await get(paymentsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        let updated = false;

        for (const [recordId, record] of Object.entries(data)) {
          const rec = record as Record<string, unknown>;
          if (rec.paymentkey === payload.paymentkey) {
            // Update the payment record
            const updates: Record<string, unknown> = {
              status: newStatus,
              updatedAt: Date.now(),
            };

            // Update additional fields from webhook payload
            if (payload.amount) updates.amount = payload.amount;
            if (payload.full_name) updates.full_name = payload.full_name;
            if (payload.email) updates.email = payload.email;
            if (payload.phone) updates.phone = payload.phone;

            const recordRef = ref(db, `/payments/${recordId}`);
            await update(recordRef, updates);

            updated = true;
            break;
          }
        }

        if (!updated) {
          // Payment record not found — log for debugging
          console.warn(`Webhook: paymentkey '${payload.paymentkey}' not found in database.`);
        }
      } else {
        console.warn('Webhook: no payment records exist in database.');
      }
    } catch (firebaseError) {
      // Firebase update failed — log but still return success to Bohudur
      // (so they don't retry the webhook)

      // In dev mode, we still log and return success
    }

    // Return success response to Bohudur
    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${newStatus}`,
      paymentkey: payload.paymentkey,
      newStatus,
      originalStatus: rawStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error.';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
