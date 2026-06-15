import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Candidate } from '@/lib/models/Candidate';
import { verifySessionToken } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    const listId = params.id;
    const body = await request.json().catch(() => ({}));
    const { name, profileUrl, headline, location, snippet, relevanceScore, searchQuery } = body;

    if (!name || !profileUrl) {
      return NextResponse.json({ error: 'Name and profile URL are required fields.' }, { status: 400 });
    }

    // Clean LinkedIn URL before query check
    let cleanProfileUrl = profileUrl.trim();
    if (!/^https?:\/\//i.test(cleanProfileUrl)) {
      cleanProfileUrl = 'https://' + cleanProfileUrl;
    }
    try {
      const parsed = new URL(cleanProfileUrl);
      parsed.search = '';
      parsed.hash = '';
      if (parsed.hostname.endsWith('linkedin.com')) {
        parsed.hostname = 'www.linkedin.com';
      }
      cleanProfileUrl = parsed.toString();
    } catch (e) {
      // Keep as-is
    }

    // Check if the candidate is already saved in this list
    const existing = await Candidate.findOne({ listId, profileUrl: cleanProfileUrl });
    if (existing) {
      // Toggle logic: If already saved, remove the candidate from the list (unsave)
      await Candidate.findByIdAndDelete(existing._id);
      return NextResponse.json({ success: true, action: 'removed', candidateId: existing._id });
    }

    // Add candidate to the list
    const newCandidate = await Candidate.create({
      listId,
      name,
      profileUrl: cleanProfileUrl,
      headline: headline || 'LinkedIn Professional',
      location: location || 'Remote / Unknown',
      snippet: snippet || '',
      relevanceScore: relevanceScore || 1,
      searchQuery: searchQuery || '',
      status: 'to_contact',
      notes: '',
      tags: [],
    });

    return NextResponse.json(
      { success: true, action: 'added', candidate: newCandidate },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST Candidate API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
