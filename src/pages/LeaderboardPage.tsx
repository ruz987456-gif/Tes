import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RankEmblem } from '../components/RankEmblem';
import {
  Trophy,
  Medal,
  TrendingUp,
  Search,
  Filter,
  Users,
  Award
} from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.getLeaderboard();
      setLeaderboard(res.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const filtered = leaderboard.filter(item =>
    item.fullName.toLowerCase().includes(search.toLowerCase()) ||
    item.username.toLowerCase().includes(search.toLowerCase())
  );

  const maxLeaderboardXp = leaderboard.length > 0 ? Math.max(...leaderboard.map(i => i.xp), 1000) : 1000;
  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" />
          Kompetisi Kebaikan (Fastabiqul Khairat)
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Papan Peringkat Santri & Murid</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Peringkat dihitung murni dari XP bersih hasil hafalan, murajaah, dan bimbingan guru yang sah.
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4">
          {/* Rank 2 (Silver) */}
          {topThree[1] && (
            <div className="sm:order-1 order-2 rounded-3xl bg-slate-900 border border-slate-700/60 p-5 text-center flex flex-col items-center justify-between shadow-lg">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 font-black text-sm flex items-center justify-center mb-2">
                2
              </div>
              <div className="relative mb-2">
                {topThree[1].avatarUrl ? (
                  <img src={topThree[1].avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-400" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xl font-black text-slate-300">
                    {topThree[1].fullName.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2">
                  <RankEmblem rank={topThree[1].rank} size="xs" />
                </div>
              </div>
              <h3 className="font-extrabold text-white text-sm truncate max-w-[160px]">{topThree[1].fullName}</h3>
              <span className={`text-[11px] font-bold ${topThree[1].rank.color}`}>{topThree[1].rank.name}</span>
              <div className="mt-3 px-3 py-1 rounded-xl bg-slate-950 text-amber-400 font-black text-sm">
                {topThree[1].xp.toLocaleString('id-ID')} XP
              </div>
            </div>
          )}

          {/* Rank 1 (Gold Champion) */}
          {topThree[0] && (
            <div className="sm:order-2 order-1 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/50 p-6 text-center flex flex-col items-center justify-between shadow-2xl relative sm:-translate-y-3">
              <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md">
                👑 Juara 1
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center mb-2 mt-2">
                1
              </div>
              <div className="relative mb-2">
                {topThree[0].avatarUrl ? (
                  <img src={topThree[0].avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-400" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center text-2xl font-black text-amber-300">
                    {topThree[0].fullName.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2">
                  <RankEmblem rank={topThree[0].rank} size="sm" />
                </div>
              </div>
              <h3 className="font-black text-white text-base truncate max-w-[180px]">{topThree[0].fullName}</h3>
              <span className={`text-xs font-bold ${topThree[0].rank.color}`}>{topThree[0].rank.name}</span>
              <div className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-base">
                {topThree[0].xp.toLocaleString('id-ID')} XP
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree[2] && (
            <div className="sm:order-3 order-3 rounded-3xl bg-slate-900 border border-amber-900/40 p-5 text-center flex flex-col items-center justify-between shadow-lg">
              <div className="w-8 h-8 rounded-full bg-amber-900 text-amber-200 font-black text-sm flex items-center justify-center mb-2">
                3
              </div>
              <div className="relative mb-2">
                {topThree[2].avatarUrl ? (
                  <img src={topThree[2].avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-700" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xl font-black text-amber-400">
                    {topThree[2].fullName.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2">
                  <RankEmblem rank={topThree[2].rank} size="xs" />
                </div>
              </div>
              <h3 className="font-extrabold text-white text-sm truncate max-w-[160px]">{topThree[2].fullName}</h3>
              <span className={`text-[11px] font-bold ${topThree[2].rank.color}`}>{topThree[2].rank.name}</span>
              <div className="mt-3 px-3 py-1 rounded-xl bg-slate-950 text-amber-400 font-black text-sm">
                {topThree[2].xp.toLocaleString('id-ID')} XP
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vertical Bar Chart Visual per Bagian 16 */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Grafik Batang Perolehan XP</h2>
          </div>
          <span className="text-xs text-slate-400">Tinggi batang proporsional terhadap total XP</span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-300 text-sm">Belum Ada Santri di Papan Peringkat</p>
            <p className="text-slate-400 mt-1 max-w-sm mx-auto">Daftarkan akun santri baru atau mulai hafalan pertama untuk menempati podium juara!</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex items-end justify-start sm:justify-center gap-6 sm:gap-8 min-w-[500px] h-64 pt-12 px-4 border-b border-slate-800">
              {leaderboard.slice(0, 8).map((student, idx) => {
                const heightPercent = Math.max(12, Math.round((student.xp / maxLeaderboardXp) * 100));
                const isCurrentUser = user?.id === student.id;

                return (
                  <div key={student.id} className="flex flex-col items-center justify-end h-full w-16 group">
                    {/* Avatar at the top of the bar */}
                    <div className="mb-2 relative transition transform group-hover:scale-110">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt=""
                          className={`w-9 h-9 rounded-full object-cover ring-2 ${
                            idx === 0 ? 'ring-amber-400' : 'ring-slate-600'
                          }`}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-black text-amber-300">
                          {student.fullName.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -top-2 -right-2">
                        <RankEmblem rank={student.rank} size="xs" />
                      </div>
                    </div>

                    {/* Vertical Bar */}
                    <div className="w-10 rounded-t-xl bg-slate-800/80 overflow-hidden flex flex-col justify-end p-0.5 border border-slate-700/60 transition-all duration-500">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          idx === 0
                            ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400'
                            : isCurrentUser
                            ? 'bg-gradient-to-t from-sky-600 to-cyan-400'
                            : 'bg-gradient-to-t from-slate-700 to-slate-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    {/* Student Name & XP Below Bar */}
                    <div className="text-center mt-2 w-16">
                      <span className="block text-[11px] font-bold text-white truncate">
                        {student.fullName.split(' ')[0]}
                      </span>
                      <span className="block text-[10px] font-extrabold text-amber-400 truncate">
                        {student.xp} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Full Table Leaderboard */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Daftar Lengkap Peringkat Santri</h2>
          </div>

          {/* Search filter */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari santri..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat data peringkat...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">Tidak ada santri yang cocok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 text-center w-12">Pos</th>
                  <th className="py-3 px-3">Santri</th>
                  <th className="py-3 px-3">Tingkatan Rank</th>
                  <th className="py-3 px-3 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => {
                  const isCurrent = user?.id === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-850 transition ${
                        isCurrent ? 'bg-amber-500/10 font-bold' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center font-extrabold text-slate-300">
                        {item.position === 1 ? (
                          <span className="text-amber-400 font-black">🥇 1</span>
                        ) : item.position === 2 ? (
                          <span className="text-slate-300 font-black">🥈 2</span>
                        ) : item.position === 3 ? (
                          <span className="text-amber-600 font-black">🥉 3</span>
                        ) : (
                          item.position
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400">
                              {item.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{item.fullName}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black">
                                  KAMU
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">@{item.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <RankEmblem rank={item.rank} size="xs" />
                          <span className={`font-semibold ${item.rank.color}`}>
                            {item.rank.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-black text-amber-400 text-sm">
                        {item.xp.toLocaleString('id-ID')} <span className="text-[10px] font-bold text-slate-400">XP</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
