import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { SURAHS_DATA, Surah } from '../src/data/surahs';
import { RANKS_DATA, RankDefinition, getRankByXp } from '../src/data/ranks';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: 'murid' | 'guru' | 'admin';
  passwordHash: string;
  avatarUrl: string;
  status: 'aktif' | 'nonaktif' | 'menunggu_verifikasi' | 'ditolak';
  groupId?: string;
  createdAt: string;
  phoneNumber?: string;
  institution?: string;
  sanadInfo?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface MemorizationStage {
  id: string;
  sectionId: string;
  stageNumber: number; // 1, 2, 3, 4
  repetitions: number; // 0..5
  maxRepetitions: number; // 5
  xpPerRep: number; // 1, 2, 3, 4
  xpEarned: number; // repetitions * xpPerRep (max 5, 10, 15, 20)
  status: 'belum' | 'proses' | 'selesai';
}

export interface MemorizationSection {
  id: string;
  targetId: string;
  sectionNumber: number; // 1..5
  startAyah: number;
  endAyah: number;
  status: 'belum' | 'proses' | 'selesai';
  stages: MemorizationStage[];
}

export interface MemorizationTarget {
  id: string;
  userId: string;
  surahNumber: number;
  surahName: string;
  surahArabic: string;
  startAyah: number;
  endAyah: number;
  title: string;
  startDate: string;
  targetDate: string;
  notes: string;
  status: 'aktif' | 'selesai' | 'diarsipkan';
  createdAt: string;
  completedAt?: string;
  sections: MemorizationSection[];
}

export interface MurajaahSession {
  id: string;
  userId: string;
  surahNumber?: number;
  surahName?: string;
  startAyah?: number;
  endAyah?: number;
  repetitions: number; // 0..75
  maxRepetitions: number; // 75
  status: 'berlangsung' | 'selesai';
  xpAwarded: number; // 300 when finished
  startedAt: string;
  completedAt?: string;
  idempotencyKey?: string;
}

export interface XpTransaction {
  id: string;
  userId: string;
  transactionType: 'hafalan' | 'murajaah' | 'bonus_guru' | 'sanksi_inaktif' | 'koreksi_admin';
  amount: number; // positive or negative
  reason: string;
  sourceActivity: string;
  activityId?: string;
  grantedBy?: string;
  createdAt: string;
  idempotencyKey?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  localDate: string; // YYYY-MM-DD
  recordedAt: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alpa';
  recordedBy: string;
  notes?: string;
}

export interface DailyLearningActivity {
  id: string;
  userId: string;
  localDate: string; // YYYY-MM-DD
  activeLearning: boolean;
  repCount: number;
  murajaahReps: number;
  summary: string;
}

