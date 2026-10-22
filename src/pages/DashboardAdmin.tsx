import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RankEmblem } from '../components/RankEmblem';
import { RANKS_DATA } from '../data/ranks';
import {
  Shield,
  Users,
  Award,
  Sparkles,
  BarChart3,
  RotateCcw,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  FileText,
  Trash2
} from 'lucide-react';

export const DashboardAdmin: React.FC = () => {
  const [activeAdminTab, setActiveAdminTab] = useState<'ringkasan' | 'users' | 'koreksi_xp' | 'audit'>('ringkasan');
  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'murid' | 'guru'>('murid');
  const [userModalMsg, setUserModalMsg] = useState('');
  const [userModalError, setUserModalError] = useState('');

  // Correct XP Modal State
  const [selectedUserForXp, setSelectedUserForXp] = useState<string>('');
  const [xpDelta, setXpDelta] = useState<number>(0);
  const [xpReason, setXpReason] = useState<string>('');
  const [xpModalMsg, setXpModalMsg] = useState('');
  const [xpModalError, setXpModalError] = useState('');

  // Inactivity Runner State
  const [runningInactivity, setRunningInactivity] = useState(false);
  const [inactivityMsg, setInactivityMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, userRes, audRes] = await Promise.all([
        api.getAdminSummary(),
        api.getAdminUsers(),
        api.getAuditLogs()
      ]);
      setSummary(sumRes.summary || null);
      setUsers(userRes.users || []);
      setAuditLogs(audRes.logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError('');
    setUserModalMsg('');
    try {
      await api.createAdminUser({
        username: newUsername,
        password: newPassword,
        fullName: newFullName,
        role: newRole
      });
      setUserModalMsg(`Akun ${newRole.toUpperCase()} berhasil dibuat.`);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      await loadData();
    } catch (err: any) {
      setUserModalError(err.message || 'Gagal membuat pengguna.');
    }
  };

  const handleCorrectXp = async (e: React.FormEvent) => {
    e.preventDefault();
    setXpModalError('');
    setXpModalMsg('');
    try {
      const res = await api.correctXp({
        userId: selectedUserForXp,
        delta: xpDelta,
        reason: xpReason
      });
      setXpModalMsg(res.message);
      setXpDelta(0);
      setXpReason('');
      await loadData();
    } catch (err: any) {
      setXpModalError(err.message || 'Gagal melakukan koreksi XP.');
    }
  };

  const handleDeleteStudent = async (studentId: string, fullName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun santri ${fullName}? Seluruh data hafalan dan XP akan dihapus permanen.`)) {
      return;
    }
    try {
      await api.deleteTeacherStudent(studentId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus santri.');
    }
  };

  const handleRunInactivity = async () => {
    try {
      setRunningInactivity(true);
      setInactivityMsg('');
      const res = await api.runInactivityCheck();
      setInactivityMsg(res.message);
      await loadData();
    } catch (err: any) {
      setInactivityMsg('Gagal: ' + err.message);
    } finally {
      setRunningInactivity(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Admin Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">Panel Administrator HIFZUP</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kelola pengguna, audit mutasi XP, evaluasi ketidakaktifan, dan pantau ringkasan lembaga.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunInactivity}
            disabled={runningInactivity}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl transition border border-slate-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${runningInactivity ? 'animate-spin' : ''}`} />
            <span>{runningInactivity ? 'Mengevaluasi...' : 'Jalankan Evaluasi Inaktif (WITA)'}</span>
          </button>
        </div>

        {inactivityMsg && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs text-amber-300">
            {inactivityMsg}
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveAdminTab('ringkasan')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeAdminTab === 'ringkasan' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Ringkasan Lembaga
        </button>
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeAdminTab === 'users' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Kelola Pengguna ({users.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('koreksi_xp')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeAdminTab === 'koreksi_xp' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Koreksi XP & Audit
        </button>
        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeAdminTab === 'audit' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Log Sistem ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: RINGKASAN */}
      {activeAdminTab === 'ringkasan' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="block text-2xl font-black text-white">{summary.totalMurid}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Santri</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="block text-2xl font-black text-white">{summary.totalGuru}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Guru Pembina</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="block text-2xl font-black text-amber-400">{summary.totalGroups}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Halaqah</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="block text-2xl font-black text-emerald-400">{summary.activeTodayStudents}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Belajar Hari Ini</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="block text-2xl font-black text-sky-400">{summary.activeTargets}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Target Aktif</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="block text-2xl font-black text-purple-400">{summary.totalMurajaahSessions}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Sesi Murajaah</span>
            </div>
          </div>

          {/* Rank Distribution breakdown */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Distribusi 20 Tingkatan Rank Santri</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {RANKS_DATA.map(r => (
                <div key={r.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RankEmblem rank={r} size="xs" />
                    <div>
                      <span className={`text-[11px] font-bold block ${r.color}`}>{r.name}</span>
                      <span className="text-[9px] text-slate-500">{r.minXp}+ XP</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    {summary.rankDistribution[r.name] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA PENGGUNA */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Daftar Akun Pengguna</h3>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Akun Baru
            </button>
          </div>

          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Nama Lengkap</th>
                  <th className="py-3 px-3">Username</th>
                  <th className="py-3 px-3">Peran</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">XP & Rank</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-850">
                    <td className="py-3 px-3 font-bold text-white">{u.fullName}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">@{u.username}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        u.role === 'admin'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : u.role === 'guru'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold ${u.status === 'aktif' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.role === 'murid' ? (
                        <span className="font-black text-amber-400">
                          {u.xp?.toLocaleString('id-ID')} XP ({u.rank?.name})
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {u.role === 'murid' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(u.id, u.fullName)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                          title="Hapus Akun Santri"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Tambah Akun Pengguna</h3>

            {userModalMsg && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs">
                {userModalMsg}
              </div>
            )}
            {userModalError && (
              <div className="mb-3 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
                {userModalError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Peran Akun</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="murid">Murid / Santri</option>
                  <option value="guru">Guru / Pembina Tahfiz</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Contoh: Muhammad Ilham"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="username_santri"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi Awal</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="py-2 px-3 text-xs text-slate-400 hover:text-white"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Buat Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: KOREKSI XP & AUDIT */}
      {activeAdminTab === 'koreksi_xp' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl max-w-2xl">
          <h3 className="text-base font-bold text-white mb-2">Koreksi XP Santri</h3>
          <p className="text-xs text-slate-400 mb-6">
            Setiap perubahan XP administratif wajib disertai alasan jelas dan dicatat ke dalam buku besar audit log.
          </p>

          {xpModalMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs">
              {xpModalMsg}
            </div>
          )}
          {xpModalError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
              {xpModalError}
            </div>
          )}

          <form onSubmit={handleCorrectXp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Santri</label>
              <select
                value={selectedUserForXp}
                onChange={(e) => setSelectedUserForXp(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Pilih Santri --</option>
                {users.filter(u => u.role === 'murid').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (@{m.username}) - Saldo: {m.xp} XP
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nilai Koreksi XP (+ untuk menambah, - untuk mengurangi)
              </label>
              <input
                type="number"
                required
                value={xpDelta}
                onChange={(e) => setXpDelta(parseInt(e.target.value, 10) || 0)}
                placeholder="Contoh: 150 atau -50"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alasan Koreksi Administratif (Wajib, min 5 karakter)
              </label>
              <textarea
                rows={3}
                required
                value={xpReason}
                onChange={(e) => setXpReason(e.target.value)}
                placeholder="Jelaskan alasan penyesuaian untuk catatan audit..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition"
            >
              Simpan Koreksi ke Audit Log
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeAdminTab === 'audit' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <h3 className="text-base font-bold text-white">Audit Log Perubahan Sistem</h3>
            <span className="text-xs text-slate-400">{auditLogs.length} catatan aktivitas</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-white">{log.actorName}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                  {new Date(log.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
