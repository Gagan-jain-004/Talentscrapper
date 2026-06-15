import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AuthAttempt } from '@/lib/models/AuthAttempt';
import { createSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const { pin } = body;

    // Retrieve client IP for lockout tracking
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Count failed attempts within the 30-second sliding TTL window
    const failedAttemptsCount = await AuthAttempt.countDocuments({ ip });
    if (failedAttemptsCount >= 5) {
      return NextResponse.json(
        { error: 'Too many wrong attempts. Locked out for 30 seconds.' },
        { status: 429 }
      );
    }

    const ACCESS_PIN = process.env.ACCESS_PIN;
    if (!ACCESS_PIN) {
      return NextResponse.json(
        { error: 'Access PIN is not configured on the server environment.' },
        { status: 500 }
      );
    }

    if (pin === ACCESS_PIN) {
      // Clear previous failed attempts on successful login
      await AuthAttempt.deleteMany({ ip });

      const token = await createSessionToken();
      const response = NextResponse.json({ success: true });

      response.cookies.set('recruiter_auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return response;
    } else {
      // Record a new failed login attempt
      await AuthAttempt.create({ ip, createdAt: new Date() });
      const currentAttempts = await AuthAttempt.countDocuments({ ip });

      return NextResponse.json(
        {
          error: 'Incorrect PIN.',
          attemptsRemaining: Math.max(0, 5 - currentAttempts),
          lockedOut: currentAttempts >= 5,
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Auth API route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
