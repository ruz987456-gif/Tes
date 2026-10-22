import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SURAHS_DATA, Surah } from '../data/surahs';
import {
  BookOpen,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  Volume2
} from 'lucide-react';

export const HafalanPage: React.FC = () => {
  const { refreshUser, triggerRankCelebration } = useAuth();
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTargetId, setExpandedTargetId] = useState<string | null>(null);

  // Create Target Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(78);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(40);
  const [targetTitle, setTargetTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [surahSearch, setSurahSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Target Modal State
  const [editTarget, setEditTarget] = useState<any | null>(null);

  // Delete Target Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadTargets = async () => {
    try {
      setLoading(true);
      const res = await api.getTargets();
      setTargets(res.targets || []);
      if (res.targets && res.targets.length > 0 && !expandedTargetId) {
        setExpandedTargetId(res.targets[0].id);
      }
    } catch (err) {
      console.error('Failed to load targets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, []);

  const selectedSurah = SURAHS_DATA.find(s => s.number === selectedSurahNumber) || SURAHS_DATA[0];

  const handleSelectSurah = (sNum: number) => {
    setSelectedSurahNumber(sNum);
    const surah = SURAHS_DATA.find(s => s.number === sNum);
    if (surah) {
      setStartAyah(1);
      setEndAyah(surah.numberOfAyahs);
      setTargetTitle(`Target ${surah.name} (1-${surah.numberOfAyahs})`);
    }
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (startAyah < 1) {
      setFormError('Ayat awal minimal 1.');
      return;
    }
    if (endAyah > selectedSurah.numberOfAyahs) {
      setFormError(`Ayat akhir maksimal ${selectedSurah.numberOfAyahs} untuk Surah ${selectedSurah.name}.`);
      return;
    }
    if (startAyah > endAyah) {
      setFormError('Ayat awal tidak boleh lebih besar daripada ayat akhir.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createTarget({
        surahNumber: selectedSurahNumber,
        startAyah,
        endAyah,
        title: targetTitle || `Target ${selectedSurah.name} (${startAyah}-${endAyah})`,
        targetDate,
        notes
      });
      setShowCreateModal(false);
      await loadTargets();
      await refreshUser();
    } catch (err: any) {
      setFormError(err.message || 'Gagal membuat target.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordRep = async (targetId: string, sectionNumber: number, stageNumber: number) => {
    try {
      const idempotencyKey = `rep-${targetId}-${sectionNumber}-${stageNumber}-${Date.now()}`;
      const res = await api.recordStageRep(targetId, {
        sectionNumber,
        stageNumber,
        idempotencyKey
      });

      if (res.rankedUp && res.prevRank && res.rank) {
        triggerRankCelebration(res.prevRank, res.rank, res.totalNetXp);
      }

      await loadTargets();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat pengulangan.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await api.updateTarget(editTarget.id, {
        title: editTarget.title,
        targetDate: editTarget.targetDate,
        notes: editTarget.notes
      });
      setEditTarget(null);
      await loadTargets();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTarget(id);
      setDeleteTargetId(null);
      await loadTargets();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus target.');
    }
  };

  const filteredSurahs = SURAHS_DATA.filter(s =>
    s.name.toLowerCase().includes(surahSearch.toLowerCase()) ||
    s.number.toString().includes(surahSearch)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Target Hafalan Al-Qur'an</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Setiap target dibagi menjadi 5 bagian berurutan dengan 4 tahapan latihan (Maksimal 250 XP).
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setTargetTitle(`Target ${selectedSurah.name} (${startAyah}-${endAyah})`);
          }}
          className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Buat Target Baru
        </button>
      </div>

      {/* Target List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Memuat data target hafalan...</div>
      ) : targets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-dashed border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Belum Ada Target Hafalan</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Ayo buat target hafalan dari 114 surah yang telah diverifikasi untuk mengumpulkan XP dan menaikkan rank!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition"
          >
            + Mulai Target Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {targets.map((target) => {
            const isExpanded = expandedTargetId === target.id;
            const completedSections = target.sections.filter((s: any) => s.status === 'selesai').length;
            const targetXpEarned = target.sections.reduce((secSum: number, s: any) => {
              return secSum + s.stages.reduce((stgSum: number, stg: any) => stgSum + stg.xpEarned, 0);
            }, 0);

            return (
              <div
                key={target.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden transition"
              >
                {/* Target Header Card */}
                <div className="p-5 sm:p-6 bg-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center text-amber-400">
                      <span className="font-quran text-2xl font-bold">{target.surahArabic || 'ق'}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black text-white">{target.title}</h2>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          target.status === 'selesai'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {target.status === 'selesai' ? 'SELESAI (250 XP)' : 'AKTIF'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Surah #{target.surahNumber} {target.surahName} • Ayat {target.startAyah} s/d {target.endAyah}
                        {target.targetDate && ` • Target: ${target.targetDate}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Section Progress Pill */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-400">
                        {targetXpEarned} / 250 XP
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {completedSections}/5 Bagian Tuntas
                      </div>
                    </div>

                    <button
                      onClick={() => setEditTarget(target)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                      title="Edit Target"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteTargetId(target.id)}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition"
                      title="Hapus / Arsipkan Target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedTargetId(isExpanded ? null : target.id)}
                      className="p-2 text-amber-400 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* 5 Sections Drilldown (when expanded) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/50 space-y-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Struktur 5 Bagian & 4 Tahapan Latihan</span>
                      <span>Maks. 50 XP per Bagian</span>
                    </div>

                    <div className="space-y-4">
                      {target.sections.map((section: any) => {
                        const secXp = section.stages.reduce((s: number, stg: any) => s + stg.xpEarned, 0);

                        return (
                          <div
                            key={section.id}
                            className={`p-4 rounded-2xl border transition ${
                              section.status === 'selesai'
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : 'bg-slate-900/80 border-slate-800'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
                                  {section.sectionNumber}
                                </span>
                                <h3 className="font-bold text-sm text-white">
                                  Bagian {section.sectionNumber} — Ayat {section.startAyah} s/d {section.endAyah}
                                </h3>
                                {section.status === 'selesai' && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Selesai
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-amber-400">
                                {secXp} / 50 XP
                              </span>
                            </div>

                            {/* 4 Stages Matrix */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {section.stages.map((stage: any) => {
                                const stageTitles = [
                                  'Tahap 1: Baca Mushaf',
                                  'Tahap 2: Sering Lihat',
                                  'Tahap 3: Sedikit Lihat',
                                  'Tahap 4: Tanpa Melihat'
                                ];
                                const isDone = stage.repetitions >= stage.maxRepetitions;

                                return (
                                  <div
                                    key={stage.id}
                                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                                      isDone
                                        ? 'bg-emerald-950/30 border-emerald-500/30'
                                        : 'bg-slate-950/70 border-slate-800/80'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-300">
                                          {stageTitles[stage.stageNumber - 1]}
                                        </span>
                                        <span className="text-[10px] font-bold text-amber-400">
                                          +{stage.stageNumber} XP/rep
                                        </span>
                                      </div>

                                      <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className="text-slate-400">Pengulangan:</span>
                                        <span className="font-bold text-white">
                                          {stage.repetitions} / {stage.maxRepetitions}
                                        </span>
                                      </div>

                                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                                        <div
                                          className="h-full bg-amber-500 rounded-full"
                                          style={{ width: `${(stage.repetitions / stage.maxRepetitions) * 100}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                      <span className="text-[11px] font-extrabold text-amber-400">
                                        {stage.xpEarned} XP
                                      </span>

                                      <button
                                        onClick={() => handleRecordRep(target.id, section.sectionNumber, stage.stageNumber)}
                                        disabled={isDone || target.status !== 'aktif'}
                                        className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                                          isDone
                                            ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm active:scale-95'
                                        }`}
                                      >
                                        {isDone ? '✓ Tuntas' : '+1 Ulang'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TARGET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Buat Target Hafalan Baru
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="my-3 p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTarget} className="space-y-4 mt-4">
              {/* Surah Selection with Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Surah (114 Surah Tersedia)
                </label>
                <input
                  type="text"
                  placeholder="Cari surah (misal: An-Naba, 78, Al-Mulk)..."
                  value={surahSearch}
                  onChange={(e) => setSurahSearch(e.target.value)}
                  className="w-full mb-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <select
                  value={selectedSurahNumber}
                  onChange={(e) => handleSelectSurah(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {filteredSurahs.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.name} ({s.nameArabic}) - {s.numberOfAyahs} Ayat
                    </option>
                  ))}
                </select>
              </div>

              {/* Ayah Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ayat Awal (Min: 1)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedSurah.numberOfAyahs}
                    value={startAyah}
                    onChange={(e) => setStartAyah(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ayat Akhir (Maks: {selectedSurah.numberOfAyahs})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedSurah.numberOfAyahs}
                    value={endAyah}
                    onChange={(e) => setEndAyah(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Target Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Target
                </label>
                <input
                  type="text"
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  placeholder={`Contoh: Target ${selectedSurah.name} (${startAyah}-${endAyah})`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Selesai (Opsional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Personal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Pribadi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan makhraj, tajwid atau fokus hafalan..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  {submitting ? 'Menyimpan...' : 'Buat Target & Bagi 5 Bagian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TARGET MODAL */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Edit Target Hafalan</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Target</label>
                <input
                  type="text"
                  value={editTarget.title}
                  onChange={(e) => setEditTarget({ ...editTarget, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Tanggal</label>
                <input
                  type="date"
                  value={editTarget.targetDate || ''}
                  onChange={(e) => setEditTarget({ ...editTarget, targetDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={editTarget.notes || ''}
                  onChange={(e) => setEditTarget({ ...editTarget, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="py-2 px-3 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE TARGET CONFIRMATION */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Arsipkan Target Hafalan?</h3>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Target ini akan diarsipkan dari daftar aktif. Seluruh riwayat transaksi XP dan pencapaian yang sah akan tetap tersimpan di akunmu.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                className="py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                Ya, Arsipkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
