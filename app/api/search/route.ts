import { NextRequest, NextResponse } from 'next/server';
import { executeSearch } from '@/lib/search';
import { verifySessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Session token authorization check
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { query } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'A search query is required.' }, { status: 400 });
    }

    const { results, providerUsed, builtQuery } = await executeSearch(query);

    return NextResponse.json({
      results,
      provider: providerUsed,
      query: query,
      builtQuery,
      total: results.length,
    });
  } catch (error: any) {
    console.error('Search API Route error:', error.message || error);
    if (error.message === 'NO_CONFIGURED_PROVIDERS') {
      return NextResponse.json(
        { error: 'No search providers configured. Please check your environment variables.' },
        { status: 500 }
      );
    }
    if (error.message === 'ALL_QUOTA_EXHAUSTED_OR_NO_RESULTS') {
      return NextResponse.json(
        { error: 'All active provider API quotas have been exhausted or returned zero results.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Search execution failed.' },
      { status: 500 }
    );
  }
}
