// Central API Client for HIFZUP with Netlify Drop Static PWA Fallback
import {
  getClientDb,
  saveClientDb,
  calculateLocalNetXp,
  getLocalMakassarDate
} from './clientStorageDb';
import { SURAHS_DATA } from '../data/surahs';
import { RANKS_DATA, getRankByXp, getRankProgress } from '../data/ranks';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('hifzup_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('hifzup_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('hifzup_token');
  localStorage.removeItem('hifzup_current_user_id');
}

export function getCurrentUserId(): string {
  return localStorage.getItem('hifzup_current_user_id') || '';
}

export function setCurrentUserId(id: string) {
  localStorage.setItem('hifzup_current_user_id', id);
}

// Request with fallback to client storage engine (perfect for Netlify Drop)
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    // If the server returns HTML (typical for SPA fallback on static hosting like Netlify Drop)
    // or if response is 404 on /api/*, route through clientStorage engine!
    if (!contentType || !contentType.includes('application/json')) {
      return handleClientFallback<T>(endpoint, options);
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Terjadi kesalahan (${response.status})`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    // If network failed or connection refused (static offline PWA), use fallback!
    if (err.message && err.message.includes('Akses ditolak')) {
      throw err;
    }
    return handleClientFallback<T>(endpoint, options);
  }
}

// Client-side fallback handler for Netlify Drop static hosting
function handleClientFallback<T>(endpoint: string, options: RequestInit): T {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};
  const db = getClientDb();
  const currentUserId = getCurrentUserId();
  const today = getLocalMakassarDate();

  // /auth/login
  if (endpoint === '/auth/login' && method === 'POST') {
    const { username, expectedRole } = body;
    const user = db.profiles.find((p: any) => p.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      throw new Error('Username atau kata sandi tidak sesuai.');
    }
    if (expectedRole && user.role !== expectedRole && expectedRole !== 'admin') {
      throw new Error(`Akun ini bukan akun ${expectedRole.toUpperCase()}.`);
    }
    setCurrentUserId(user.id);
    setAuthToken(`mock-token-${user.id}`);
    const xp = calculateLocalNetXp(user.id, db);
    return {
      message: 'Login berhasil.',
      token: `mock-token-${user.id}`,
      profile: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        groupId: user.groupId,
        xp,
        rank: getRankByXp(xp)
      }
    } as unknown as T;
  }

  // /auth/register
  if (endpoint === '/auth/register' && method === 'POST') {
    const { username, fullName, avatarUrl, role = 'murid' } = body;
    const assignedRole = role === 'guru' ? 'guru' : 'murid';
    const newId = `usr-${Date.now()}`;
    let groupId = (db.groups && db.groups[0]?.id) || 'grp-tahfiz-1';

    if (assignedRole === 'guru') {
      groupId = `grp-${Date.now()}`;
      db.groups = db.groups || [];
      db.groups.push({
        id: groupId,
        name: `Halaqah ${fullName.trim()}`,
        teacherId: newId
      });
    }

    const newProfile = {
      id: newId,
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      role: assignedRole,
      avatarUrl: avatarUrl || '',
      status: 'aktif',
      groupId,
      createdAt: new Date().toISOString()
    };
    db.profiles.push(newProfile);
    saveClientDb(db);
    setCurrentUserId(newId);
    setAuthToken(`mock-token-${newId}`);
    return {
      message: 'Pendaftaran berhasil.',
      token: `mock-token-${newId}`,
      profile: {
        ...newProfile,
        xp: 0,
        rank: getRankByXp(0)
      }
    } as unknown as T;
  }

  // /auth/me
  if (endpoint === '/auth/me') {
    const user = db.profiles.find((p: any) => p.id === currentUserId) || db.profiles[0];
    if (!user) {
      throw new Error('Sesi tidak ditemukan.');
    }
    const xp = calculateLocalNetXp(user.id, db);
    const rankProgress = getRankProgress(xp);
    const todayAtt = (db.attendance || []).find((a: any) => a.userId === user.id && a.localDate === today);
    const todayLearn = (db.learningDays || []).find((l: any) => l.userId === user.id && l.localDate === today);
    const unread = (db.notifications || []).filter((n: any) => n.userId === user.id && !n.isRead).length;

    return {
      profile: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        groupId: user.groupId,
        status: user.status,
        createdAt: user.createdAt,
        xp,
        rank: rankProgress.currentRank,
        rankProgress,
        todayAttendanceStatus: todayAtt?.status || null,
        todayActiveLearning: !!todayLearn?.activeLearning,
        streak: 3,
        unreadNotifications: unread
      }
    } as unknown as T;
  }

  // /surahs
  if (endpoint === '/surahs') {
    return { total: SURAHS_DATA.length, surahs: SURAHS_DATA } as unknown as T;
  }

  // /ranks
  if (endpoint === '/ranks') {
    return { total: RANKS_DATA.length, ranks: RANKS_DATA } as unknown as T;
  }

  // /targets
  if (endpoint === '/targets' && method === 'GET') {
    const targets = db.targets.filter((t: any) => t.userId === currentUserId && t.status !== 'diarsipkan');
    return { targets } as unknown as T;
  }

  // POST /targets
  if (endpoint === '/targets' && method === 'POST') {
    const { surahNumber, startAyah, endAyah, title, targetDate, notes } = body;
    const surah = SURAHS_DATA.find(s => s.number === surahNumber) || SURAHS_DATA[0];
    const newTarget = {
      id: `tgt-${Date.now()}`,
      userId: currentUserId,
      surahNumber: surah.number,
      surahName: surah.name,
      surahArabic: surah.nameArabic,
      startAyah,
      endAyah,
      title: title || `Target ${surah.name} (${startAyah}-${endAyah})`,
      startDate: today,
      targetDate: targetDate || '',
      notes: notes || '',
      status: 'aktif',
      createdAt: new Date().toISOString(),
      sections: generateFallbackSections(`tgt-${Date.now()}`, startAyah, endAyah)
    };
    db.targets.push(newTarget);
    saveClientDb(db);
    return { message: 'Target berhasil dibuat.', target: newTarget } as unknown as T;
  }

  // POST /targets/:id/stage-rep
  if (endpoint.includes('/stage-rep') && method === 'POST') {
    const targetId = endpoint.split('/')[2];
    const { sectionNumber, stageNumber } = body;
    const target = db.targets.find((t: any) => t.id === targetId);
    if (target) {
      const sec = target.sections.find((s: any) => s.sectionNumber === sectionNumber);
      if (sec) {
        const stg = sec.stages.find((st: any) => st.stageNumber === stageNumber);
        if (stg && stg.repetitions < stg.maxRepetitions) {
          stg.repetitions += 1;
          stg.xpEarned = stg.repetitions * stg.xpPerRep;
          if (stg.repetitions >= stg.maxRepetitions) stg.status = 'selesai';

          if (sec.stages.every((st: any) => st.status === 'selesai')) {
            sec.status = 'selesai';
          }
          if (target.sections.every((sc: any) => sc.status === 'selesai')) {
            target.status = 'selesai';
          }

          db.xpTransactions.push({
            id: `tx-rep-${Date.now()}`,
            userId: currentUserId,
            transactionType: 'hafalan',
            amount: stageNumber,
            reason: `Pengulangan Tahap ${stageNumber} (Bagian ${sectionNumber}) - ${target.surahName}`,
            createdAt: new Date().toISOString()
          });
          saveClientDb(db);
        }
      }
    }
    const xp = calculateLocalNetXp(currentUserId, db);
    return {
      message: `Pengulangan dicatat (+${stageNumber} XP).`,
      totalNetXp: xp,
      rank: getRankByXp(xp)
    } as unknown as T;
  }

  // /murajaah/session
  if (endpoint === '/murajaah/session' && method === 'POST') {
    let sess = db.murajaahSessions.find((m: any) => m.userId === currentUserId && m.status === 'berlangsung');
    if (!sess) {
      sess = {
        id: `mrj-${Date.now()}`,
        userId: currentUserId,
        surahName: 'Murajaah Al-Qur\'an',
        repetitions: 0,
        maxRepetitions: 75,
        status: 'berlangsung',
        xpAwarded: 0,
        startedAt: new Date().toISOString()
      };
      db.murajaahSessions.push(sess);
      saveClientDb(db);
    }
    return { session: sess } as unknown as T;
  }

  // /murajaah/step
  if (endpoint === '/murajaah/step' && method === 'POST') {
    const { sessionId, delta } = body;
    const sess = db.murajaahSessions.find((m: any) => m.id === sessionId);
    if (sess && sess.status !== 'selesai') {
      sess.repetitions = Math.min(75, Math.max(0, sess.repetitions + delta));
      saveClientDb(db);
    }
    return { session: sess } as unknown as T;
  }

  // /murajaah/complete
  if (endpoint === '/murajaah/complete' && method === 'POST') {
    const { sessionId } = body;
    const sess = db.murajaahSessions.find((m: any) => m.id === sessionId);
    if (sess && sess.status !== 'selesai' && sess.repetitions >= 75) {
      sess.status = 'selesai';
      sess.xpAwarded = 300;
      sess.completedAt = new Date().toISOString();
      db.xpTransactions.push({
        id: `tx-mrj-${Date.now()}`,
        userId: currentUserId,
        transactionType: 'murajaah',
        amount: 300,
        reason: 'Penyelesaian Murajaah 75x Pengulangan',
        createdAt: new Date().toISOString()
      });
      saveClientDb(db);
    }
    const xp = calculateLocalNetXp(currentUserId, db);
    return {
      message: 'Sesi murajaah 75x selesai. +300 XP ditambahkan!',
      session: sess,
      xpAwarded: 300,
      totalNetXp: xp,
      rank: getRankByXp(xp)
    } as unknown as T;
  }

  // /murajaah/history
  if (endpoint === '/murajaah/history') {
    const history = (db.murajaahSessions || []).filter((m: any) => m.userId === currentUserId && m.status === 'selesai');
    return { history } as unknown as T;
  }

  // /xp/history
  if (endpoint === '/xp/history') {
    const transactions = (db.xpTransactions || []).filter((t: any) => t.userId === currentUserId);
    const netXp = calculateLocalNetXp(currentUserId, db);
    return { netXp, transactions } as unknown as T;
  }

  // /attendance
  if (endpoint === '/attendance' && method === 'GET') {
    return {
      records: db.attendance || [],
      learningDays: db.learningDays || [],
      notes: db.teacherNotes || [],
      penalties: []
    } as unknown as T;
  }

  // /attendance/check-in
  if (endpoint === '/attendance/check-in' && method === 'POST') {
    const record = {
      id: `att-${Date.now()}`,
      userId: currentUserId,
      localDate: today,
      status: body.status || 'hadir',
      recordedAt: new Date().toISOString()
    };
    db.attendance.push(record);
    saveClientDb(db);
    return { message: 'Presensi hari ini berhasil dicatat.', record } as unknown as T;
  }

  // /leaderboard
  if (endpoint === '/leaderboard') {
    const list = db.profiles.filter((p: any) => p.role === 'murid').map((m: any, idx: number) => {
      const xp = calculateLocalNetXp(m.id, db);
      return {
        id: m.id,
        username: m.username,
        fullName: m.fullName,
        avatarUrl: m.avatarUrl,
        xp,
        rank: getRankByXp(xp)
      };
    });
    list.sort((a: any, b: any) => b.xp - a.xp);
    const leaderboard = list.map((item: any, i: number) => ({ position: i + 1, ...item }));
    return { leaderboard } as unknown as T;
  }

  // /notifications
  if (endpoint === '/notifications') {
    return { notifications: db.notifications || [] } as unknown as T;
  }

  // /teacher/students POST (Add student)
  if (endpoint === '/teacher/students' && method === 'POST') {
    const { username, fullName, avatarUrl } = body;
    const newId = `usr-${Date.now()}`;
    const newProfile = {
      id: newId,
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      role: 'murid',
      avatarUrl: avatarUrl || '',
      status: 'aktif',
      groupId: db.groups?.[0]?.id || 'grp-tahfiz-1',
      createdAt: new Date().toISOString()
    };
    db.profiles.push(newProfile);
    saveClientDb(db);
    return {
      message: `Santri ${newProfile.fullName} berhasil didaftarkan.`,
      student: {
        ...newProfile,
        xp: 0,
        rank: getRankByXp(0)
      }
    } as unknown as T;
  }

  // /teacher/students/:id DELETE (Delete student)
  if (endpoint.startsWith('/teacher/students/') && method === 'DELETE') {
    const studentId = endpoint.replace('/teacher/students/', '');
    db.profiles = (db.profiles || []).filter((p: any) => p.id !== studentId);
    db.targets = (db.targets || []).filter((t: any) => t.userId !== studentId);
    db.murajaahSessions = (db.murajaahSessions || []).filter((m: any) => m.userId !== studentId);
    db.xpTransactions = (db.xpTransactions || []).filter((x: any) => x.userId !== studentId);
    db.attendance = (db.attendance || []).filter((a: any) => a.userId !== studentId);
    db.learningDays = (db.learningDays || []).filter((l: any) => l.userId !== studentId);
    db.teacherNotes = (db.teacherNotes || []).filter((n: any) => n.studentId !== studentId);
    db.notifications = (db.notifications || []).filter((n: any) => n.userId !== studentId);
    saveClientDb(db);
    return { message: 'Akun santri berhasil dihapus.' } as unknown as T;
  }

  // /teacher/students
  if (endpoint === '/teacher/students') {
    const students = db.profiles.filter((p: any) => p.role === 'murid').map((s: any) => {
      const xp = calculateLocalNetXp(s.id, db);
      return {
        id: s.id,
        username: s.username,
        fullName: s.fullName,
        avatarUrl: s.avatarUrl,
        xp,
        rank: getRankByXp(xp),
        activeTargets: (db.targets || []).filter((t: any) => t.userId === s.id && t.status === 'aktif').length,
        completedTargets: (db.targets || []).filter((t: any) => t.userId === s.id && t.status === 'selesai').length,
        totalMurajaahSessions: (db.murajaahSessions || []).filter((m: any) => m.userId === s.id && m.status === 'selesai').length,
        todayAttendanceStatus: 'hadir',
        todayActiveLearning: true
      };
    });
    return { students } as unknown as T;
  }

  // /admin/summary
  if (endpoint === '/admin/summary') {
    const totalMurid = db.profiles.filter((p: any) => p.role === 'murid').length;
    const totalGuru = db.profiles.filter((p: any) => p.role === 'guru').length;
    const rankDistribution: Record<string, number> = {};
    RANKS_DATA.forEach(r => (rankDistribution[r.name] = 0));
    db.profiles.filter((p: any) => p.role === 'murid').forEach((m: any) => {
      const r = getRankByXp(calculateLocalNetXp(m.id, db));
      rankDistribution[r.name] = (rankDistribution[r.name] || 0) + 1;
    });

    return {
      summary: {
        totalMurid,
        totalGuru,
        totalGroups: 1,
        activeTargets: db.targets.length,
        completedTargets: 0,
        totalMurajaahSessions: db.murajaahSessions.length,
        activeTodayStudents: 1,
        rankDistribution
      }
    } as unknown as T;
  }

  // /admin/users
  if (endpoint === '/admin/users') {
    return { users: db.profiles } as unknown as T;
  }

  // /admin/audit-logs
  if (endpoint === '/admin/audit-logs') {
    return { logs: db.auditLogs || [] } as unknown as T;
  }

  // Default fallback
  return {} as unknown as T;
}

function generateFallbackSections(targetId: string, start: number, end: number) {
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

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (body: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: (body: any) => request<any>('/auth/delete-account', { method: 'POST', body: JSON.stringify(body) }),

  // Surahs
  getSurahs: () => request<any>('/surahs'),
  getSurah: (num: number) => request<any>(`/surahs/${num}`),

  // Ranks
  getRanks: () => request<any>('/ranks'),

  // Targets
  getTargets: () => request<any>('/targets'),
  createTarget: (body: any) => request<any>('/targets', { method: 'POST', body: JSON.stringify(body) }),
  updateTarget: (id: string, body: any) => request<any>(`/targets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTarget: (id: string) => request<any>(`/targets/${id}`, { method: 'DELETE' }),
  recordStageRep: (targetId: string, body: any) => request<any>(`/targets/${targetId}/stage-rep`, { method: 'POST', body: JSON.stringify(body) }),

  // Murajaah
  getMurajaahSession: (body: any = {}) => request<any>('/murajaah/session', { method: 'POST', body: JSON.stringify(body) }),
  stepMurajaah: (body: { sessionId: string; delta: number }) => request<any>('/murajaah/step', { method: 'POST', body: JSON.stringify(body) }),
  completeMurajaah: (body: { sessionId: string; idempotencyKey?: string }) => request<any>('/murajaah/complete', { method: 'POST', body: JSON.stringify(body) }),
  getMurajaahHistory: () => request<any>('/murajaah/history'),

  // XP & Attendance
  getXpHistory: () => request<any>('/xp/history'),
  getAttendance: () => request<any>('/attendance'),
  checkInAttendance: (body: { status?: string; notes?: string }) => request<any>('/attendance/check-in', { method: 'POST', body: JSON.stringify(body) }),

  // Leaderboard
  getLeaderboard: () => request<any>('/leaderboard'),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),

  // Teacher
  getTeacherStudents: () => request<any>('/teacher/students'),
  createTeacherStudent: (body: any) => request<any>('/teacher/students', { method: 'POST', body: JSON.stringify(body) }),
  deleteTeacherStudent: (id: string) => request<any>(`/teacher/students/${id}`, { method: 'DELETE' }),
  getStudentDetail: (id: string) => request<any>(`/teacher/students/${id}`),
  giveBonusXp: (body: any) => request<any>('/teacher/bonus-xp', { method: 'POST', body: JSON.stringify(body) }),
  sendTeacherNote: (body: any) => request<any>('/teacher/notes', { method: 'POST', body: JSON.stringify(body) }),

  // Admin
  getAdminSummary: () => request<any>('/admin/summary'),
  getAdminUsers: () => request<any>('/admin/users'),
  createAdminUser: (body: any) => request<any>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  correctXp: (body: any) => request<any>('/admin/correct-xp', { method: 'POST', body: JSON.stringify(body) }),
  runInactivityCheck: () => request<any>('/admin/run-inactivity-check', { method: 'POST' }),
  getAuditLogs: () => request<any>('/admin/audit-logs'),
  getGroups: () => request<any>('/admin/groups'),
};
