import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xl border border-amber-300 animate-pulse">
      <WifiOff className="w-4 h-4 text-slate-950" />
      <span>Mode Offline — Data tersimpan secara lokal.</span>
    </div>
  );
};
