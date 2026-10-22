import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RankEmblem } from '../components/RankEmblem';
import {
  Users,
  GraduationCap,
  Sparkles,
  MessageSquare,
  Award,
  Search,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  Calendar,
  ChevronRight,
  X,
  AlertCircle,
  UserPlus,
  Trash2
} from 'lucide-react';

export const DashboardGuru: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected student for detail drawer/modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Bonus XP Modal
  const [bonusModalStudent, setBonusModalStudent] = useState<any | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(100);
  const [bonusReason, setBonusReason] = useState<string>('Konsisten melakukan murajaah');
  const [bonusNote, setBonusNote] = useState<string>('');
  const [submittingBonus, setSubmittingBonus] = useState(false);
  const [bonusSuccess, setBonusSuccess] = useState('');
  const [bonusError, setBonusError] = useState('');

  // Note Modal
  const [noteModalStudent, setNoteModalStudent] = useState<any | null>(null);
  const [noteMessage, setNoteMessage] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState('');
  const [noteError, setNoteError] = useState('');

  // Add Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentFullName, setNewStudentFullName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [submittingAddStudent, setSubmittingAddStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState('');
  const [addStudentSuccess, setAddStudentSuccess] = useState('');

  // Delete Student Modal
  const [deleteModalStudent, setDeleteModalStudent] = useState<any | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getTeacherStudents();
      setStudents(res.students || []);
    } catch (err) {
      console.error('Failed to load teacher students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const openStudentDetail = async (studentId: string) => {
    try {
      setLoadingDetail(true);
      const res = await api.getStudentDetail(studentId);
      setSelectedStudentDetail(res);
    } catch (err) {
      console.error('Failed to load student detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGiveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusModalStudent) return;
    setBonusError('');
    setBonusSuccess('');
    setSubmittingBonus(true);

    try {
      const idempotencyKey = `bonus-${bonusModalStudent.id}-${Date.now()}`;
      const res = await api.giveBonusXp({
        studentId: bonusModalStudent.id,
        amount: bonusAmount,
        reason: bonusReason,
        note: bonusNote,
        idempotencyKey
      });

      setBonusSuccess(res.message);
      await loadStudents();
      if (selectedStudentDetail && selectedStudentDetail.student.id === bonusModalStudent.id) {
        await openStudentDetail(bonusModalStudent.id);
      }
      setTimeout(() => {
        setBonusModalStudent(null);
        setBonusSuccess('');
      }, 1500);
    } catch (err: any) {
      setBonusError(err.message || 'Gagal memberikan bonus XP.');
    } finally {
      setSubmittingBonus(false);
    }
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteModalStudent) return;
    setNoteError('');
    setNoteSuccess('');
    setSubmittingNote(true);

    try {
      const res = await api.sendTeacherNote({
        studentId: noteModalStudent.id,
        message: noteMessage
      });
      setNoteSuccess(res.message);
      if (selectedStudentDetail && selectedStudentDetail.student.id === noteModalStudent.id) {
        await openStudentDetail(noteModalStudent.id);
      }
      setTimeout(() => {
        setNoteModalStudent(null);
        setNoteMessage('');
        setNoteSuccess('');
      }, 1500);
    } catch (err: any) {
      setNoteError(err.message || 'Gagal mengirim catatan.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError('');
    setAddStudentSuccess('');
    setSubmittingAddStudent(true);

    try {
      const res = await api.createTeacherStudent({
        fullName: newStudentFullName,
        username: newStudentUsername,
        password: newStudentPassword
      });
      setAddStudentSuccess(res.message);
      setNewStudentFullName('');
      setNewStudentUsername('');
      setNewStudentPassword('');
      await loadStudents();
      setTimeout(() => {
        setShowAddStudentModal(false);
        setAddStudentSuccess('');
      }, 1200);
    } catch (err: any) {
      setAddStudentError(err.message || 'Gagal mendaftarkan santri.');
    } finally {
      setSubmittingAddStudent(false);
    }
  };

  const handleDeleteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModalStudent) return;
    setDeleteError('');
    setSubmittingDelete(true);

    try {
      await api.deleteTeacherStudent(deleteModalStudent.id);
      if (selectedStudentDetail && selectedStudentDetail.student.id === deleteModalStudent.id) {
        setSelectedStudentDetail(null);
      }
      setDeleteModalStudent(null);
      setDeleteConfirmText('');
      await loadStudents();
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus akun santri.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Teacher Hero Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/50 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{user?.fullName}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Pembina Tahfiz
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pantau kemajuan hafalan santri, berikan bonus XP berprestasi, dan kirimkan motivasi harian.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="text-center px-3">
              <span className="block text-xl font-black text-white">{students.length}</span>
              <span className="text-[10px] font-semibold text-slate-400">Santri Bimbingan</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-3">
              <span className="block text-xl font-black text-emerald-400">
                {students.filter(s => s.todayActiveLearning).length}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Belajar Hari Ini</span>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Daftar Santri Bimbingan
          </h2>
          <p className="text-xs text-slate-400">Pilih santri untuk meninjau rincian perkembangan 5 bagian hafalan & murajaah.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            onClick={() => {
              setShowAddStudentModal(true);
              setAddStudentError('');
              setAddStudentSuccess('');
            }}
            className="py-2 px-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            + Tambah Santri
          </button>
        </div>
      </div>

      {/* Students Grid / Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Memuat data santri...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-200">Belum Ada Santri Terdaftar</h4>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
            Semua akun santri fiktif telah dibersihkan. Santri dapat mendaftar mandiri melalui portal aplikasi atau Anda dapat mendaftarkan santri baru ke halaqah Anda sekarang.
          </p>
          <button
            onClick={() => {
              setShowAddStudentModal(true);
              setAddStudentError('');
              setAddStudentSuccess('');
            }}
            className="mt-4 inline-flex items-center gap-2 py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            Daftarkan Santri Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition flex flex-col justify-between"
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-lg">
                          {student.fullName.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1">
                        <RankEmblem rank={student.rank} size="xs" />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-sm">{student.fullName}</h3>
                      <p className="text-[11px] text-slate-400">@{student.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-extrabold ${student.rank.color}`}>
                          {student.rank.name}
                        </span>
                        <span className="text-[10px] font-bold text-amber-400">
                          {student.xp.toLocaleString('id-ID')} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      student.todayActiveLearning
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {student.todayActiveLearning ? 'Belajar Hari Ini' : 'Belum Belajar'}
                    </span>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 mb-4 text-center">
                  <div>
                    <span className="block text-xs font-bold text-white">{student.activeTargets}</span>
                    <span className="text-[10px] text-slate-400">Target Aktif</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">{student.completedTargets}</span>
                    <span className="text-[10px] text-slate-400">Tuntas</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-sky-400">{student.totalMurajaahSessions}</span>
                    <span className="text-[10px] text-slate-400">Murajaah 75x</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => openStudentDetail(student.id)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                >
                  Rincian Santri <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setBonusModalStudent(student)}
                  className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1 shadow-md shadow-amber-500/20"
                >
                  <Award className="w-3.5 h-3.5" />
                  + Bonus XP
                </button>
                <button
                  onClick={() => setNoteModalStudent(student)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl transition border border-slate-700"
                  title="Kirim Catatan Motivasi"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setDeleteModalStudent(student);
                    setDeleteConfirmText('');
                    setDeleteError('');
                  }}
                  className="p-2 bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 text-xs font-bold rounded-xl transition border border-slate-700 hover:border-rose-500/40"
                  title="Hapus Akun Santri"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STUDENT DETAIL MODAL */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <RankEmblem rank={selectedStudentDetail.student.rank} size="sm" />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStudentDetail.student.fullName}</h3>
                  <p className="text-xs text-slate-400">
                    @{selectedStudentDetail.student.username} • {selectedStudentDetail.student.rank.name} ({selectedStudentDetail.student.xp} XP)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalStudent(selectedStudentDetail.student);
                    setDeleteConfirmText('');
                    setDeleteError('');
                  }}
                  className="py-1 px-2.5 text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-950 border border-rose-500/30 rounded-lg transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Akun
                </button>
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 mt-4">
              {/* Targets Progress */}
              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Target Hafalan & 5 Bagian
                </h4>
                {selectedStudentDetail.targets.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada target hafalan.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedStudentDetail.targets.map((tgt: any) => (
                      <div key={tgt.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">{tgt.title}</span>
                          <span className="text-[10px] font-bold text-amber-400">
                            Ayat {tgt.startAyah} - {tgt.endAyah}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 mt-2">
                          {tgt.sections.map((sec: any) => (
                            <div
                              key={sec.id}
                              className={`p-2 rounded-lg text-center text-[10px] border ${
                                sec.status === 'selesai'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              <span className="block font-bold">Bag. {sec.sectionNumber}</span>
                              <span className="text-[8px]">{sec.startAyah}-{sec.endAyah}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Murajaah Sessions */}
              <div>
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  Riwayat Murajaah 75x
                </h4>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  {selectedStudentDetail.murajaahSessions.filter((m: any) => m.status === 'selesai').length} sesi 75x diselesaikan.
                </div>
              </div>

              {/* Recent XP History */}
              <div>
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Riwayat XP Terakhir
                </h4>
                <div className="divide-y divide-slate-800 bg-slate-950 p-3 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto">
                  {selectedStudentDetail.xpHistory.slice(0, 5).map((tx: any) => (
                    <div key={tx.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-white font-medium">{tx.reason}</p>
                        <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</p>
                      </div>
                      <span className={`font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GIVE BONUS XP MODAL */}
      {bonusModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Beri Bonus XP Guru</h3>
              </div>
              <button onClick={() => setBonusModalStudent(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-2">
              Pemberian apresiasi poin untuk santri <strong>{bonusModalStudent.fullName}</strong>.
            </p>

            {bonusSuccess && (
              <div className="my-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs">
                {bonusSuccess}
              </div>
            )}

            {bonusError && (
              <div className="my-3 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
                {bonusError}
              </div>
            )}

            <form onSubmit={handleGiveBonus} className="space-y-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jumlah Bonus XP (Maksimal 500 XP per transaksi)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[50, 100, 200, 300].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setBonusAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        bonusAmount === amt
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      +{amt} XP
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alasan Pemberian Bonus (Wajib)
                </label>
                <select
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 mb-2"
                >
                  <option value="Hafalan yang berkembang dengan baik">Hafalan yang berkembang dengan baik</option>
                  <option value="Konsisten melakukan murajaah">Konsisten melakukan murajaah</option>
                  <option value="Menunjukkan usaha yang baik">Menunjukkan usaha yang baik</option>
                  <option value="Menyelesaikan target yang ditetapkan">Menyelesaikan target yang ditetapkan</option>
                  <option value="Perkembangan tajwid dan fashahah positif">Perkembangan tajwid dan fashahah positif</option>
                </select>
                <input
                  type="text"
                  placeholder="Atau tulis alasan spesifik..."
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Motivasi Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={bonusNote}
                  onChange={(e) => setBonusNote(e.target.value)}
                  placeholder="Pesan hangat atau penyemangat untuk santri..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBonusModalStudent(null)}
                  className="py-2 px-3 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBonus}
                  className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  {submittingBonus ? 'Memproses...' : `Kirim +${bonusAmount} XP`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEND NOTE MODAL */}
      {noteModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-sky-500/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Kirim Catatan Motivasi</h3>
              </div>
              <button onClick={() => setNoteModalStudent(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-2">
              Kirimkan nasihat hafalan untuk <strong>{noteModalStudent.fullName}</strong>.
            </p>

            {noteSuccess && (
              <div className="my-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs">
                {noteSuccess}
              </div>
            )}

            {noteError && (
              <div className="my-3 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
                {noteError}
              </div>
            )}

            <form onSubmit={handleSendNote} className="space-y-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Isi Pesan / Motivasi
                </label>
                <textarea
                  rows={4}
                  required
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  placeholder="Contoh: Alhamdulillah, perkembangan hafalanmu minggu ini sudah baik. Pertahankan murajaah agar hafalan semakin kuat."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNoteModalStudent(null)}
                  className="py-2 px-3 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="py-2.5 px-5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  {submittingNote ? 'Mengirim...' : 'Kirim Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Daftarkan Santri Baru</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setAddStudentError('');
                  setAddStudentSuccess('');
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Akun santri baru akan langsung masuk ke dalam kelompok bimbingan dan daftar santri Anda.
            </p>

            {addStudentSuccess && (
              <div className="my-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs">
                {addStudentSuccess}
              </div>
            )}

            {addStudentError && (
              <div className="my-3 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
                {addStudentError}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3.5 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap Santri
                </label>
                <input
                  type="text"
                  required
                  value={newStudentFullName}
                  onChange={(e) => setNewStudentFullName(e.target.value)}
                  placeholder="Contoh: Muhammad Rayhan"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username (Tanpa Spasi)
                </label>
                <input
                  type="text"
                  required
                  value={newStudentUsername}
                  onChange={(e) => setNewStudentUsername(e.target.value)}
                  placeholder="Contoh: rayhan_tahfiz"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi Awal
                </label>
                <input
                  type="password"
                  required
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="py-2 px-3 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAddStudent}
                  className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
                >
                  {submittingAddStudent ? 'Mendaftarkan...' : 'Daftarkan Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE STUDENT CONFIRMATION MODAL */}
      {deleteModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Hapus Akun Santri</h3>
              </div>
              <button onClick={() => setDeleteModalStudent(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Student Info */}
            <div className="mt-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-sm">
                {deleteModalStudent.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{deleteModalStudent.fullName}</h4>
                <p className="text-[11px] text-slate-400">@{deleteModalStudent.username}</p>
                <span className="text-[10px] text-amber-400 font-semibold">
                  {deleteModalStudent.xp?.toLocaleString('id-ID') || 0} XP • {deleteModalStudent.rank?.name || 'Rank Santri'}
                </span>
              </div>
            </div>

            {/* Warning Box */}
            <div className="my-3 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Peringatan Penghapusan Akun</span>
              </div>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                Tindakan ini akan <strong>menghapus permanen</strong> akun santri beserta seluruh target hafalan, sesi murajaah, pencatatan absensi, dan riwayat transaksi XP. Data tidak dapat dipulihkan.
              </p>
            </div>

            {deleteError && (
              <div className="mb-3 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteStudent} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Ketik <span className="font-mono text-rose-400 font-bold">HAPUS</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Ketik HAPUS"
                  className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400 text-center tracking-widest font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalStudent(null)}
                  className="py-2 px-3 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDelete || deleteConfirmText.trim() !== 'HAPUS'}
                  className="py-2.5 px-5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {submittingDelete ? 'Menghapus...' : 'Ya, Hapus Akun Permanen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
