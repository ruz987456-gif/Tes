// Client-side local storage engine for offline PWA & Netlify Drop static hosting
import { SURAHS_DATA } from '../data/surahs';
import { RANKS_DATA, getRankByXp, getRankProgress } from '../data/ranks';

const STORAGE_KEY = 'hifzup_local_db_v2';

export function getLocalMakassarDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function getInitialLocalDb() {
  const today = getLocalMakassarDate();
  return {
    profiles: [
      {
        id: 'usr-admin-1',
        username: 'admin',
        fullName: 'Ustadz H. Abdullah M.Pd (Admin)',
        role: 'admin',
        avatarUrl: '',
        status: 'aktif',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-guru-1',
        username: 'guru1',
        fullName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
        role: 'guru',
        avatarUrl: '',
        status: 'aktif',
        groupId: 'grp-tahfiz-1',
        createdAt: new Date().toISOString()
      }
    ],
    targets: [],
    murajaahSessions: [],
    xpTransactions: [],
    attendance: [],
    learningDays: [],
    teacherNotes: [],
    notifications: [],
    groups: [
      {
        id: 'grp-tahfiz-1',
        name: 'Halaqah Tahfiz Al-Ikhlas',
        teacherId: 'usr-guru-1'
      }
    ],
    auditLogs: [
      {
        id: 'aud-1',
        action: 'INIT_PWA',
        actorName: 'PWA Client',
        details: 'Aplikasi PWA diinisialisasi secara lokal tanpa santri fiktif',
        createdAt: new Date().toISOString()
      }
    ]
  };
}

function generateSections(targetId: string, start: number, end: number) {
  const total = end - start + 1;
  const base = Math.floor(total / 5);
  const remainder = total % 5;
  const sections: any[] = [];
  let cur = start;

  for (let i = 1; i <= 5; i++) {
    let size = base + (i <= remainder ? 1 : 0);
    if (size < 1) size = 1;
    let secEnd = cur + size - 1;
    if (i === 5 || secEnd > end) secEnd = end;

    const secId = `${targetId}-sec-${i}`;
    sections.push({
      id: secId,
      sectionNumber: i,
      startAyah: cur,
      endAyah: secEnd,
      status: 'belum',
      stages: [1, 2, 3, 4].map(sNum => ({
        id: `${secId}-stg-${sNum}`,
        stageNumber: sNum,
        repetitions: 0,
        maxRepetitions: 5,
        xpPerRep: sNum,
        xpEarned: 0,
        status: 'belum'
      }))
    });

    cur = secEnd + 1;
    if (cur > end) cur = end;
  }
  return sections;
}

export function getClientDb(): any {
  try {
    // Purge old v1 if present
    localStorage.removeItem('hifzup_local_db_v1');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-sanitize any leftover fictional students
      if (parsed.profiles) {
        parsed.profiles = parsed.profiles.filter((p: any) => !p.id.startsWith('usr-murid-'));
      }
      if (parsed.targets) {
        parsed.targets = parsed.targets.filter((t: any) => !t.userId.startsWith('usr-murid-'));
      }
      if (parsed.xpTransactions) {
        parsed.xpTransactions = parsed.xpTransactions.filter((x: any) => !x.userId.startsWith('usr-murid-'));
      }
      return parsed;
    }
  } catch (e) {
    // ignore
  }
  const init = getInitialLocalDb();
  saveClientDb(init);
  return init;
}

export function saveClientDb(db: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Local save error', e);
  }
}

export function calculateLocalNetXp(userId: string, db: any): number {
  const txs = (db.xpTransactions || []).filter((t: any) => t.userId === userId);
  const sum = txs.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  return Math.max(0, sum);
}

export function deleteLocalStudent(studentId: string): boolean {
  const db = getClientDb();
  db.profiles = (db.profiles || []).filter((p: any) => p.id !== studentId);
  db.targets = (db.targets || []).filter((t: any) => t.userId !== studentId);
  db.murajaahSessions = (db.murajaahSessions || []).filter((m: any) => m.userId !== studentId);
  db.xpTransactions = (db.xpTransactions || []).filter((x: any) => x.userId !== studentId);
  db.attendance = (db.attendance || []).filter((a: any) => a.userId !== studentId);
  db.learningDays = (db.learningDays || []).filter((l: any) => l.userId !== studentId);
  db.teacherNotes = (db.teacherNotes || []).filter((n: any) => n.studentId !== studentId);
  db.notifications = (db.notifications || []).filter((n: any) => n.userId !== studentId);
  saveClientDb(db);
  return true;
}
