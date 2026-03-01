import { NextRequest, NextResponse } from 'next/server';
import { sqliteEventRepository } from '@/infrastructure/persistence/server/sqlite-event-repository';
import { validateSession, isAuthConfigured } from '@/lib/auth';
import type { FeverEvent } from '@/application/ports/event-repository';

interface PushRequest {
  clientId: string;
  events: FeverEvent[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication if configured
    if (isAuthConfigured()) {
      const isAuthenticated = await validateSession();
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const body: PushRequest = await request.json();
    const { clientId, events } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'events must be an array' },
        { status: 400 }
      );
    }

    if (events.length === 0) {
      return NextResponse.json({
        saved: 0,
        conflicts: [],
      });
    }

    // Validate events have required fields
    for (const event of events) {
      if (!event.id || !event.type || !event.timestamp) {
        return NextResponse.json(
          { error: 'Each event must have id, type, and timestamp' },
          { status: 400 }
        );
      }
    }

    // Save events to server database
    const result = sqliteEventRepository.saveMany(events);

    return NextResponse.json({
      saved: result.saved,
      conflicts: result.conflicts,
    });
  } catch (error) {
    console.error('Sync push error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
