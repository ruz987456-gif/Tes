import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RankEmblem } from '../components/RankEmblem';
import { api } from '../services/api';
import {
  Flame,
  Award,
  BookOpen,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface DashboardMuridProps {
  onSelectTab: (tab: string) => void;
}

export const DashboardMurid: React.FC<DashboardMuridProps> = ({ onSelectTab }) => {
  const { user, refreshUser } = useAuth();
  const [targets, setTargets] = useState<any[]>([]);
  const [murajaahSession, setMurajaahSession] = useState<any>(null);
  const [teacherNotes, setTeacherNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [targetsRes, mrjRes, attRes] = await Promise.all([
        api.getTargets(),
        api.getMurajaahSession(),
        api.getAttendance()
      ]);
      setTargets(targetsRes.targets || []);
      setMurajaahSession(mrjRes.session || null);
      setTeacherNotes(attRes.notes || []);
    } catch (e) {
      console.error('Failed to load murid dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickCheckIn = async (status: string) => {
    try {
      setCheckingIn(true);
      const res = await api.checkInAttendance({ status, notes: 'Presensi mandiri beranda murid' });
      setCheckInMsg(res.message);
      await refreshUser();
      await loadDashboardData();
    } catch (e: any) {
      setCheckInMsg(e.message);
    } finally {
      setCheckingIn(false);
    }
  };

  if (!user) return null;

  const activeTargets = targets.filter(t => t.status === 'aktif');
  const completedTargets = targets.filter(t => t.status === 'selesai');

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* 1. Profil & Rank Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* User Info & Emblem */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative">
              <RankEmblem rank={user.rank} size="xl" />
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-slate-900 border border-amber-500/40 text-[10px] font-black text-amber-400">
                Lvl {user.rank.order}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{user.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {user.rank.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">@{user.username} • Anggota Halaqah Tahfiz</p>

              {/* Badges: Streak & Activity */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-950/60 border border-orange-500/30 text-orange-400 text-xs font-bold">
                  <Flame className="w-4 h-4 fill-orange-500" />
                  <span>{user.streak} Hari Berturut-turut</span>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  user.todayActiveLearning
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{user.todayActiveLearning ? 'Belajar Aktif Hari Ini' : 'Belum Ada Belajar Hari Ini'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* XP & Next Rank Progress Box */}
          <div className="w-full md:w-80 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Total Perolehan XP:</span>
              <span className="text-2xl font-black text-amber-400 tracking-tight">
                {user.xp.toLocaleString('id-ID')} <span className="text-xs font-bold text-amber-500">XP</span>
              </span>
            </div>

            {/* Rank Progress Bar */}
            {user.rankProgress.nextRank ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Progres ke {user.rankProgress.nextRank.name}</span>
                  <span className="font-bold text-amber-400">{user.rankProgress.percent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(4, user.rankProgress.percent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-right mt-1">
                  Butuh <span className="font-bold text-slate-200">{user.rankProgress.xpNeeded.toLocaleString('id-ID')} XP</span> lagi
                </p>
              </div>
            ) : (
              <div className="py-2 text-center text-xs font-bold text-amber-400 bg-amber-500/10 rounded-xl border border-amber-500/20">
                👑 Rank Tertinggi Grandmaster Tercapai!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Today Attendance & Learning Alert Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-400" />
                Absensi Kehadiran Hari Ini
              </span>
              <span className="text-[11px] text-slate-400">Asia/Makassar</span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase ${
                user.todayAttendanceStatus === 'hadir'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : user.todayAttendanceStatus === 'izin'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : user.todayAttendanceStatus === 'sakit'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}>
                {user.todayAttendanceStatus ? user.todayAttendanceStatus.toUpperCase() : 'BELUM PRESENSI'}
              </div>
              <p className="text-xs text-slate-300">
                {user.todayAttendanceStatus
                  ? 'Kehadiranmu hari ini telah tercatat.'
                  : 'Tekan tombol presensi untuk mencatat kehadiran hari ini.'}
              </p>
            </div>
          </div>

          {!user.todayAttendanceStatus && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleQuickCheckIn('hadir')}
                disabled={checkingIn}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
              >
                Hadir
              </button>
              <button
                onClick={() => handleQuickCheckIn('izin')}
                disabled={checkingIn}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold rounded-xl transition border border-slate-700"
              >
                Izin
              </button>
              <button
                onClick={() => handleQuickCheckIn('sakit')}
                disabled={checkingIn}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl transition border border-slate-700"
              >
                Sakit
              </button>
            </div>
          )}

          {checkInMsg && <p className="text-[11px] text-amber-300 mt-2">{checkInMsg}</p>}
        </div>

        {/* Teacher's Latest Motivational Note */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                Pesan Bimbingan Guru
              </span>
              <button
                onClick={() => onSelectTab('catatan_guru')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-0.5"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {teacherNotes.length > 0 ? (
              <div className="mt-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{teacherNotes[0].message}"
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-amber-300">{teacherNotes[0].teacherName}</span>
                  <span>{new Date(teacherNotes[0].createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">
                Belum ada catatan baru dari ustadz/ustadzah pembina.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Quick Access Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectTab('hafalan')}
          className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Target Hafalan</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{activeTargets.length} target aktif</p>
        </button>

        <button
          onClick={() => onSelectTab('murajaah')}
          className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/40 text-left transition group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Murajaah 75x</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Hadiah +300 XP</p>
        </button>

        <button
          onClick={() => onSelectTab('peringkat')}
          className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-yellow-500/40 text-left transition group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Papan Peringkat</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Lihat kompetisi XP</p>
        </button>

        <button
          onClick={() => onSelectTab('riwayat_xp')}
          className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 text-left transition group shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Riwayat XP</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Audit ledger perolehan</p>
        </button>
      </div>

      {/* 4. Active Memorization Targets Highlights */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Target Hafalan yang Sedang Berjalan
            </h2>
            <p className="text-xs text-slate-400">
              Selesaikan 5 bagian dan 4 tahapan untuk memperoleh total 250 XP per target.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('hafalan')}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            Kelola Target <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {activeTargets.length === 0 ? (
          <div className="py-10 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 p-6">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-300">Belum Ada Target Hafalan Aktif</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Buat target baru dengan memilih dari database 114 surah Al-Qur'an.
            </p>
            <button
              onClick={() => onSelectTab('hafalan')}
              className="mt-4 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
            >
              + Buat Target Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTargets.map((target: any) => {
              const completedSections = target.sections.filter((s: any) => s.status === 'selesai').length;
              const percent = Math.round((completedSections / 5) * 100);

              return (
                <div
                  key={target.id}
                  onClick={() => onSelectTab('hafalan')}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-quran text-xl font-bold">
                      {target.surahArabic || 'ق'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{target.title}</h4>
                        <span className="text-xs text-amber-400 font-semibold">
                          Surah ke-{target.surahNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ayat {target.startAyah} - {target.endAyah} • Dibagi 5 Bagian
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-48 text-right">
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Progres Bagian</span>
                      <span className="font-bold text-amber-400">{completedSections}/5 Bagian ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
