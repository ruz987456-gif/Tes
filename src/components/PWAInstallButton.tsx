import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'navbar' | 'card' }> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'navbar') {
      return (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
          title="Pasang Aplikasi HIFZUP ke Perangkat"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Install PWA</span>
        </button>
      );
    }

    return (
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-white">Pasang Aplikasi HIFZUP</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Akses langsung dari layar utama tanpa membuka browser.
          </p>
        </div>
        <button
          onClick={install}
          className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition shrink-0"
        >
          Pasang
        </button>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          title="Petunjuk Pasang di iPhone/iPad"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Pasang HIFZUP di iPhone/iPad</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed text-left bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-sky-400 shrink-0" />
                  1. Ketuk tombol <strong>Share</strong> (Bagikan) di bilah bawah Safari.
                </span>
                <span className="flex items-center gap-2">
                  <PlusSquare className="w-4 h-4 text-amber-400 shrink-0" />
                  2. Gulir ke bawah dan ketuk <strong>Tambah ke Layar Utama</strong> (Add to Home Screen).
                </span>
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
