import { NextRequest, NextResponse } from 'next/server';
import { getUsage, PROVIDER_LIMITS } from '@/lib/usageTracker';
import { verifySessionToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const usage = await getUsage();

    const breakdown = Object.keys(PROVIDER_LIMITS).map((provider) => {
      const used = (usage.providers as any)[provider] || 0;
      const limit = PROVIDER_LIMITS[provider] || 100;
      const percentage = Math.min(100, Math.round((used / limit) * 100));
      return {
        provider,
        used,
        limit,
        percentage,
      };
    });

    return NextResponse.json({
      month: usage.month,
      totalSearches: usage.totalSearches,
      lastUpdated: usage.lastUpdated,
      providers: breakdown,
    });
  } catch (error: any) {
    console.error('Usage API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
