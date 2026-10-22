import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RankEmblem } from './RankEmblem';
import { api } from '../services/api';
import {
  Bell,
  LogOut,
  User,
  Shield,
  BookOpen,
  Award,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';

import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (e) {
      // ignore
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleOpenNotifs = () => {
    setShowNotifications(true);
    fetchNotifs();
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    fetchNotifs();
  };

  const unreadCount = user?.unreadNotifications || notifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('beranda')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              ح
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">HIFZUP</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30">
                  {user?.role === 'admin' ? 'Admin' : user?.role === 'guru' ? 'Guru' : 'Murid'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hafal. Murajaah. Naik Rank.
              </p>
            </div>
          </div>

          {/* Desktop Navigation for Murid / Guru / Admin */}
          <nav className="hidden md:flex items-center gap-1">
            {user?.role === 'murid' && (
              <>
                <button
                  onClick={() => onSelectTab('beranda')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'beranda' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Beranda
                </button>
                <button
                  onClick={() => onSelectTab('hafalan')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'hafalan' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Target Hafalan
                </button>
                <button
                  onClick={() => onSelectTab('murajaah')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'murajaah' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Murajaah 75x
                </button>
                <button
                  onClick={() => onSelectTab('kalender')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'kalender' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Kalender
                </button>
                <button
                  onClick={() => onSelectTab('peringkat')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'peringkat' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Peringkat
                </button>
              </>
            )}

            {user?.role === 'guru' && (
              <>
                <button
                  onClick={() => onSelectTab('guru_beranda')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'guru_beranda' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Beranda Guru
                </button>
                <button
                  onClick={() => onSelectTab('guru_murid')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'guru_murid' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Daftar Murid
                </button>
                <button
                  onClick={() => onSelectTab('peringkat')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'peringkat' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Papan Peringkat
                </button>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => onSelectTab('admin_ringkasan')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'admin_ringkasan' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Ringkasan
                </button>
                <button
                  onClick={() => onSelectTab('admin_users')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'admin_users' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Kelola Pengguna
                </button>
                <button
                  onClick={() => onSelectTab('admin_audit')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    currentTab === 'admin_audit' ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Audit Log
                </button>
              </>
            )}
          </nav>

          {/* Right Header Status: PWA Install, Rank Emblem, Notification, Profile & Logout */}
          <div className="flex items-center gap-2.5">
            {/* PWA In-App Install Prompt */}
            <PWAInstallButton variant="navbar" />
            {user?.role === 'murid' && user.rank && (
              <div
                onClick={() => onSelectTab('peringkat')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-amber-500/40 cursor-pointer transition"
              >
                <RankEmblem rank={user.rank} size="xs" />
                <div className="text-right">
                  <div className={`text-xs font-bold leading-tight ${user.rank.color}`}>
                    {user.rank.name}
                  </div>
                  <div className="text-[11px] font-extrabold text-amber-400">
                    {user.xp.toLocaleString('id-ID')} XP
                  </div>
                </div>
              </div>
            )}

            {/* Notification Bell */}
            <button
              onClick={handleOpenNotifs}
              className="relative p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Button */}
            <div
              onClick={() => onSelectTab('profil')}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-slate-700"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-amber-400">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left text-xs">
                <p className="font-semibold text-white max-w-[120px] truncate">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400">@{user?.username}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition"
              title="Keluar Sesi"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Drawer Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Notifikasi</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tandai Dibaca
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1 my-2 pr-1">
              {loadingNotifs ? (
                <div className="py-8 text-center text-xs text-slate-400">Memuat notifikasi...</div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada notifikasi baru.
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`py-3 px-2 rounded-lg transition ${
                      notif.isRead ? 'opacity-70' : 'bg-slate-800/40 border-l-2 border-amber-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-100">{notif.title}</h4>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
