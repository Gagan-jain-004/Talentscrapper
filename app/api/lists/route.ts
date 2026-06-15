import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { List } from '@/lib/models/List';
import { Candidate } from '@/lib/models/Candidate'; // Ensure Candidate model is loaded in Mongoose Registry
import { verifySessionToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    const lists = await List.find().sort({ createdAt: -1 });
    
    // For each list, retrieve its saved candidate profile URLs for dropdown checkboxes
    const listsWithSavedUrls = await Promise.all(
      lists.map(async (list) => {
        const candidates = await Candidate.find({ listId: list._id }, 'profileUrl');
        const count = candidates.length;
        
        return {
          ...list.toJSON(),
          candidateCount: count,
          savedUrls: candidates.map((c) => c.profileUrl),
        };
      })
    );

    return NextResponse.json(listsWithSavedUrls);
  } catch (error: any) {
    console.error('GET Lists API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json().catch(() => ({}));
    const { name, color, emoji, description } = body;

    if (!name || !color || !emoji) {
      return NextResponse.json({ error: 'Name, color, and emoji are required.' }, { status: 400 });
    }

    const newList = await List.create({
      name,
      color,
      emoji,
      description: description || '',
    });

    return NextResponse.json(newList, { status: 201 });
  } catch (error: any) {
    console.error('POST List API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
