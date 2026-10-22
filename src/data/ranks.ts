export interface RankDefinition {
  order: number;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'heroic' | 'master' | 'grandmaster';
  roman: string;
  minXp: number;
  maxXp: number; // For grandmaster, we can set Infinity
  color: string;
  accentColor: string;
  bgBadge: string;
  borderColor: string;
}

export const RANKS_DATA: RankDefinition[] = [
  { order: 1, name: "Bronze I", tier: "bronze", roman: "I", minXp: 0, maxXp: 199, color: "text-amber-700", accentColor: "#b45309", bgBadge: "bg-amber-950/60", borderColor: "border-amber-800" },
  { order: 2, name: "Bronze II", tier: "bronze", roman: "II", minXp: 200, maxXp: 399, color: "text-amber-700", accentColor: "#b45309", bgBadge: "bg-amber-950/60", borderColor: "border-amber-800" },
  { order: 3, name: "Bronze III", tier: "bronze", roman: "III", minXp: 400, maxXp: 599, color: "text-amber-700", accentColor: "#b45309", bgBadge: "bg-amber-950/60", borderColor: "border-amber-800" },
  { order: 4, name: "Silver I", tier: "silver", roman: "I", minXp: 600, maxXp: 899, color: "text-slate-300", accentColor: "#cbd5e1", bgBadge: "bg-slate-800/80", borderColor: "border-slate-500" },
  { order: 5, name: "Silver II", tier: "silver", roman: "II", minXp: 900, maxXp: 1199, color: "text-slate-300", accentColor: "#cbd5e1", bgBadge: "bg-slate-800/80", borderColor: "border-slate-500" },
  { order: 6, name: "Silver III", tier: "silver", roman: "III", minXp: 1200, maxXp: 1499, color: "text-slate-300", accentColor: "#cbd5e1", bgBadge: "bg-slate-800/80", borderColor: "border-slate-500" },
  { order: 7, name: "Gold I", tier: "gold", roman: "I", minXp: 1500, maxXp: 1899, color: "text-yellow-400", accentColor: "#facc15", bgBadge: "bg-yellow-950/60", borderColor: "border-yellow-500" },
  { order: 8, name: "Gold II", tier: "gold", roman: "II", minXp: 1900, maxXp: 2299, color: "text-yellow-400", accentColor: "#facc15", bgBadge: "bg-yellow-950/60", borderColor: "border-yellow-500" },
  { order: 9, name: "Gold III", tier: "gold", roman: "III", minXp: 2300, maxXp: 2699, color: "text-yellow-400", accentColor: "#facc15", bgBadge: "bg-yellow-950/60", borderColor: "border-yellow-500" },
  { order: 10, name: "Platinum I", tier: "platinum", roman: "I", minXp: 2700, maxXp: 3199, color: "text-cyan-300", accentColor: "#67e8f9", bgBadge: "bg-cyan-950/60", borderColor: "border-cyan-500" },
  { order: 11, name: "Platinum II", tier: "platinum", roman: "II", minXp: 3200, maxXp: 3699, color: "text-cyan-300", accentColor: "#67e8f9", bgBadge: "bg-cyan-950/60", borderColor: "border-cyan-500" },
  { order: 12, name: "Platinum III", tier: "platinum", roman: "III", minXp: 3700, maxXp: 4199, color: "text-cyan-300", accentColor: "#67e8f9", bgBadge: "bg-cyan-950/60", borderColor: "border-cyan-500" },
  { order: 13, name: "Diamond I", tier: "diamond", roman: "I", minXp: 4200, maxXp: 4799, color: "text-sky-300", accentColor: "#38bdf8", bgBadge: "bg-sky-950/70", borderColor: "border-sky-400" },
  { order: 14, name: "Diamond II", tier: "diamond", roman: "II", minXp: 4800, maxXp: 5399, color: "text-sky-300", accentColor: "#38bdf8", bgBadge: "bg-sky-950/70", borderColor: "border-sky-400" },
  { order: 15, name: "Diamond III", tier: "diamond", roman: "III", minXp: 5400, maxXp: 5999, color: "text-sky-300", accentColor: "#38bdf8", bgBadge: "bg-sky-950/70", borderColor: "border-sky-400" },
  { order: 16, name: "Heroic", tier: "heroic", roman: "HR", minXp: 6000, maxXp: 6999, color: "text-red-400", accentColor: "#f87171", bgBadge: "bg-red-950/70", borderColor: "border-red-500" },
  { order: 17, name: "Elite Heroic", tier: "heroic", roman: "E-HR", minXp: 7000, maxXp: 7999, color: "text-rose-400", accentColor: "#fb7185", bgBadge: "bg-rose-950/80", borderColor: "border-rose-500" },
  { order: 18, name: "Master", tier: "master", roman: "M", minXp: 8000, maxXp: 8999, color: "text-purple-400", accentColor: "#c084fc", bgBadge: "bg-purple-950/80", borderColor: "border-purple-500" },
  { order: 19, name: "Elite Master", tier: "master", roman: "E-M", minXp: 9000, maxXp: 9999, color: "text-fuchsia-400", accentColor: "#e879f9", bgBadge: "bg-fuchsia-950/80", borderColor: "border-fuchsia-500" },
  { order: 20, name: "Grandmaster", tier: "grandmaster", roman: "GM", minXp: 10000, maxXp: Infinity, color: "text-amber-300", accentColor: "#fcd34d", bgBadge: "bg-gradient-to-r from-amber-950/90 via-purple-950/80 to-amber-950/90", borderColor: "border-amber-400" }
];

export function getRankByXp(xp: number): RankDefinition {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  for (let i = RANKS_DATA.length - 1; i >= 0; i--) {
    if (safeXp >= RANKS_DATA[i].minXp) {
      return RANKS_DATA[i];
    }
  }
  return RANKS_DATA[0];
}

export function getRankProgress(xp: number) {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  const currentRank = getRankByXp(safeXp);
  const nextRank = currentRank.order < 20 ? RANKS_DATA[currentRank.order] : null;

  if (!nextRank) {
    // Grandmaster
    return {
      currentRank,
      nextRank: null,
      xpInCurrentRank: safeXp - 10000,
      xpRequiredForNext: 0,
      xpNeeded: 0,
      percent: 100
    };
  }

  const range = nextRank.minXp - currentRank.minXp;
  const currentProgress = safeXp - currentRank.minXp;
  const xpNeeded = Math.max(0, nextRank.minXp - safeXp);
  const percent = Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));

  return {
    currentRank,
    nextRank,
    xpInCurrentRank: currentProgress,
    xpRequiredForNext: range,
    xpNeeded,
    percent
  };
}
