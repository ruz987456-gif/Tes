import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { RankCelebrationModal } from './components/RankCelebrationModal';
import { OfflineIndicator } from './components/OfflineIndicator';

// Pages
import { AuthPage } from './pages/AuthPage';
import { DashboardMurid } from './pages/DashboardMurid';
import { HafalanPage } from './pages/HafalanPage';
import { MurajaahPage } from './pages/MurajaahPage';
import { KalenderPage } from './pages/KalenderPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { XpHistoryPage } from './pages/XpHistoryPage';
import { CatatanGuruPage } from './pages/CatatanGuruPage';
import { ProfilPage } from './pages/ProfilPage';
import { DashboardGuru } from './pages/DashboardGuru';
import { DashboardAdmin } from './pages/DashboardAdmin';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('beranda');

  // Sync tab default based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setCurrentTab('admin_ringkasan');
      } else if (user.role === 'guru') {
        setCurrentTab('guru_beranda');
      } else {
        setCurrentTab('beranda');
      }
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/25 animate-bounce mb-4">
          ح
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">HIFZUP</h2>
        <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mt-1">
          Hafal. Murajaah. Naik Rank.
        </p>
        <p className="text-xs text-slate-500 mt-2">Memuat data aplikasi...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Role Protection guard per Bagian 5
  const renderCurrentPage = () => {
    // Shared tabs
    if (currentTab === 'profil') return <ProfilPage />;
    if (currentTab === 'peringkat') return <LeaderboardPage />;

    // Murid tabs
    if (user.role === 'murid') {
      switch (currentTab) {
        case 'beranda':
          return <DashboardMurid onSelectTab={setCurrentTab} />;
        case 'hafalan':
          return <HafalanPage />;
        case 'murajaah':
          return <MurajaahPage />;
        case 'kalender':
          return <KalenderPage />;
        case 'riwayat_xp':
          return <XpHistoryPage />;
        case 'catatan_guru':
          return <CatatanGuruPage />;
        default:
          return <DashboardMurid onSelectTab={setCurrentTab} />;
      }
    }

    // Guru tabs
    if (user.role === 'guru') {
      switch (currentTab) {
        case 'guru_beranda':
        case 'guru_murid':
          return <DashboardGuru />;
        default:
          return <DashboardGuru />;
      }
    }

    // Admin tabs
    if (user.role === 'admin') {
      switch (currentTab) {
        case 'admin_ringkasan':
        case 'admin_users':
        case 'admin_audit':
          return <DashboardAdmin />;
        default:
          return <DashboardAdmin />;
      }
    }

    return <DashboardMurid onSelectTab={setCurrentTab} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Viewport */}
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Rank Up Celebration Modal */}
      <RankCelebrationModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
