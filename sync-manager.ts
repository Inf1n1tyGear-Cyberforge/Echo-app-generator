import { getAllOffline, deleteOffline, isOnline, saveOffline } from './offline-storage';
import { supabase } from './supabase';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'synced';

type SyncListener = (status: SyncStatus) => void;

class SyncManager {
  private listeners: SyncListener[] = [];
  private _status: SyncStatus = 'idle';
  private syncInProgress = false;

  get status(): SyncStatus {
    return this._status;
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this._status));
  }

  private setStatus(s: SyncStatus) {
    this._status = s;
    this.notify();
  }

  async sync(): Promise<void> {
    if (this.syncInProgress) return;
    if (!(await isOnline())) {
      this.setStatus('idle');
      return;
    }

    this.syncInProgress = true;
    this.setStatus('syncing');

    try {
      const pending = await getAllOffline<{
        id: number;
        action: 'insert' | 'update' | 'delete';
        table: string;
        record_id?: string;
        data?: Record<string, unknown>;
        created_at: string;
      }>('pendingSync');

      for (const item of pending) {
        try {
          if (item.action === 'insert' && item.data) {
            const { error } = await supabase
              .from(item.table as any)
              .insert(item.data);
            if (error) throw error;
          } else if (item.action === 'update' && item.record_id && item.data) {
            const { error } = await supabase
              .from(item.table as any)
              .update(item.data)
              .eq('id', item.record_id);
            if (error) throw error;
          }
          await deleteOffline('pendingSync', item.id);
        } catch (err) {
          console.warn(`Sync failed for ${item.table} item ${item.id}:`, err);
        }
      }

      this.setStatus('synced');
      setTimeout(() => {
        if (this._status === 'synced') {
          this.setStatus('idle');
        }
      }, 3000);
    } catch (err) {
      console.error('Sync error:', err);
      this.setStatus('error');
    } finally {
      this.syncInProgress = false;
    }
  }

  async queueOfflineInsert(table: string, data: Record<string, unknown>): Promise<void> {
    await saveOffline('pendingSync', {
      action: 'insert',
      table,
      data,
      created_at: new Date().toISOString(),
    });
  }

  async queueOfflineUpdate(table: string, recordId: string, data: Record<string, unknown>): Promise<void> {
    await saveOffline('pendingSync', {
      action: 'update',
      table,
      record_id: recordId,
      data,
      created_at: new Date().toISOString(),
    });
  }
}

export const syncManager = new SyncManager();

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncManager.sync();
  });
}
