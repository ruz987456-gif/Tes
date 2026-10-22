import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, BookOpen, GraduationCap, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login_murid' | 'login_guru' | 'login_admin' | 'register'>('login_murid');
  const [registerRole, setRegisterRole] = useState<'murid' | 'guru'>('murid');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'register') {
        await register(username, password, fullName, avatarUrl, registerRole);
      } else if (tab === 'login_murid') {
        await login(username, password, 'murid');
      } else if (tab === 'login_guru') {
        await login(username, password, 'guru');
      } else if (tab === 'login_admin') {
        await login(username, password, 'admin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string, roleTab: 'login_murid' | 'login_guru' | 'login_admin') => {
    setTab(roleTab);
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Islamic Geometric and Glow Accents */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black text-3xl shadow-xl shadow-amber-500/20 mb-3">
          ح
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">HIFZUP</h1>
        <p className="text-amber-400 font-bold tracking-widest text-xs uppercase mt-1">
          Hafal. Murajaah. Naik Rank.
        </p>
        <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto mt-2">
          Aplikasi Manajemen Hafalan Al-Qur'an Berbasis XP, 20 Rank, dan Bimbingan Guru
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-2xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('login_murid'); setErrorMsg(''); }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex flex-col items-center gap-1 ${
              tab === 'login_murid'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Login Murid
          </button>
          <button
            type="button"
            onClick={() => { setTab('login_guru'); setErrorMsg(''); }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex flex-col items-center gap-1 ${
              tab === 'login_guru'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Login Guru
          </button>
          <button
            type="button"
            onClick={() => { setTab('login_admin'); setErrorMsg(''); }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex flex-col items-center gap-1 ${
              tab === 'login_admin'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Login Admin
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-2 text-emerald-200 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Title & Description */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">
            {tab === 'register' && (registerRole === 'guru' ? 'Daftar Akun Guru Pembina Baru' : 'Daftar Akun Santri Baru')}
            {tab === 'login_murid' && 'Masuk Sebagai Murid'}
            {tab === 'login_guru' && 'Portal Pembina & Guru Tahfiz'}
            {tab === 'login_admin' && 'Administrasi Lembaga & Pengaturan'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tab === 'register'
              ? registerRole === 'guru'
                ? 'Daftar sebagai guru pembina untuk membimbing santri, mencatat murajaah, dan memberikan bonus prestasi.'
                : 'Mulai perjalanan hafalanmu dan raih rank tertinggi!'
              : 'Masukkan username dan kata sandi yang telah terdaftar.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {tab === 'register' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Daftar Sebagai
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('murid')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      registerRole === 'murid'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Santri / Murid
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole('guru')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                      registerRole === 'guru'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Guru Pembina
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {registerRole === 'guru' ? 'Nama Lengkap Guru / Ustadz' : 'Nama Lengkap Santri'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={registerRole === 'guru' ? 'Contoh: Ustadz Ahmad Zaki, Lc.' : 'Contoh: Ahmad Fauzan'}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (tanpa spasi)"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="text-xs">Memproses Autentikasi...</span>
            ) : (
              <>
                <span>
                  {tab === 'register'
                    ? registerRole === 'guru'
                      ? 'Daftar Guru Pembina'
                      : 'Daftar Santri Baru'
                    : 'Masuk ke Aplikasi'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          {tab === 'register' ? (
            <p className="text-xs text-slate-400">
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => { setTab('login_murid'); setErrorMsg(''); }}
                className="text-amber-400 font-bold hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => { setTab('register'); setErrorMsg(''); }}
                className="text-amber-400 font-bold hover:underline"
              >
                Daftar Akun Baru (Santri / Guru)
              </button>
            </p>
          )}
        </div>

        {/* Demo Fast Login Switcher for Quick Verification */}
        <div className="mt-6 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
            <span>⚡ Akun Uji Coba Cepat (Pembina & Admin):</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('guru1', 'guru123', 'login_guru')}
              className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-sky-300 font-medium transition text-center flex items-center justify-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Guru (Fatimah)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123', 'login_admin')}
              className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-rose-300 font-medium transition text-center flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin (Abdullah)
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Akun santri fiktif ditiadakan. Santri dapat mendaftar mandiri via tab <strong>Daftar Akun Baru</strong> atau didaftarkan langsung oleh Guru Pembina.
          </p>
        </div>
      </div>
    </div>
  );
};
