import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";

/**
 * Next.js API Route — Payment Status Query
 * Works in development mode. In production, Cloudflare Pages Function handles this.
 *
 * Endpoint: GET /api/payment/status?key={paymentkey}
 *
 * Now proxies to Bohudur Query API v2 for real-time status checking.
 * Statuses: PENDING, COMPLETED, EXECUTED, CANCELLED
 */

const BOHUDUR_QUERY_URL = 'https://request.bohudur.one/query/v2/';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentkey = searchParams.get('key') || searchParams.get('paymentkey');

  if (!paymentkey) {
    return NextResponse.json(
      { error: 'Missing paymentkey parameter.' },
      { status: 400 }
    );
  }

  // Try to get API key from request header
  const apiKey = request.headers.get('x-bohudur-api-key') || request.headers.get('ah-bohudur-api-key') || '';

  // If API key is available, query Bohudur directly
  if (apiKey) {
    try {

      const bohudurResponse = await fetch(BOHUDUR_QUERY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AH-BOHUDUR-API-KEY': apiKey,
        },
        body: JSON.stringify({ paymentkey }),
      });

      const data = await bohudurResponse.json();

      // Map Bohudur statuses
      const statusMap: Record<string, string> = {
        'PENDING': 'pending',
        'COMPLETED': 'success',
        'EXECUTED': 'success',
        'CANCELLED': 'cancel',
      };

      return NextResponse.json({
        id: 'bohudur-' + paymentkey,
        status: statusMap[data.status] || data.status || 'pending',
        bohudurStatus: data.status,
        amount: data.amount || 0,
        full_name: data.full_name || null,
        fund_title: null,
        createdAt: data.created_time || Date.now(),
        updatedAt: data.payment_time || null,
      }, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (err) {
      // Fall through to dev response
    }
  }

  // Dev mode fallback (no API key)

  return NextResponse.json({
    id: 'dev-payment-' + paymentkey,
    status: 'pending',
    amount: 0,
    full_name: null,
    fund_title: null,
    createdAt: Date.now(),
    updatedAt: null,
    _dev: true,
    _note: 'API Key দেওয়া হয়নি। Cloudflare Pages-এ deploy করলে সঠিক স্ট্যাটাস পাওয়া যাবে।',
  }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-bohudur-api-key, ah-bohudur-api-key',
    },
  });
}
