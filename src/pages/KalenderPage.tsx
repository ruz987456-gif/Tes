import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  Clock,
  Sparkles
} from 'lucide-react';

export const KalenderPage: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [learningDays, setLearningDays] = useState<any[]>([]);
  const [teacherNotes, setTeacherNotes] = useState<any[]>([]);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getAttendance();
      setAttendanceRecords(res.records || []);
      setLearningDays(res.learningDays || []);
      setTeacherNotes(res.notes || []);
      setPenalties(res.penalties || []);
    } catch (err) {
      console.error('Failed to load attendance calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Generate calendar days
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    calendarCells.push({ day, dateStr });
  }

  // Selected Date Details
  const selectedAtt = attendanceRecords.find(a => a.localDate === selectedDateStr);
  const selectedLearn = learningDays.find(l => l.localDate === selectedDateStr);
  const selectedNotes = teacherNotes.filter(n => n.createdAt.startsWith(selectedDateStr));
  const selectedPenalties = penalties.filter(p => p.createdAt.startsWith(selectedDateStr));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Kalender Absensi & Belajar Harian</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Standar Waktu: <span className="font-semibold text-slate-300">WITA (Asia/Makassar)</span>. Absensi kehadiran dan hari belajar aktif tercatat terpisah.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1">
          <button
            onClick={prevMonth}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-white px-3 min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar + Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols on large) */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, idx) => (
              <span key={d} className={`text-xs font-bold py-1 ${idx === 0 || idx === 5 ? 'text-amber-400' : 'text-slate-400'}`}>
                {d}
              </span>
            ))}
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-16 sm:h-20 bg-slate-950/20 rounded-xl" />;
              }

              const att = attendanceRecords.find(a => a.localDate === cell.dateStr);
              const learn = learningDays.find(l => l.localDate === cell.dateStr);
              const hasPenalty = penalties.some(p => p.createdAt.startsWith(cell.dateStr));
              const isSelected = selectedDateStr === cell.dateStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`h-16 sm:h-20 p-1.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                      : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                      {cell.day}
                    </span>
                    {learn?.activeLearning && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" title="Aktif Belajar" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {att && (
                      <div className={`text-[9px] font-extrabold px-1 rounded uppercase text-center truncate ${
                        att.status === 'hadir'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : att.status === 'izin'
                          ? 'bg-sky-500/20 text-sky-300'
                          : att.status === 'sakit'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {att.status}
                      </div>
                    )}

                    {hasPenalty && (
                      <div className="text-[8px] font-bold text-red-400 bg-red-950/80 px-0.5 rounded text-center truncate">
                        Sanksi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Hari Belajar Aktif (Hafalan / Murajaah)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/30 text-emerald-400 text-[10px] flex items-center justify-center font-bold">H</span>
              <span>Hadir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-sky-500/30 text-sky-400 text-[10px] flex items-center justify-center font-bold">I</span>
              <span>Izin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-amber-500/30 text-amber-400 text-[10px] flex items-center justify-center font-bold">S</span>
              <span>Sakit</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Rincian Tanggal
              </h2>
              <span className="text-xs font-bold text-amber-400">
                {selectedDateStr}
              </span>
            </div>

            <div className="space-y-4">
              {/* Attendance Status */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Status Presensi
                </span>
                {selectedAtt ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-emerald-400 uppercase">
                      {selectedAtt.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Dicatat: {new Date(selectedAtt.recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Tidak ada catatan presensi pada tanggal ini.</span>
                )}
              </div>

              {/* Learning Activity */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Aktivitas Belajar Sah
                </span>
                {selectedLearn?.activeLearning ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hari Belajar Aktif Terkonfirmasi</span>
                    </div>
                    <p className="text-xs text-slate-300">{selectedLearn.summary || 'Aktivitas pengulangan hafalan atau murajaah selesai.'}</p>
                    {selectedLearn.repCount > 0 && (
                      <p className="text-[11px] text-slate-400">Pengulangan Tahap: {selectedLearn.repCount}x</p>
                    )}
                    {selectedLearn.murajaahReps > 0 && (
                      <p className="text-[11px] text-slate-400">Pengulangan Murajaah: {selectedLearn.murajaahReps}x</p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    Tidak ada aktivitas hafalan atau murajaah yang diselesaikan.
                  </span>
                )}
              </div>

              {/* Teacher Notes on Date */}
              {selectedNotes.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-500/30">
                  <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Catatan Guru
                  </span>
                  {selectedNotes.map((n, i) => (
                    <p key={i} className="text-xs text-slate-200 italic mt-1">"{n.message}"</p>
                  ))}
                </div>
              )}

              {/* Inactivity Penalty on Date */}
              {selectedPenalties.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40">
                  <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Sanksi Tidak Aktif
                  </span>
                  {selectedPenalties.map((p, i) => (
                    <p key={i} className="text-xs text-red-200">
                      {p.reason} ({p.amount} XP)
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
