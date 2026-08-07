import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { syncManager } from '../lib/sync-manager';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SessionRow = Record<string, unknown>;

/**
 * Subscribe to Supabase Realtime channels for live session sync.
 * Automatically syncs pending offline operations when coming online
 * and subscribes to changes on the user's sessions table.
 */
export function useRealtimeSync(userId: string | null | undefined) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleSessionChange = useCallback(
    (payload: RealtimePostgresChangesPayload<SessionRow>) => {
      console.debug('[Realtime] Session change:', payload.eventType, payload.new?.id);
      // The AppContext will refresh on next render;
      // we trigger a re-sync in case local state is stale
      syncManager.sync();
    },
    [],
  );

  useEffect(() => {
    if (!userId) return;

    // Unsubscribe previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to changes on sessions owned by this user
    const channel = supabase
      .channel('echo-realtime-sync')
      .on<SessionRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `user_id=eq.${userId}`,
        },
        handleSessionChange,
      )
      .subscribe((status) => {
        console.debug('[Realtime] Channel status:', status);
      });

    channelRef.current = channel;

    // Sync pending offline operations on mount
    syncManager.sync();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, handleSessionChange]);

  /**
   * Manually trigger a sync of pending offline operations.
   */
  const triggerSync = useCallback(() => {
    syncManager.sync();
  }, []);

  return { triggerSync };
}