export interface TeacherNote {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'bonus' | 'rank_up' | 'note' | 'target_completed' | 'murajaah_completed' | 'penalty' | 'info';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface GroupItem {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  createdAt: string;
}

export interface InactivityExemption {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  approvedBy: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface AchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'master';
  requiredXp?: number;
  requiredTargets?: number;
  requiredMurajaah?: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementCode: string;
  unlockedAt: string;
}

export interface AppDatabase {
  profiles: UserProfile[];
  surahs: Surah[];
  memorization_targets: MemorizationTarget[];
  murajaah_sessions: MurajaahSession[];
  xp_transactions: XpTransaction[];
  attendance: AttendanceRecord[];
  daily_learning_activity: DailyLearningActivity[];
  teacher_notes: TeacherNote[];
  notifications: NotificationItem[];
  groups: GroupItem[];
  teacher_student_assignments: { id: string; teacherId: string; studentId: string; assignedAt: string }[];
  inactivity_exemptions: InactivityExemption[];
  audit_logs: AuditLogItem[];
  user_achievements: UserAchievement[];
  system_config: {
    maxTeacherBonusXp: number;
    timezone: string;
    inactivitySchedule: { day: number; cumulativePenalty: number }[];
  };
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'hifzup.json');

// Asia/Makassar timezone helper
export function getLocalDateMakassar(date: Date = new Date()): string {
  // Asia/Makassar is UTC+8
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

// In-memory cache + persistent disk write
let memoryDb: AppDatabase | null = null;
let writeQueue = Promise.resolve();

function getInitialDb(): AppDatabase {
  const salt = bcrypt.genSaltSync(10);
  const passwordHashAdmin = bcrypt.hashSync('admin123', salt);
  const passwordHashGuru = bcrypt.hashSync('guru123', salt);
  const passwordHashMurid = bcrypt.hashSync('murid123', salt);

  const initialProfiles: UserProfile[] = [
    {
      id: 'usr-admin-1',
      username: 'admin',
      fullName: 'Ustadz H. Abdullah M.Pd (Admin)',
      role: 'admin',
      passwordHash: passwordHashAdmin,
      avatarUrl: '',
      status: 'aktif',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-guru-1',
      username: 'guru1',
      fullName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
      role: 'guru',
      passwordHash: passwordHashGuru,
      avatarUrl: '',
      status: 'aktif',
      groupId: 'grp-tahfiz-1',
      createdAt: new Date().toISOString()
    }
  ];

  const initialGroups: GroupItem[] = [
    {
      id: 'grp-tahfiz-1',
      name: 'Halaqah Tahfiz Al-Ikhlas',
      description: 'Kelompok hafalan Al-Qur\'an intensif bimbingan Ustadzah Fatimah',
      teacherId: 'usr-guru-1',
      createdAt: new Date().toISOString()
    }
  ];

  return {
    profiles: initialProfiles,
    surahs: SURAHS_DATA,
    memorization_targets: [],
    murajaah_sessions: [],
    xp_transactions: [],
    attendance: [],
    daily_learning_activity: [],
    teacher_notes: [],
    notifications: [],
    groups: initialGroups,
    teacher_student_assignments: [],
    inactivity_exemptions: [],
    audit_logs: [
      {
        id: 'aud-init-1',
        actorId: 'usr-admin-1',
        actorName: 'System Setup',
        action: 'INITIALIZE_SYSTEM',
        targetType: 'SYSTEM',
        targetId: 'root',
        details: 'Sistem HIFZUP diinisialisasi dengan 114 surah dan 20 tingkatan rank tanpa akun fiktif',
        createdAt: new Date().toISOString()
      }
    ],
    user_achievements: [],
    system_config: {
      maxTeacherBonusXp: 500,
      timezone: 'Asia/Makassar',
      inactivitySchedule: [
        { day: 1, cumulativePenalty: 0 },
        { day: 2, cumulativePenalty: 0 },
        { day: 3, cumulativePenalty: 25 },
        { day: 4, cumulativePenalty: 60 },
        { day: 5, cumulativePenalty: 100 },
        { day: 6, cumulativePenalty: 145 },
        { day: 7, cumulativePenalty: 200 }
      ]
    }
  };
}


// 5-Section partitioning algorithm respecting Bagian 8
export function generateFiveSections(targetId: string, startAyah: number, endAyah: number): MemorizationSection[] {
  const totalAyahs = endAyah - startAyah + 1;
  const sections: MemorizationSection[] = [];

  if (totalAyahs <= 0) return sections;

  // Base count per section and remainder distributed across earlier sections
  const base = Math.floor(totalAyahs / 5);
  const remainder = totalAyahs % 5;

  let currentStart = startAyah;

  for (let i = 1; i <= 5; i++) {
    // If totalAyahs < 5, each section covers whatever exists or bounds at endAyah
    let countForThisSection = base + (i <= remainder ? 1 : 0);
    if (countForThisSection < 1) {
      countForThisSection = 1;
    }

    let secEnd = currentStart + countForThisSection - 1;
    if (i === 5 || secEnd > endAyah) {
      secEnd = endAyah;
    }

    const secId = `${targetId}-sec-${i}`;
    const stages: MemorizationStage[] = [
      {
        id: `${secId}-stg-1`,
        sectionId: secId,
        stageNumber: 1,
        repetitions: 0,
        maxRepetitions: 5,
        xpPerRep: 1,
        xpEarned: 0,
        status: 'belum'
      },
      {
        id: `${secId}-stg-2`,
        sectionId: secId,
        stageNumber: 2,
        repetitions: 0,
        maxRepetitions: 5,
        xpPerRep: 2,
        xpEarned: 0,
        status: 'belum'
      },
      {
        id: `${secId}-stg-3`,
        sectionId: secId,
        stageNumber: 3,
        repetitions: 0,
        maxRepetitions: 5,
        xpPerRep: 3,
        xpEarned: 0,
        status: 'belum'
      },
      {
        id: `${secId}-stg-4`,
        sectionId: secId,
        stageNumber: 4,
        repetitions: 0,
        maxRepetitions: 5,
        xpPerRep: 4,
        xpEarned: 0,
        status: 'belum'
      }
    ];

    sections.push({
      id: secId,
      targetId,
      sectionNumber: i,
      startAyah: currentStart,
      endAyah: secEnd,
      status: 'belum',
      stages
    });

    currentStart = secEnd + 1;
    if (currentStart > endAyah) {
      currentStart = endAyah;
    }
  }

  return sections;
}

export function getDb(): AppDatabase {
  if (memoryDb) return memoryDb;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(content);
      if (memoryDb) {
        // Ensure Surahs are up to date with 114 verified
        if (!memoryDb.surahs || memoryDb.surahs.length !== 114) {
          memoryDb.surahs = SURAHS_DATA;
        }

        // Purge any legacy fictional student accounts
        const fictionalIds = new Set(['usr-murid-1', 'usr-murid-2', 'usr-murid-3', 'usr-murid-4']);
        const fictionalUsernames = ['murid1', 'murid2', 'murid3', 'murid4'];
        const hadFictional = memoryDb.profiles.some(p => fictionalIds.has(p.id) || fictionalUsernames.includes(p.username));
        if (hadFictional) {
          memoryDb.profiles = memoryDb.profiles.filter(p => !fictionalIds.has(p.id) && !fictionalUsernames.includes(p.username));
          memoryDb.memorization_targets = memoryDb.memorization_targets.filter(t => !fictionalIds.has(t.userId));
          memoryDb.murajaah_sessions = memoryDb.murajaah_sessions.filter(m => !fictionalIds.has(m.userId));
          memoryDb.xp_transactions = memoryDb.xp_transactions.filter(x => !fictionalIds.has(x.userId));
          memoryDb.attendance = memoryDb.attendance.filter(a => !fictionalIds.has(a.userId));
          memoryDb.daily_learning_activity = memoryDb.daily_learning_activity.filter(d => !fictionalIds.has(d.userId));
          memoryDb.teacher_notes = memoryDb.teacher_notes.filter(n => !fictionalIds.has(n.studentId));
          memoryDb.notifications = memoryDb.notifications.filter(n => !fictionalIds.has(n.userId));
          memoryDb.teacher_student_assignments = memoryDb.teacher_student_assignments.filter(a => !fictionalIds.has(a.studentId));
          memoryDb.user_achievements = memoryDb.user_achievements.filter(u => !fictionalIds.has(u.userId));
          saveDb(memoryDb);
        }

        return memoryDb;
      }
    } catch (e) {
      console.error('Error reading DB file, reinitializing', e);
    }
  }

  memoryDb = getInitialDb();
  saveDb(memoryDb);
  return memoryDb;
}

export async function saveDb(data: AppDatabase): Promise<void> {
  memoryDb = data;
  writeQueue = writeQueue.then(async () => {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write db to disk:', err);
    }
  });
  return writeQueue;
}

// User Net XP calculation directly from valid transactions
export function calculateNetXp(userId: string, db: AppDatabase): number {
  const txs = db.xp_transactions.filter(t => t.userId === userId);
  const total = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  return Math.max(0, total); // Never negative per Bagian 13: XP tidak pernah negatif
}
