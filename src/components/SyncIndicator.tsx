import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { syncManager, type SyncStatus } from '../lib/sync-manager';
import { isOnline } from '../lib/offline-storage';

export default function SyncIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsub = syncManager.subscribe(setSyncStatus);
    return unsub;
  }, []);

  useEffect(() => {
    const checkOnline = async () => {
      setOnline(await isOnline());
    };
    checkOnline();

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = () => {
    syncManager.sync();
  };

  if (!online) {
    return (
      <button
        onClick={handleSync}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
        title="You are offline. Click to retry connection."
      >
        <CloudOff className="w-3.5 h-3.5" />
        Offline
      </button>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Syncing...
      </div>
    );
  }

  if (syncStatus === 'synced') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Synced
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <button
        onClick={handleSync}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
        title="Sync failed. Click to retry."
      >
        <AlertCircle className="w-3.5 h-3.5" />
        Sync Error
      </button>
    );
  }

  return (
    <button
      onClick={handleSync}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
      title="All synced. Click to force sync."
    >
      <Cloud className="w-3.5 h-3.5" />
      Synced
    </button>
  );
}
