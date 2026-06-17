import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SearchHistory } from '@/lib/models/SearchHistory';
import { verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    // Retrieve the last 20 searches, newest first
    const history = await SearchHistory.find().sort({ searchedAt: -1 }).limit(20);

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('GET Search History API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    await SearchHistory.deleteMany({});

    return NextResponse.json({ success: true, message: 'Search history cleared.' });
  } catch (error: any) {
    console.error('DELETE Search History API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
