import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { List } from '@/lib/models/List';
import { Candidate } from '@/lib/models/Candidate';
import { verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    const list = await List.findById(id).populate('candidateCount');
    if (!list) {
      return NextResponse.json({ error: 'List not found.' }, { status: 404 });
    }

    const candidates = await Candidate.find({ listId: id }).sort({ savedAt: -1 });

    return NextResponse.json({
      list,
      candidates,
    });
  } catch (error: any) {
    console.error('GET Single List API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { name, color, emoji, description } = body;

    const list = await List.findById(id);
    if (!list) {
      return NextResponse.json({ error: 'List not found.' }, { status: 404 });
    }

    if (name !== undefined) list.name = name;
    if (color !== undefined) list.color = color;
    if (emoji !== undefined) list.emoji = emoji;
    if (description !== undefined) list.description = description;

    await list.save();

    return NextResponse.json(list);
  } catch (error: any) {
    console.error('PATCH List API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('recruiter_auth')?.value;
    const isAuthorized = await verifySessionToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    const list = await List.findById(id);
    if (!list) {
      return NextResponse.json({ error: 'List not found.' }, { status: 404 });
    }

    // Cascade delete all candidates belonging to this list
    await Candidate.deleteMany({ listId: id });
    // Delete the list itself
    await List.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'List and associated candidates successfully deleted.' });
  } catch (error: any) {
    console.error('DELETE List API Route error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
