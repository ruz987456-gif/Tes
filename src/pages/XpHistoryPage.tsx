import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  BookOpen,
  Award,
  AlertTriangle,
  ShieldAlert,
  Search
} from 'lucide-react';

export const XpHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [netXp, setNetXp] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getXpHistory();
      setTransactions(res.transactions || []);
      setNetXp(res.netXp || 0);
    } catch (err) {
      console.error('Failed to load XP history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.transactionType === filterType;
  });

  const getBadgeForType = (type: string) => {
    switch (type) {
      case 'hafalan':
        return { label: 'Hafalan', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: BookOpen };
      case 'murajaah':
        return { label: 'Murajaah', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30', icon: RotateCcw };
      case 'bonus_guru':
        return { label: 'Bonus Guru', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: Award };
      case 'sanksi_inaktif':
        return { label: 'Sanksi Tidak Aktif', color: 'bg-red-500/15 text-red-300 border-red-500/30', icon: AlertTriangle };
      case 'koreksi_admin':
        return { label: 'Koreksi Admin', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', icon: ShieldAlert };
      default:
        return { label: type, color: 'bg-slate-700 text-slate-300 border-slate-600', icon: Sparkles };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Riwayat Transaksi XP (Buku Besar)</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Seluruh mutasi poin tersimpan secara permanen dan dapat diaudit.
          </p>
        </div>

        {/* Net XP Card */}
        <div className="p-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Bersih</span>
            <span className="text-xl font-black text-amber-400">{netXp.toLocaleString('id-ID')} XP</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        {[
          { key: 'all', label: 'Semua Mutasi' },
          { key: 'hafalan', label: 'Hafalan' },
          { key: 'murajaah', label: 'Murajaah' },
          { key: 'bonus_guru', label: 'Bonus Guru' },
          { key: 'sanksi_inaktif', label: 'Sanksi Tidak Aktif' },
          { key: 'koreksi_admin', label: 'Koreksi Admin' }
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
              filterType === f.key
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat mutasi XP...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Tidak ada transaksi pada kategori ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filtered.map((tx) => {
              const badge = getBadgeForType(tx.transactionType);
              const IconComp = badge.icon;
              const isPositive = tx.amount > 0;

              return (
                <div key={tx.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isPositive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color} flex items-center gap-1`}>
                          <IconComp className="w-3 h-3" />
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {tx.id}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1">{tx.reason}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WITA
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm font-black ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isPositive ? `+${tx.amount}` : tx.amount} XP
                    </span>
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
