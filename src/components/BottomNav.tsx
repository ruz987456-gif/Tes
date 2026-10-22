import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  BookOpen,
  RotateCcw,
  Calendar,
  User,
  Users,
  Trophy,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {user.role === 'murid' && (
          <>
            <button
              onClick={() => onSelectTab('beranda')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'beranda' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className={`w-5 h-5 ${currentTab === 'beranda' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Beranda</span>
            </button>

            <button
              onClick={() => onSelectTab('hafalan')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'hafalan' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className={`w-5 h-5 ${currentTab === 'hafalan' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Hafalan</span>
            </button>

            <button
              onClick={() => onSelectTab('murajaah')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
                currentTab === 'murajaah' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <RotateCcw className={`w-5 h-5 ${currentTab === 'murajaah' ? 'stroke-[2.5]' : ''}`} />
                <span className="absolute -top-1 -right-2 px-1 text-[8px] font-black bg-amber-500 text-slate-950 rounded-full">
                  75
                </span>
              </div>
              <span className="text-[10px] font-semibold mt-1">Murajaah</span>
            </button>

            <button
              onClick={() => onSelectTab('kalender')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'kalender' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className={`w-5 h-5 ${currentTab === 'kalender' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Kalender</span>
            </button>

            <button
              onClick={() => onSelectTab('profil')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'profil' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className={`w-5 h-5 ${currentTab === 'profil' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Profil</span>
            </button>
          </>
        )}

        {user.role === 'guru' && (
          <>
            <button
              onClick={() => onSelectTab('guru_beranda')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'guru_beranda' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className={`w-5 h-5 ${currentTab === 'guru_beranda' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Beranda</span>
            </button>

            <button
              onClick={() => onSelectTab('guru_murid')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'guru_murid' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className={`w-5 h-5 ${currentTab === 'guru_murid' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Daftar Murid</span>
            </button>

            <button
              onClick={() => onSelectTab('peringkat')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'peringkat' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className={`w-5 h-5 ${currentTab === 'peringkat' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Peringkat</span>
            </button>

            <button
              onClick={() => onSelectTab('profil')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'profil' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className={`w-5 h-5 ${currentTab === 'profil' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Profil</span>
            </button>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <button
              onClick={() => onSelectTab('admin_ringkasan')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'admin_ringkasan' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className={`w-5 h-5 ${currentTab === 'admin_ringkasan' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Ringkasan</span>
            </button>

            <button
              onClick={() => onSelectTab('admin_users')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'admin_users' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className={`w-5 h-5 ${currentTab === 'admin_users' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Pengguna</span>
            </button>

            <button
              onClick={() => onSelectTab('admin_audit')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'admin_audit' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${currentTab === 'admin_audit' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Audit Log</span>
            </button>

            <button
              onClick={() => onSelectTab('profil')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                currentTab === 'profil' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className={`w-5 h-5 ${currentTab === 'profil' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-semibold mt-1">Profil</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
