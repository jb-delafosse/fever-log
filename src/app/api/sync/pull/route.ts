import { NextRequest, NextResponse } from 'next/server';
import { sqliteEventRepository } from '@/infrastructure/persistence/server/sqlite-event-repository';
import { validateSession, isAuthConfigured } from '@/lib/auth';

interface SyncCheckpoint {
  updatedAt: number;
  id: string;
}

interface PullRequest {
  clientId: string;
  checkpoint: SyncCheckpoint | null;
  limit?: number;
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

    const body: PullRequest = await request.json();
    const { clientId, checkpoint, limit = 100 } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    // Get changes since the provided checkpoint
    const result = sqliteEventRepository.getChangesSince(checkpoint, limit);

    // Update client's last sync timestamp
    if (result.checkpoint) {
      sqliteEventRepository.updateClientCheckpoint(clientId, result.checkpoint);
    }

    return NextResponse.json({
      events: result.events,
      checkpoint: result.checkpoint,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Sync pull error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
