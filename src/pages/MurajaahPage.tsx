import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SURAHS_DATA } from '../data/surahs';
import {
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  Minus,
  Plus,
  History,
  BookOpen,
  Trophy,
  Flame,
  AlertCircle
} from 'lucide-react';

export const MurajaahPage: React.FC = () => {
  const { refreshUser, triggerRankCelebration } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(78);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessRes, histRes] = await Promise.all([
        api.getMurajaahSession(),
        api.getMurajaahHistory()
      ]);
      setSession(sessRes.session || null);
      setHistory(histRes.history || []);
    } catch (err) {
      console.error('Failed to load murajaah data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStep = async (delta: number) => {
    if (!session || session.status === 'selesai') return;
    try {
      const res = await api.stepMurajaah({ sessionId: session.id, delta });
      setSession(res.session);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengubah hitungan.');
    }
  };

  const handleComplete = async () => {
    if (!session || session.repetitions < 75) return;
    try {
      setCompleting(true);
      const idempotencyKey = `mrj-comp-${session.id}-${Date.now()}`;
      const res = await api.completeMurajaah({
        sessionId: session.id,
        idempotencyKey
      });

      setMessage(res.message);
      if (res.rankedUp && res.prevRank && res.rank) {
        triggerRankCelebration(res.prevRank, res.rank, res.totalNetXp);
      }

      await refreshUser();
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyelesaikan sesi murajaah.');
    } finally {
      setCompleting(false);
    }
  };

  const handleStartNewSession = async () => {
    try {
      setLoading(true);
      setMessage('');
      setErrorMessage('');
      const res = await api.getMurajaahSession({ surahNumber: selectedSurahNum });
      setSession(res.session);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memulai sesi baru.');
    } finally {
      setLoading(false);
    }
  };

  const currentReps = session ? session.repetitions : 0;
  const isGoalReached = currentReps >= 75;
  const progressPercent = Math.min(100, Math.round((currentReps / 75) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
          <RotateCcw className="w-3.5 h-3.5" />
          Disiplin Menjaga Hafalan
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Sesi Murajaah 75x Pengulangan</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Ulangi hafalanmu sebanyak 75 kali untuk mengikat ayat dalam ingatan. Selesaikan satu sesi untuk mendapatkan <span className="font-bold text-amber-400">+300 XP</span>!
        </p>
      </div>

      {/* Main Counter Hub */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden text-center max-w-md mx-auto">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Status messages */}
        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Selected Quran Surah Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-300">
            {session?.surahName || 'Murajaah Mandiri'}
          </span>
        </div>

        {/* Big Circular Counter Ring */}
        <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
          {/* SVG Progress Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="90"
              className="text-slate-800/80"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="112"
              cy="112"
              r="90"
              className="text-amber-500 transition-all duration-300 ease-out"
              strokeWidth="12"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={2 * Math.PI * 90 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Center Counter Details */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-white tracking-tight">
              {currentReps}
            </span>
            <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
              / 75 Pengulangan
            </span>
            <span className="text-[11px] font-bold text-amber-400 mt-1">
              {progressPercent}% Target
            </span>
          </div>
        </div>

        {/* Counter Action Buttons */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => handleStep(-1)}
            disabled={currentReps <= 0 || session?.status === 'selesai'}
            className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center justify-center transition active:scale-95 border border-slate-700"
            title="Kurangi Hitungan (jika salah pencet)"
          >
            <Minus className="w-6 h-6 stroke-[3]" />
          </button>

          <button
            onClick={() => handleStep(1)}
            disabled={isGoalReached || session?.status === 'selesai'}
            className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-black flex flex-col items-center justify-center shadow-xl shadow-amber-500/30 transition active:scale-90"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
            <span className="text-xs font-black uppercase tracking-wider">Ulang</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset hitungan sesi saat ini ke 0?')) {
                // step down to 0
                for (let i = 0; i < currentReps; i++) {
                  handleStep(-1);
                }
              }
            }}
            disabled={currentReps <= 0 || session?.status === 'selesai'}
            className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center justify-center transition active:scale-95 border border-slate-700"
            title="Reset ke 0"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Complete Session & Claim 300 XP Button */}
        <div className="mt-8">
          {session?.status === 'selesai' ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Sesi Ini Telah Tuntas & Memperoleh +300 XP
              </div>
              <button
                onClick={handleStartNewSession}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-sky-600/25"
              >
                Mulai Sesi Murajaah Baru (+300 XP)
              </button>
            </div>
          ) : isGoalReached ? (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/30 transition animate-pulse flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5 text-slate-950" />
              <span>{completing ? 'Memproses Klaim...' : 'Selesaikan Sesi (Klaim +300 XP) 🏆'}</span>
            </button>
          ) : (
            <p className="text-xs text-slate-400">
              Lengkapi hingga <span className="font-bold text-amber-400">75 pengulangan</span> untuk membuka klaim 300 XP.
            </p>
          )}
        </div>
      </div>

      {/* Murajaah History Table / Cards */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">Riwayat Sesi Murajaah Selesai</h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            Total {history.length} Sesi Tercatat
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada riwayat sesi murajaah 75x yang diselesaikan.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {history.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/20">
                    75x
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.surahName || 'Murajaah Al-Qur\'an'}</h4>
                    <p className="text-[10px] text-slate-400">
                      Diselesaikan pada {new Date(item.completedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold">
                    +{item.xpAwarded} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
