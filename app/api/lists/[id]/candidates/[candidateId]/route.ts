import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Candidate } from '@/lib/models/Candidate';
import { verifySessionToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; candidateId: string } }
) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    const { candidateId } = params;
    const body = await request.json().catch(() => ({}));
    const { status, notes, tags } = body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    if (status !== undefined) candidate.status = status;
    if (notes !== undefined) candidate.notes = notes;
    if (tags !== undefined) candidate.tags = tags;

    await candidate.save();

    return NextResponse.json(candidate);
  } catch (error: any) {
    console.error('PATCH Candidate API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; candidateId: string } }
) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    const { candidateId } = params;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    await Candidate.findByIdAndDelete(candidateId);

    return NextResponse.json({ success: true, message: 'Candidate removed from list successfully.' });
  } catch (error: any) {
    console.error('DELETE Candidate API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
