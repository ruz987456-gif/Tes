import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RankEmblem } from '../components/RankEmblem';
import {
  User,
  Shield,
  Trash2,
  Camera,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Info,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const ProfilPage: React.FC = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatarUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg('');
    setErrorMsg('');
    setSaving(true);
    try {
      await updateProfile(fullName, avatarUrl);
      setSaveMsg('Profil berhasil disimpan.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setDeleting(true);
    try {
      await deleteAccount(deletePassword, confirmationText);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal memproses penghapusan akun.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Profil & Pengaturan Akun</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Kelola informasi identitas, foto profil, dan preferensi akun HIFZUP kamu.
        </p>
      </div>

      {saveMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.fullName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-amber-500/40 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl font-black text-amber-400 shadow-xl">
              {user.fullName.charAt(0)}
            </div>
          )}

          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full cursor-pointer shadow-lg transition"
            title="Ganti Foto Profil"
          >
            <Camera className="w-4 h-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">@{user.username}</p>

          {user.role === 'murid' && user.rank && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <RankEmblem rank={user.rank} size="xs" />
              <div className="text-xs text-left">
                <span className={`font-bold ${user.rank.color}`}>{user.rank.name}</span>
                <span className="text-slate-400 font-semibold ml-2">({user.xp} XP)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4">Informasi Akun</h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Username (Tidak dapat diubah)
            </label>
            <input
              type="text"
              disabled
              value={user.username}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* App Information Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-bold text-white">Tentang HIFZUP</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          HIFZUP adalah platform manajemen hafalan Al-Qur'an modern yang menggabungkan kemuliaan belajar Al-Qur'an dengan sistem perkembangan berjenjang (20 rank dan XP kompetitif). Dilengkapi database 114 surah terverifikasi, sistem 5 bagian x 4 tahapan hafalan, murajaah 75x, dan evaluasi ketidakaktifan di zona waktu Asia/Makassar (WITA).
        </p>
        <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <span>Versi: 1.0.0 (Produksi)</span>
          <span>Database: 114 Surah Lengkap</span>
          <span>Zona Waktu: Asia/Makassar</span>
        </div>
      </div>

      {/* Account Deletion per Bagian 5 */}
      <div className="p-6 rounded-3xl bg-red-950/20 border border-red-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-red-400">
          <Trash2 className="w-5 h-5" />
          <h3 className="text-base font-bold">Zona Bahaya: Hapus Akun</h3>
        </div>
        <p className="text-xs text-red-200/80 leading-relaxed">
          Menghapus akun akan menonaktifkan profil kamu secara permanen. Tindakan ini tidak dapat dibatalkan. Riwayat XP audit ledger akan dianonimkan sesuai kebijakan retensi.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="py-2.5 px-4 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition"
        >
          Hapus Akun Saya
        </button>
      </div>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Konfirmasi Penghapusan Akun</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Kamu akan menghapus akun <strong>@{user.username}</strong> ({user.fullName}). Untuk melanjutkan, ketik teks konfirmasi dan masukkan kata sandi kamu.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-950 border border-red-500/40 text-red-300 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ketik teks konfirmasi: <span className="text-red-400 font-mono">HAPUS AKUN SAYA</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="HAPUS AKUN SAYA"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Masukkan Kata Sandi Kamu
                </label>
                <input
                  type="password"
                  required
                  placeholder="Kata sandi akun"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="py-2 px-3 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition"
                >
                  {deleting ? 'Memproses...' : 'Ya, Hapus Akun Secara Permanen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
