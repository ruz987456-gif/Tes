import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RankEmblem } from './RankEmblem';
import { Sparkles, Trophy, ArrowRight, X } from 'lucide-react';

export const RankCelebrationModal: React.FC = () => {
  const { rankCelebrationData, closeRankCelebration } = useAuth();
  const { isOpen, prevRank, newRank, xp } = rankCelebrationData;

  if (!isOpen || !newRank) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-center overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeRankCelebration}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Mubarak! Kenaikan Rank
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          SELAMAT NAIK RANK!
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Usaha dan konsistensi hafalannmu membuahkan hasil berkah.
        </p>

        {/* Rank Comparison Visual */}
        <div className="my-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-around gap-2">
          {prevRank && (
            <div className="flex flex-col items-center opacity-70">
              <RankEmblem rank={prevRank} size="sm" />
              <span className="text-xs text-slate-400 mt-1">{prevRank.name}</span>
            </div>
          )}

          {prevRank && <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse" />}

          <div className="flex flex-col items-center scale-110">
            <RankEmblem rank={newRank} size="lg" />
            <span className={`text-base font-extrabold mt-1 ${newRank.color}`}>
              {newRank.name}
            </span>
          </div>
        </div>

        {/* Total XP Score */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-sm text-slate-300">Total Perolehan:</span>
          <span className="text-lg font-black text-amber-400">{xp.toLocaleString('id-ID')} XP</span>
        </div>

        {/* Action Button */}
        <button
          onClick={closeRankCelebration}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/25 transition transform active:scale-95"
        >
          Lanjutkan Hafalan & Murajaah 🚀
        </button>
      </div>
    </div>
  );
};
