import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  getDb,
  saveDb,
  calculateNetXp,
  getLocalDateMakassar,
  generateFiveSections,
  UserProfile,
  MemorizationTarget,
  MurajaahSession,
  XpTransaction,
  AttendanceRecord,
  NotificationItem,
  TeacherNote,
  AuditLogItem
} from './server/db';
import { SURAHS_DATA } from './src/data/surahs';
import { RANKS_DATA, getRankByXp, getRankProgress } from './src/data/ranks';
import { evaluateInactivityPenalties } from './server/inactivity';

const JWT_SECRET = process.env.JWT_SECRET || 'hifzup-secret-key-2026-bismillah';
const PORT = 3000;

interface AuthTokenPayload {
  userId: string;
  role: 'murid' | 'guru' | 'admin';
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

// Authentication Middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak: token autentikasi tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded) {
      return res.status(403).json({ error: 'Sesi kedaluwarsa atau token tidak valid. Silakan masuk kembali.' });
    }
    req.user = decoded as AuthTokenPayload;
    next();
  });
}

function requireRole(...allowedRoles: ('murid' | 'guru' | 'admin')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Akses ditolak: peran ${req.user?.role || 'tidak diketahui'} tidak memiliki izin ke menu ini.`
      });
    }
    next();
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize DB
  getDb();

  // Run initial inactivity check once on startup safely
  try {
    const db = getDb();
    evaluateInactivityPenalties(db);
    saveDb(db);
  } catch (err) {
    console.warn('Initial inactivity check:', err);
  }

  // ==================== AUTH ROUTES ====================
  const MASTER_TEACHER_APPROVAL_CODE = 'HIFZUP-GURU-2026';

  // Dedicated Teacher Registration with Role Verification & Validation
  app.post('/api/auth/register-teacher', async (req: Request, res: Response) => {
    try {
      const {
        username,
        password,
        fullName,
        phoneNumber,
        institution,
        sanadInfo,
        approvalCode,
        avatarUrl
      } = req.body;

      if (!username || !password || !fullName) {
        return res.status(400).json({ error: 'Username, kata sandi, dan nama lengkap wajib diisi.' });
      }

      if (!phoneNumber || phoneNumber.trim().length < 8) {
        return res.status(400).json({ error: 'Nomor telepon/WhatsApp aktif wajib diisi (minimal 8 digit).' });
      }

      if (!institution || institution.trim().length < 3) {
        return res.status(400).json({ error: 'Nama Lembaga/Pesantren/Madrasah wajib diisi (minimal 3 karakter).' });
      }

      if (!sanadInfo || sanadInfo.trim().length < 3) {
        return res.status(400).json({ error: 'Kualifikasi hafalan atau sanad Al-Qur\'an wajib diisi.' });
      }

      if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username minimal 3 karakter dan hanya boleh berisi huruf, angka, dan underscore.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      }

      const db = getDb();
      const cleanUsername = username.trim().toLowerCase();

      if (db.profiles.some(p => p.username.toLowerCase() === cleanUsername)) {
        return res.status(409).json({ error: 'Username ini sudah digunakan. Silakan pilih username lain.' });
      }

      // Role verification: check approval code if supplied
      const isInstantApproved = !!approvalCode && approvalCode.trim().toUpperCase() === MASTER_TEACHER_APPROVAL_CODE;

      if (approvalCode && approvalCode.trim() && !isInstantApproved) {
        return res.status(400).json({
          error: 'Kode persetujuan lembaga tidak valid. Silakan periksa kembali atau kosongkan kolom kode jika ingin mendaftar dengan verifikasi manual oleh Administrator.'
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const newUserId = `usr-${Date.now()}`;

      let groupId = '';

      if (isInstantApproved) {
        // Auto-create teacher's halaqah group immediately
        groupId = `grp-${Date.now()}`;
        db.groups.push({
          id: groupId,
          name: `Halaqah ${fullName.trim()}`,
          description: `Kelompok hafalan Al-Qur'an bimbingan ${fullName.trim()} (${institution.trim()})`,
          teacherId: newUserId,
          createdAt: new Date().toISOString()
        });
      }

      const newProfile: UserProfile = {
        id: newUserId,
        username: cleanUsername,
        fullName: fullName.trim(),
        role: 'guru',
        passwordHash,
        avatarUrl: avatarUrl || '',
        status: isInstantApproved ? 'aktif' : 'menunggu_verifikasi',
        groupId: isInstantApproved ? groupId : undefined,
        createdAt: new Date().toISOString(),
        phoneNumber: phoneNumber.trim(),
        institution: institution.trim(),
        sanadInfo: sanadInfo.trim(),
        approvalStatus: isInstantApproved ? 'approved' : 'pending',
        approvedBy: isInstantApproved ? 'INSTITUTION_KEY' : undefined,
        approvedAt: isInstantApproved ? new Date().toISOString() : undefined
      };

      db.profiles.push(newProfile);

      if (isInstantApproved) {
        // Welcome notification
        db.notifications.push({
          id: `notif-${Date.now()}`,
          userId: newUserId,
          title: 'Selamat Datang Ustadz/Ustadzah! 🌟',
          message: 'Pendaftaran dan verifikasi akun guru berhasil! Portal guru pembina siap digunakan untuk membimbing santri.',
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString()
        });

        // Audit log
        db.audit_logs.push({
          id: `aud-${Date.now()}`,
          actorId: newUserId,
          actorName: newProfile.fullName,
          action: 'REGISTER_TEACHER_INSTANT_APPROVED',
          targetType: 'USER',
          targetId: newUserId,
          details: `Pendaftaran guru pembina aktif (Kode Lembaga Terverifikasi): ${newProfile.fullName} (@${newProfile.username}) - ${institution.trim()}`,
          createdAt: new Date().toISOString()
        });

        await saveDb(db);

        const token = jwt.sign(
          { userId: newProfile.id, role: newProfile.role, username: newProfile.username },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        return res.status(201).json({
          message: 'Alhamdulillah! Akun Guru Pembina berhasil didaftarkan dan langsung aktif dengan Kode Verifikasi Lembaga.',
          verified: true,
          requiresApproval: false,
          token,
          profile: {
            id: newProfile.id,
            username: newProfile.username,
            fullName: newProfile.fullName,
            role: newProfile.role,
            avatarUrl: newProfile.avatarUrl,
            groupId: newProfile.groupId,
            institution: newProfile.institution,
            sanadInfo: newProfile.sanadInfo,
            status: newProfile.status,
            xp: 0,
            rank: getRankByXp(0)
          }
        });
      } else {
        // Pending approval workflow
        // Notify all admins about the new applicant
        const admins = db.profiles.filter(p => p.role === 'admin');
        admins.forEach(adm => {
          db.notifications.push({
            id: `notif-app-${Date.now()}-${adm.id}`,
            userId: adm.id,
            title: 'Pengajuan Guru Pembina Baru! 📋',
            message: `${fullName.trim()} (${institution.trim()}) mendaftar sebagai guru pembina dan menunggu verifikasi.`,
            type: 'info',
            isRead: false,
            createdAt: new Date().toISOString()
          });
        });

        // Audit log
        db.audit_logs.push({
          id: `aud-${Date.now()}`,
          actorId: newUserId,
          actorName: newProfile.fullName,
          action: 'REGISTER_TEACHER_PENDING_APPROVAL',
          targetType: 'USER',
          targetId: newUserId,
          details: `Pendaftaran guru pembina baru menunggu persetujuan admin: ${newProfile.fullName} (@${newProfile.username}) - Lembaga: ${institution.trim()}, Sanad: ${sanadInfo.trim()}`,
          createdAt: new Date().toISOString()
        });

        await saveDb(db);

        return res.status(201).json({
          message: 'Pendaftaran Guru Pembina berhasil diajukan! Akun Anda saat ini berada dalam tahap verifikasi oleh Administrator Lembaga sebelum dapat digunakan untuk masuk.',
          verified: false,
          requiresApproval: true,
          profile: {
            username: newProfile.username,
            fullName: newProfile.fullName,
            institution: newProfile.institution,
            status: newProfile.status
          }
        });
      }
    } catch (err: any) {
      console.error('Teacher registration error:', err);
      return res.status(500).json({ error: 'Terjadi kesalahan sistem saat mendaftarkan akun guru.' });
    }
  });

  // General Register (Murid)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, password, fullName, avatarUrl, role = 'murid' } = req.body;

      if (!username || !password || !fullName) {
        return res.status(400).json({ error: 'Username, kata sandi, dan nama lengkap wajib diisi.' });
      }

      if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username minimal 3 karakter dan hanya boleh berisi huruf, angka, dan underscore.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      }

      if (role === 'guru') {
        return res.status(400).json({
          error: 'Pendaftaran Guru Pembina memerlukan verifikasi kualifikasi hafalan dan institusi. Silakan gunakan formulir khusus Pendaftaran Guru.'
        });
      }

      const assignedRole: 'murid' = 'murid';

      const db = getDb();
      const cleanUsername = username.trim().toLowerCase();

      if (db.profiles.some(p => p.username.toLowerCase() === cleanUsername)) {
        return res.status(409).json({ error: 'Username ini sudah digunakan. Silakan pilih username lain.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const newUserId = `usr-${Date.now()}`;
      const groupId = db.groups[0]?.id || '';

      const newProfile: UserProfile = {
        id: newUserId,
        username: cleanUsername,
        fullName: fullName.trim(),
        role: assignedRole,
        passwordHash,
        avatarUrl: avatarUrl || '',
        status: 'aktif',
        groupId,
        createdAt: new Date().toISOString()
      };

      db.profiles.push(newProfile);

      // Assign student to first available teacher
      const availableTeacher = db.profiles.find(p => p.role === 'guru');
      if (availableTeacher) {
        db.teacher_student_assignments.push({
          id: `asg-${Date.now()}`,
          teacherId: availableTeacher.id,
          studentId: newUserId,
          assignedAt: new Date().toISOString()
        });
      }

      // Welcome notification
      db.notifications.push({
        id: `notif-${Date.now()}`,
        userId: newUserId,
        title: 'Selamat Datang di HIFZUP!',
        message: 'Ahlan wa sahlan! Mulai hafalan pertamamu dan jadilah penghafal Al-Qur\'an berprestasi.',
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // Audit log
      db.audit_logs.push({
        id: `aud-${Date.now()}`,
        actorId: newUserId,
        actorName: newProfile.fullName,
        action: 'REGISTER_STUDENT',
        targetType: 'USER',
        targetId: newUserId,
        details: `Pendaftaran santri mandiri: ${newProfile.fullName} (@${newProfile.username})`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);

      const token = jwt.sign(
        { userId: newProfile.id, role: newProfile.role, username: newProfile.username },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        message: 'Pendaftaran berhasil. Selamat bergabung di HIFZUP!',
        token,
        profile: {
          id: newProfile.id,
          username: newProfile.username,
          fullName: newProfile.fullName,
          role: newProfile.role,
          avatarUrl: newProfile.avatarUrl,
          groupId: newProfile.groupId,
          xp: 0,
          rank: getRankByXp(0)
        }
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Terjadi kesalahan sistem saat mendaftar.' });
    }
  });

  // Login (Murid, Guru, Admin)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password, expectedRole } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username dan kata sandi wajib diisi.' });
      }

      const db = getDb();
      const cleanUsername = username.trim().toLowerCase();
      const user = db.profiles.find(p => p.username.toLowerCase() === cleanUsername);

      if (!user) {
        return res.status(401).json({ error: 'Username atau kata sandi tidak sesuai.' });
      }

      // Check account approval/status
      if (user.status !== 'aktif') {
        if (user.status === 'menunggu_verifikasi') {
          return res.status(403).json({
            error: 'Akun Guru Pembina Anda masih dalam tahap verifikasi oleh Administrator Lembaga. Mohon menunggu persetujuan admin sebelum dapat masuk.'
          });
        }
        if (user.status === 'ditolak') {
          return res.status(403).json({
            error: `Pengajuan akun Guru Pembina Anda belum disetujui oleh Administrator Lembaga.${user.rejectionReason ? ` Catatan: ${user.rejectionReason}` : ''}`
          });
        }
        return res.status(403).json({ error: 'Akun ini dinonaktifkan oleh pihak administrator.' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Username atau kata sandi tidak sesuai.' });
      }

      // Validate expected role per Bagian 5: Murid login can only log in students, Guru login for teachers
      if (expectedRole && user.role !== expectedRole) {
        if (expectedRole === 'murid' && user.role !== 'murid') {
          return res.status(403).json({
            error: `Akun ini adalah ${user.role.toUpperCase()}. Silakan gunakan portal Login Guru / Admin.`
          });
        }
        if (expectedRole === 'guru' && user.role !== 'guru' && user.role !== 'admin') {
          return res.status(403).json({
            error: 'Akun ini bukan akun Guru. Silakan masuk melalui portal Login Murid.'
          });
        }
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role, username: user.username },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const netXp = calculateNetXp(user.id, db);
      const rank = getRankByXp(netXp);

      return res.json({
        message: 'Login berhasil.',
        token,
        profile: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          groupId: user.groupId,
          xp: netXp,
          rank
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Terjadi kesalahan sistem saat proses masuk.' });
    }
  });

  // Me (Profile & Session Refresh)
  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const user = db.profiles.find(p => p.id === req.user!.userId);

    if (!user || user.status !== 'aktif') {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan atau tidak aktif.' });
    }

    const netXp = calculateNetXp(user.id, db);
    const rankProgress = getRankProgress(netXp);
    const todayMakassar = getLocalDateMakassar();

    const todayAttendance = db.attendance.find(a => a.userId === user.id && a.localDate === todayMakassar);
    const todayLearning = db.daily_learning_activity.find(d => d.userId === user.id && d.localDate === todayMakassar);
    const unreadNotifications = db.notifications.filter(n => n.userId === user.id && !n.isRead).length;

    // Calculate learning streak
    const pastLearningDays = db.daily_learning_activity
      .filter(d => d.userId === user.id && d.activeLearning)
      .map(d => d.localDate)
      .sort()
      .reverse();

    let streak = 0;
    if (todayLearning?.activeLearning) {
      streak = 1;
    }
    // Check previous days consecutively
    let checkDate = new Date();
    if (!todayLearning?.activeLearning) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const dateStr = getLocalDateMakassar(checkDate);
      if (pastLearningDays.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return res.json({
      profile: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        groupId: user.groupId,
        status: user.status,
        createdAt: user.createdAt,
        xp: netXp,
        rank: rankProgress.currentRank,
        rankProgress,
        todayAttendanceStatus: todayAttendance?.status || null,
        todayActiveLearning: !!todayLearning?.activeLearning,
        streak,
        unreadNotifications
      }
    });
  });

  // Update Profile
  app.put('/api/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fullName, avatarUrl } = req.body;
      const db = getDb();
      const user = db.profiles.find(p => p.id === req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      }

      if (fullName && fullName.trim().length > 0) {
        user.fullName = fullName.trim();
      }

      if (typeof avatarUrl === 'string') {
        user.avatarUrl = avatarUrl;
      }

      await saveDb(db);
      return res.json({ message: 'Profil berhasil diperbarui.', profile: user });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memperbarui profil.' });
    }
  });

  // Delete Account per Bagian 5
  app.post('/api/auth/delete-account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { password, confirmationText } = req.body;
      if (confirmationText !== 'HAPUS AKUN SAYA') {
        return res.status(400).json({ error: 'Konfirmasi teks tidak sesuai. Ketik "HAPUS AKUN SAYA".' });
      }

      const db = getDb();
      const user = db.profiles.find(p => p.id === req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Kata sandi verifikasi tidak sesuai.' });
      }

      // Archive user and clean sensitive info safely
      user.status = 'nonaktif';
      user.fullName = `[Akun Dihapus ${user.id.slice(-4)}]`;
      user.avatarUrl = '';
      user.passwordHash = 'DELETED';

      // Mark audit
      db.audit_logs.push({
        id: `aud-del-${Date.now()}`,
        actorId: user.id,
        actorName: 'User Self-Deletion',
        action: 'DELETE_ACCOUNT',
        targetType: 'USER',
        targetId: user.id,
        details: `Pengguna ${user.username} menghapus akunnya sendiri.`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);
      return res.json({ message: 'Akun kamu berhasil dihapus dan sesi telah diakhiri.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memproses penghapusan akun.' });
    }
  });

  // ==================== SURAHS (114 DATABASE) ====================
  app.get('/api/surahs', (_req: Request, res: Response) => {
    return res.json({
      total: SURAHS_DATA.length,
      surahs: SURAHS_DATA
    });
  });

  app.get('/api/surahs/:number', (req: Request, res: Response) => {
    const num = parseInt(req.params.number, 10);
    const surah = SURAHS_DATA.find(s => s.number === num);
    if (!surah) {
      return res.status(404).json({ error: 'Surah tidak ditemukan.' });
    }
    return res.json(surah);
  });

  // ==================== RANKS ====================
  app.get('/api/ranks', (_req: Request, res: Response) => {
    return res.json({
      total: RANKS_DATA.length,
      ranks: RANKS_DATA
    });
  });

  // ==================== TARGETS HAFALAN ====================
  // Get student targets
  app.get('/api/targets', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const targets = db.memorization_targets.filter(t => t.userId === req.user!.userId && t.status !== 'diarsipkan');
    return res.json({ targets });
  });

  // Create target hafalan
  app.post('/api/targets', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { surahNumber, startAyah, endAyah, title, targetDate, notes } = req.body;
      const surahNum = parseInt(surahNumber, 10);
      const start = parseInt(startAyah, 10);
      const end = parseInt(endAyah, 10);

      const surah = SURAHS_DATA.find(s => s.number === surahNum);
      if (!surah) {
        return res.status(400).json({ error: 'Nomor surah tidak valid (harus 1-114).' });
      }

      // Validasi ayat per Bagian 8
      if (isNaN(start) || start < 1) {
        return res.status(400).json({ error: 'Ayat awal minimal bernilai 1.' });
      }
      if (isNaN(end) || end > surah.numberOfAyahs) {
        return res.status(400).json({ error: `Ayat akhir maksimal bernilai ${surah.numberOfAyahs} untuk Surah ${surah.name}.` });
      }
      if (start > end) {
        return res.status(400).json({ error: 'Ayat awal tidak boleh lebih besar daripada ayat akhir.' });
      }

      const db = getDb();
      const targetId = `tgt-${Date.now()}`;
      const sections = generateFiveSections(targetId, start, end);

      const newTarget: MemorizationTarget = {
        id: targetId,
        userId: req.user!.userId,
        surahNumber: surah.number,
        surahName: surah.name,
        surahArabic: surah.nameArabic,
        startAyah: start,
        endAyah: end,
        title: title?.trim() || `Target ${surah.name} (${start}-${end})`,
        startDate: getLocalDateMakassar(),
        targetDate: targetDate || '',
        notes: notes?.trim() || '',
        status: 'aktif',
        createdAt: new Date().toISOString(),
        sections
      };

      db.memorization_targets.push(newTarget);

      // Audit log
      db.audit_logs.push({
        id: `aud-tgt-${Date.now()}`,
        actorId: req.user!.userId,
        actorName: req.user!.username,
        action: 'CREATE_TARGET',
        targetType: 'MEMORIZATION_TARGET',
        targetId,
        details: `Membuat target hafalan Surah ${surah.name} ayat ${start}-${end}`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);
      return res.status(201).json({ message: 'Target hafalan berhasil dibuat.', target: newTarget });
    } catch (err: any) {
      console.error('Target creation error:', err);
      return res.status(500).json({ error: 'Gagal membuat target hafalan.' });
    }
  });

  // Edit target
  app.put('/api/targets/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { title, targetDate, notes } = req.body;
      const db = getDb();
      const target = db.memorization_targets.find(t => t.id === id && t.userId === req.user!.userId);

      if (!target) {
        return res.status(404).json({ error: 'Target hafalan tidak ditemukan.' });
      }

      if (title) target.title = title.trim();
      if (targetDate) target.targetDate = targetDate;
      if (typeof notes === 'string') target.notes = notes.trim();

      await saveDb(db);
      return res.json({ message: 'Target hafalan berhasil diperbarui.', target });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memperbarui target hafalan.' });
    }
  });

  // Archive / Delete target
  app.delete('/api/targets/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const db = getDb();
      const target = db.memorization_targets.find(t => t.id === id && t.userId === req.user!.userId);

      if (!target) {
        return res.status(404).json({ error: 'Target hafalan tidak ditemukan.' });
      }

      target.status = 'diarsipkan';
      await saveDb(db);
      return res.json({ message: 'Target hafalan berhasil diarsipkan.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengarsipkan target hafalan.' });
    }
  });

  // Record Repetition on a Stage (1, 2, 3, 4) per Bagian 8
  app.post('/api/targets/:id/stage-rep', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { sectionNumber, stageNumber, idempotencyKey } = req.body;

      const secNum = parseInt(sectionNumber, 10);
      const stgNum = parseInt(stageNumber, 10);

      if (secNum < 1 || secNum > 5 || stgNum < 1 || stgNum > 4) {
        return res.status(400).json({ error: 'Nomor bagian (1-5) atau tahap (1-4) tidak valid.' });
      }

      const db = getDb();
      const target = db.memorization_targets.find(t => t.id === id && t.userId === req.user!.userId && t.status === 'aktif');

      if (!target) {
        return res.status(404).json({ error: 'Target hafalan tidak ditemukan atau sudah tidak aktif.' });
      }

      const section = target.sections.find(s => s.sectionNumber === secNum);
      if (!section) {
        return res.status(404).json({ error: 'Bagian hafalan tidak ditemukan.' });
      }

      const stage = section.stages.find(stg => stg.stageNumber === stgNum);
      if (!stage) {
        return res.status(404).json({ error: 'Tahap latihan tidak ditemukan.' });
      }

      // Check stage max repetitions
      if (stage.repetitions >= stage.maxRepetitions) {
        return res.status(400).json({ error: `Tahap ${stgNum} sudah mencapai batas maksimum 5 pengulangan.` });
      }

      // Check idempotency if key provided
      if (idempotencyKey) {
        const existingTx = db.xp_transactions.find(tx => tx.idempotencyKey === idempotencyKey);
        if (existingTx) {
          return res.json({
            message: 'Transaksi sudah pernah diproses (idempoten).',
            stage,
            xpEarned: existingTx.amount,
            netXp: calculateNetXp(req.user!.userId, db)
          });
        }
      }

      // Increment repetition and calculate stage XP exactly per Bagian 8
      // Tahap 1: 1 XP per rep, Tahap 2: 2 XP per rep, Tahap 3: 3 XP per rep, Tahap 4: 4 XP per rep
      const xpIncrement = stgNum;
      stage.repetitions += 1;
      stage.xpEarned = stage.repetitions * xpIncrement;

      if (stage.repetitions >= stage.maxRepetitions) {
        stage.status = 'selesai';
      } else {
        stage.status = 'proses';
      }

      // Update section status
      const allStagesCompleted = section.stages.every(st => st.status === 'selesai');
      if (allStagesCompleted) {
        section.status = 'selesai';
      } else {
        section.status = 'proses';
      }

      // Check if all 5 sections completed
      const allSectionsCompleted = target.sections.every(sc => sc.status === 'selesai');
      if (allSectionsCompleted) {
        target.status = 'selesai';
        target.completedAt = new Date().toISOString();

        // Target completion notification
        db.notifications.push({
          id: `notif-tgt-done-${Date.now()}`,
          userId: req.user!.userId,
          title: 'Target Hafalan Selesai! 🎉',
          message: `Maa syaa Allah! Seluruh 5 bagian ${target.title} telah tuntas dipelajari! Total 250 XP telah kamu kumpulkan.`,
          type: 'target_completed',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      // Record XP transaction
      const txId = `tx-rep-${Date.now()}`;
      const prevXp = calculateNetXp(req.user!.userId, db);
      const prevRank = getRankByXp(prevXp);

      const xpTx: XpTransaction = {
        id: txId,
        userId: req.user!.userId,
        transactionType: 'hafalan',
        amount: xpIncrement,
        reason: `Pengulangan ke-${stage.repetitions} Tahap ${stgNum} (Bagian ${secNum}) - ${target.surahName}`,
        sourceActivity: 'stage_repetition',
        activityId: stage.id,
        createdAt: new Date().toISOString(),
        idempotencyKey
      };
      db.xp_transactions.push(xpTx);

      // Record active learning for today
      const todayMakassar = getLocalDateMakassar();
      let todayActivity = db.daily_learning_activity.find(d => d.userId === req.user!.userId && d.localDate === todayMakassar);
      if (!todayActivity) {
        todayActivity = {
          id: `dla-${Date.now()}`,
          userId: req.user!.userId,
          localDate: todayMakassar,
          activeLearning: true,
          repCount: 1,
          murajaahReps: 0,
          summary: `Pengulangan hafalan ${target.surahName}`
        };
        db.daily_learning_activity.push(todayActivity);
      } else {
        todayActivity.activeLearning = true;
        todayActivity.repCount += 1;
      }

      // Check for rank up celebration
      const newXp = calculateNetXp(req.user!.userId, db);
      const newRank = getRankByXp(newXp);
      let rankedUp = false;

      if (newRank.order > prevRank.order) {
        rankedUp = true;
        db.notifications.push({
          id: `notif-rank-${Date.now()}`,
          userId: req.user!.userId,
          title: 'Selamat Naik Rank! 🏆',
          message: `Mubarak! Kamu telah naik rank dari ${prevRank.name} ke ${newRank.name} (${newXp} XP)!`,
          type: 'rank_up',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      await saveDb(db);

      return res.json({
        message: `Pengulangan dicatat (+${xpIncrement} XP).`,
        stage,
        section,
        target,
        xpAwarded: xpIncrement,
        totalNetXp: newXp,
        rank: newRank,
        rankedUp,
        prevRank
      });
    } catch (err: any) {
      console.error('Stage rep error:', err);
      return res.status(500).json({ error: 'Gagal mencatat pengulangan hafalan.' });
    }
  });

  // ==================== MURAJAAH (0..75 REPETITIONS = 300 XP) ====================
  // Get active or start new Murajaah Session
  app.post('/api/murajaah/session', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { surahNumber, startAyah, endAyah } = req.body;
      const db = getDb();

      // Check if there is an unfinished session
      let session = db.murajaah_sessions.find(m => m.userId === req.user!.userId && m.status === 'berlangsung');

      if (!session) {
        let surahName = 'Murajaah Mandiri';
        if (surahNumber) {
          const s = SURAHS_DATA.find(x => x.number === parseInt(surahNumber, 10));
          if (s) surahName = `Surah ${s.name}`;
        }

        session = {
          id: `mrj-${Date.now()}`,
          userId: req.user!.userId,
          surahNumber: surahNumber ? parseInt(surahNumber, 10) : undefined,
          surahName,
          startAyah: startAyah ? parseInt(startAyah, 10) : undefined,
          endAyah: endAyah ? parseInt(endAyah, 10) : undefined,
          repetitions: 0,
          maxRepetitions: 75,
          status: 'berlangsung',
          xpAwarded: 0,
          startedAt: new Date().toISOString()
        };
        db.murajaah_sessions.push(session);
        await saveDb(db);
      }

      return res.json({ session });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memuat sesi murajaah.' });
    }
  });

  // Step Murajaah counter (+1 or -1)
  app.post('/api/murajaah/step', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, delta } = req.body;
      const db = getDb();
      const session = db.murajaah_sessions.find(m => m.id === sessionId && m.userId === req.user!.userId);

      if (!session) {
        return res.status(404).json({ error: 'Sesi murajaah tidak ditemukan.' });
      }

      if (session.status === 'selesai') {
        return res.status(400).json({ error: 'Sesi murajaah ini sudah diselesaikan.' });
      }

      const numDelta = delta === -1 ? -1 : 1;
      const newCount = session.repetitions + numDelta;

      if (newCount < 0) {
        return res.status(400).json({ error: 'Hitungan murajaah tidak boleh kurang dari 0.' });
      }
      if (newCount > 75) {
        return res.status(400).json({ error: 'Hitungan murajaah sudah mencapai batas 75 pengulangan.' });
      }

      session.repetitions = newCount;
      await saveDb(db);

      return res.json({ session });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal memperbarui hitungan murajaah.' });
    }
  });

  // Complete Murajaah Session (Awards 300 XP) per Bagian 9
  app.post('/api/murajaah/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, idempotencyKey } = req.body;
      const db = getDb();
      const session = db.murajaah_sessions.find(m => m.id === sessionId && m.userId === req.user!.userId);

      if (!session) {
        return res.status(404).json({ error: 'Sesi murajaah tidak ditemukan.' });
      }

      // Check if already completed to prevent duplicate 300 XP per Bagian 9
      if (session.status === 'selesai' || session.xpAwarded > 0) {
        return res.status(400).json({
          error: 'Sesi ini sudah pernah diselesaikan dan mendapatkan XP sebelumnya. Buat sesi baru untuk mengulang.'
        });
      }

      if (session.repetitions < 75) {
        return res.status(400).json({
          error: `Belum memenuhi syarat 75 pengulangan (saat ini: ${session.repetitions}/75). Terus murajaah!`
        });
      }

      if (idempotencyKey) {
        const existingTx = db.xp_transactions.find(tx => tx.idempotencyKey === idempotencyKey);
        if (existingTx) {
          return res.json({
            message: 'Hadiah murajaah sudah dicatat (idempoten).',
            session,
            xpAwarded: 300,
            netXp: calculateNetXp(req.user!.userId, db)
          });
        }
      }

      const prevXp = calculateNetXp(req.user!.userId, db);
      const prevRank = getRankByXp(prevXp);

      // Award 300 XP
      session.status = 'selesai';
      session.xpAwarded = 300;
      session.completedAt = new Date().toISOString();
      session.idempotencyKey = idempotencyKey;

      const txId = `tx-mrj-${Date.now()}`;
      const newTx: XpTransaction = {
        id: txId,
        userId: req.user!.userId,
        transactionType: 'murajaah',
        amount: 300,
        reason: `Penyelesaian Murajaah 75x Pengulangan (${session.surahName || 'Al-Qur\'an'})`,
        sourceActivity: 'murajaah_session',
        activityId: session.id,
        createdAt: new Date().toISOString(),
        idempotencyKey
      };
      db.xp_transactions.push(newTx);

      // Record learning activity for today
      const todayMakassar = getLocalDateMakassar();
      let todayActivity = db.daily_learning_activity.find(d => d.userId === req.user!.userId && d.localDate === todayMakassar);
      if (!todayActivity) {
        todayActivity = {
          id: `dla-${Date.now()}`,
          userId: req.user!.userId,
          localDate: todayMakassar,
          activeLearning: true,
          repCount: 0,
          murajaahReps: 75,
          summary: 'Sesi murajaah 75x selesai'
        };
        db.daily_learning_activity.push(todayActivity);
      } else {
        todayActivity.activeLearning = true;
        todayActivity.murajaahReps += 75;
      }

      // Check rank up
      const newXp = calculateNetXp(req.user!.userId, db);
      const newRank = getRankByXp(newXp);
      let rankedUp = false;

      if (newRank.order > prevRank.order) {
        rankedUp = true;
        db.notifications.push({
          id: `notif-rank-${Date.now()}`,
          userId: req.user!.userId,
          title: 'Selamat Naik Rank! 🏆',
          message: `Mubarak! Kamu telah naik rank ke ${newRank.name} berkat istiqomah murajaah!`,
          type: 'rank_up',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      // Notification
      db.notifications.push({
        id: `notif-mrj-${Date.now()}`,
        userId: req.user!.userId,
        title: 'Murajaah 75x Tuntas! 🌟',
        message: 'Alhamdulillah! Sesi murajaah 75x pengulangan telah selesai. Kamu mendapatkan +300 XP!',
        type: 'murajaah_completed',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);

      return res.json({
        message: 'Maa syaa Allah! Sesi murajaah 75x selesai. +300 XP berhasil ditambahkan.',
        session,
        xpAwarded: 300,
        netXp: newXp,
        rank: newRank,
        rankedUp,
        prevRank
      });
    } catch (err: any) {
      console.error('Murajaah completion error:', err);
      return res.status(500).json({ error: 'Gagal menyelesaikan sesi murajaah.' });
    }
  });

  // Murajaah History
  app.get('/api/murajaah/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const history = db.murajaah_sessions
      .filter(m => m.userId === req.user!.userId && m.status === 'selesai')
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
    return res.json({ history });
  });

  // ==================== XP HISTORY ====================
  app.get('/api/xp/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const transactions = db.xp_transactions
      .filter(tx => tx.userId === req.user!.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const netXp = calculateNetXp(req.user!.userId, db);
    return res.json({ netXp, transactions });
  });

  // ==================== ATTENDANCE & CALENDAR ====================
  app.get('/api/attendance', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const records = db.attendance.filter(a => a.userId === req.user!.userId);
    const learningDays = db.daily_learning_activity.filter(d => d.userId === req.user!.userId);
    const notes = db.teacher_notes.filter(n => n.studentId === req.user!.userId);
    const penalties = db.xp_transactions.filter(t => t.userId === req.user!.userId && t.transactionType === 'sanksi_inaktif');

    return res.json({
      records,
      learningDays,
      notes,
      penalties
    });
  });

  app.post('/api/attendance/check-in', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status = 'hadir', notes = '' } = req.body;
      const todayMakassar = getLocalDateMakassar();
      const db = getDb();

      // Check if already checked in today
      let record = db.attendance.find(a => a.userId === req.user!.userId && a.localDate === todayMakassar);
      if (record) {
        return res.json({
          message: 'Kamu sudah mencatat absensi untuk hari ini.',
          record
        });
      }

      record = {
        id: `att-${Date.now()}`,
        userId: req.user!.userId,
        localDate: todayMakassar,
        recordedAt: new Date().toISOString(),
        status: status as any,
        recordedBy: req.user!.userId,
        notes: notes ? notes.trim() : 'Presensi mandiri aplikasi'
      };

      db.attendance.push(record);
      await saveDb(db);

      return res.status(201).json({
        message: `Presensi hari ini (${status.toUpperCase()}) berhasil dicatat. Jangan lupa murajaah dan hafalan!`,
        record
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mencatat presensi.' });
    }
  });

  // ==================== LEADERBOARD & RANK CHART ====================
  app.get('/api/leaderboard', (_req: Request, res: Response) => {
    const db = getDb();
    const activeStudents = db.profiles.filter(p => p.role === 'murid' && p.status === 'aktif');

    const leaderboard = activeStudents.map(student => {
      const xp = calculateNetXp(student.id, db);
      const rank = getRankByXp(xp);
      return {
        id: student.id,
        username: student.username,
        fullName: student.fullName,
        avatarUrl: student.avatarUrl,
        groupId: student.groupId,
        xp,
        rank
      };
    });

    // Sort by XP descending
    leaderboard.sort((a, b) => b.xp - a.xp);

    const rankedList = leaderboard.map((item, index) => ({
      position: index + 1,
      ...item
    }));

    return res.json({ leaderboard: rankedList });
  });

  // ==================== NOTIFICATIONS ====================
  app.get('/api/notifications', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const notifs = db.notifications
      .filter(n => n.userId === req.user!.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return res.json({ notifications: notifs });
  });

  app.post('/api/notifications/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user!.userId);
    if (notif) {
      notif.isRead = true;
      await saveDb(db);
    }
    return res.json({ success: true });
  });

  app.post('/api/notifications/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    db.notifications
      .filter(n => n.userId === req.user!.userId)
      .forEach(n => (n.isRead = true));
    await saveDb(db);
    return res.json({ success: true });
  });

  // ==================== TEACHER DASHBOARD ====================
  // List students assigned to teacher
  app.get('/api/teacher/students', authenticateToken, requireRole('guru', 'admin'), (req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const teacherId = req.user!.userId;
    const todayMakassar = getLocalDateMakassar();

    // In admin mode, can see all students; In teacher mode, see assigned or group students
    let studentIds: string[] = [];
    if (req.user!.role === 'admin') {
      studentIds = db.profiles.filter(p => p.role === 'murid' && p.status === 'aktif').map(p => p.id);
    } else {
      studentIds = db.teacher_student_assignments
        .filter(a => a.teacherId === teacherId)
        .map(a => a.studentId);

      // Also students in teacher's group
      const teacherGroups = db.groups.filter(g => g.teacherId === teacherId).map(g => g.id);
      const groupStudents = db.profiles
        .filter(p => p.role === 'murid' && p.groupId && teacherGroups.includes(p.groupId))
        .map(p => p.id);

      studentIds = Array.from(new Set([...studentIds, ...groupStudents]));
    }

    const students = db.profiles
      .filter(p => studentIds.includes(p.id) && p.status === 'aktif')
      .map(student => {
        const xp = calculateNetXp(student.id, db);
        const rank = getRankByXp(xp);
        const activeTargets = db.memorization_targets.filter(t => t.userId === student.id && t.status === 'aktif').length;
        const completedTargets = db.memorization_targets.filter(t => t.userId === student.id && t.status === 'selesai').length;
        const totalMurajaahSessions = db.murajaah_sessions.filter(m => m.userId === student.id && m.status === 'selesai').length;
        const todayAttendance = db.attendance.find(a => a.userId === student.id && a.localDate === todayMakassar);
        const todayLearning = db.daily_learning_activity.find(d => d.userId === student.id && d.localDate === todayMakassar);

        return {
          id: student.id,
          username: student.username,
          fullName: student.fullName,
          avatarUrl: student.avatarUrl,
          groupId: student.groupId,
          xp,
          rank,
          activeTargets,
          completedTargets,
          totalMurajaahSessions,
          todayAttendanceStatus: todayAttendance?.status || 'belum_absen',
          todayActiveLearning: !!todayLearning?.activeLearning
        };
      });

    return res.json({ students });
  });

  // Get student detail for teacher
  app.get('/api/teacher/students/:id', authenticateToken, requireRole('guru', 'admin'), (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.params.id;
    const db = getDb();
    const student = db.profiles.find(p => p.id === studentId);

    if (!student) {
      return res.status(404).json({ error: 'Murid tidak ditemukan.' });
    }

    const xp = calculateNetXp(student.id, db);
    const rank = getRankByXp(xp);
    const targets = db.memorization_targets.filter(t => t.userId === student.id && t.status !== 'diarsipkan');
    const murajaahSessions = db.murajaah_sessions.filter(m => m.userId === student.id);
    const xpHistory = db.xp_transactions.filter(t => t.userId === student.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const attendanceHistory = db.attendance.filter(a => a.userId === student.id).sort((a, b) => b.localDate.localeCompare(a.localDate));
    const notes = db.teacher_notes.filter(n => n.studentId === student.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return res.json({
      student: {
        id: student.id,
        username: student.username,
        fullName: student.fullName,
        avatarUrl: student.avatarUrl,
        groupId: student.groupId,
        status: student.status,
        createdAt: student.createdAt,
        xp,
        rank
      },
      targets,
      murajaahSessions,
      xpHistory,
      attendanceHistory,
      notes
    });
  });

  // Guru or Admin enrolls a new student
  app.post('/api/teacher/students', authenticateToken, requireRole('guru', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, password, fullName, avatarUrl } = req.body;
      if (!username || !password || !fullName) {
        return res.status(400).json({ error: 'Username, kata sandi, dan nama lengkap santri wajib diisi.' });
      }
      if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username minimal 3 karakter dan hanya boleh berisi huruf, angka, dan underscore.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      }

      const db = getDb();
      const cleanUsername = username.trim().toLowerCase();
      if (db.profiles.some(p => p.username.toLowerCase() === cleanUsername)) {
        return res.status(409).json({ error: 'Username santri ini sudah digunakan. Silakan gunakan username lain.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const newUserId = `usr-${Date.now()}`;

      // Find teacher's group
      let groupId = '';
      if (req.user!.role === 'guru') {
        const myGroup = db.groups.find(g => g.teacherId === req.user!.userId);
        groupId = myGroup ? myGroup.id : (db.groups[0]?.id || '');
      } else {
        groupId = db.groups[0]?.id || '';
      }

      const newProfile: UserProfile = {
        id: newUserId,
        username: cleanUsername,
        fullName: fullName.trim(),
        role: 'murid',
        passwordHash,
        avatarUrl: avatarUrl || '',
        status: 'aktif',
        groupId: groupId || undefined,
        createdAt: new Date().toISOString()
      };
      db.profiles.push(newProfile);

      // Assign to teacher
      const teacherId = req.user!.role === 'guru' ? req.user!.userId : (db.profiles.find(p => p.role === 'guru')?.id || req.user!.userId);
      db.teacher_student_assignments.push({
        id: `asg-${Date.now()}`,
        teacherId,
        studentId: newUserId,
        assignedAt: new Date().toISOString()
      });

      db.notifications.push({
        id: `notif-${Date.now()}`,
        userId: newUserId,
        title: 'Selamat Datang di HIFZUP!',
        message: `Akun santri telah didaftarkan oleh ${req.user!.username}. Ahlan wa sahlan! Mulai hafalan pertamamu dan raih rank tertinggi.`,
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      db.audit_logs.push({
        id: `aud-${Date.now()}`,
        actorId: req.user!.userId,
        actorName: req.user!.username,
        action: 'ENROLL_STUDENT',
        targetType: 'STUDENT_ACCOUNT',
        targetId: newUserId,
        details: `Mendaftarkan santri baru: ${newProfile.fullName} (@${newProfile.username})`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);
      return res.status(201).json({
        message: `Santri ${newProfile.fullName} berhasil didaftarkan.`,
        student: {
          id: newProfile.id,
          username: newProfile.username,
          fullName: newProfile.fullName,
          role: newProfile.role,
          avatarUrl: newProfile.avatarUrl,
          groupId: newProfile.groupId,
          xp: 0,
          rank: getRankByXp(0)
        }
      });
    } catch (err: any) {
      console.error('Enroll student error:', err);
      return res.status(500).json({ error: 'Gagal mendaftarkan santri baru.' });
    }
  });

  // Guru or Admin deletes a student account with full cascade
  app.delete('/api/teacher/students/:id', authenticateToken, requireRole('guru', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const studentId = req.params.id;
      const db = getDb();
      const student = db.profiles.find(p => p.id === studentId);

      if (!student) {
        return res.status(404).json({ error: 'Akun santri tidak ditemukan.' });
      }

      if (student.role !== 'murid') {
        return res.status(403).json({ error: 'Hanya akun santri/murid yang dapat dihapus melalui fitur ini.' });
      }

      // If teacher, verify authorization to delete this student
      if (req.user!.role === 'guru') {
        const teacherGroups = db.groups.filter(g => g.teacherId === req.user!.userId).map(g => g.id);
        const isAssigned = db.teacher_student_assignments.some(a => a.teacherId === req.user!.userId && a.studentId === studentId);
        const isInGroup = student.groupId && teacherGroups.includes(student.groupId);

        if (!isAssigned && !isInGroup) {
          return res.status(403).json({ error: 'Anda hanya memiliki wewenang untuk menghapus santri bimbingan Anda sendiri.' });
        }
      }

      // Cascade remove all records associated with student
      db.profiles = db.profiles.filter(p => p.id !== studentId);
      db.teacher_student_assignments = db.teacher_student_assignments.filter(a => a.studentId !== studentId);
      db.memorization_targets = db.memorization_targets.filter(t => t.userId !== studentId);
      db.murajaah_sessions = db.murajaah_sessions.filter(m => m.userId !== studentId);
      db.xp_transactions = db.xp_transactions.filter(t => t.userId !== studentId);
      db.attendance = db.attendance.filter(a => a.userId !== studentId);
      db.daily_learning_activity = db.daily_learning_activity.filter(d => d.userId !== studentId);
      db.teacher_notes = db.teacher_notes.filter(n => n.studentId !== studentId);
      db.notifications = db.notifications.filter(n => n.userId !== studentId);
      db.inactivity_exemptions = db.inactivity_exemptions.filter(e => e.userId !== studentId);
      db.user_achievements = db.user_achievements.filter(a => a.userId !== studentId);

      db.audit_logs.push({
        id: `aud-del-std-${Date.now()}`,
        actorId: req.user!.userId,
        actorName: req.user!.username,
        action: 'DELETE_STUDENT_ACCOUNT',
        targetType: 'STUDENT_ACCOUNT',
        targetId: studentId,
        details: `Menghapus akun murid: ${student.fullName} (@${student.username}) beserta seluruh riwayat hafalan dan XP.`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);
      return res.json({ message: `Akun santri ${student.fullName} (@${student.username}) berhasil dihapus permanen.` });
    } catch (err: any) {
      console.error('Delete student error:', err);
      return res.status(500).json({ error: 'Gagal menghapus akun santri.' });
    }
  });

  // Teacher Bonus XP per Bagian 14
  app.post('/api/teacher/bonus-xp', authenticateToken, requireRole('guru', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { studentId, amount, reason, note, idempotencyKey } = req.body;
      const numAmount = parseInt(amount, 10);

      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Jumlah bonus harus berupa bilangan bulat positif.' });
      }

      if (numAmount > 500) {
        return res.status(400).json({ error: 'Jumlah bonus melebihi batas maksimum 500 XP per transaksi.' });
      }

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ error: 'Alasan pemberian bonus wajib diisi minimal 5 karakter.' });
      }

      const db = getDb();
      const student = db.profiles.find(p => p.id === studentId && p.role === 'murid' && p.status === 'aktif');
      if (!student) {
        return res.status(404).json({ error: 'Murid tidak ditemukan atau tidak aktif.' });
      }

      const teacher = db.profiles.find(p => p.id === req.user!.userId)!;

      if (idempotencyKey) {
        const existingTx = db.xp_transactions.find(tx => tx.idempotencyKey === idempotencyKey);
        if (existingTx) {
          return res.json({ message: 'Bonus sudah pernah diberikan (idempoten).' });
        }
      }

      const prevXp = calculateNetXp(student.id, db);
      const prevRank = getRankByXp(prevXp);

      const txId = `tx-bonus-${Date.now()}`;
      const newTx: XpTransaction = {
        id: txId,
        userId: student.id,
        transactionType: 'bonus_guru',
        amount: numAmount,
        reason: reason.trim(),
        sourceActivity: 'teacher_bonus',
        grantedBy: teacher.id,
        createdAt: new Date().toISOString(),
        idempotencyKey
      };
      db.xp_transactions.push(newTx);

      // Create notification for student
      db.notifications.push({
        id: `notif-bonus-${Date.now()}`,
        userId: student.id,
        title: `Bonus +${numAmount} XP dari ${teacher.fullName}!`,
        message: `Catatan Guru: "${reason.trim()}"`,
        type: 'bonus',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // If additional motivation note was attached
      if (note && note.trim()) {
        db.teacher_notes.push({
          id: `note-${Date.now()}`,
          teacherId: teacher.id,
          teacherName: teacher.fullName,
          studentId: student.id,
          message: note.trim(),
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }

      // Audit log
      db.audit_logs.push({
        id: `aud-bonus-${Date.now()}`,
        actorId: teacher.id,
        actorName: teacher.fullName,
        action: 'GRANT_BONUS_XP',
        targetType: 'STUDENT_XP',
        targetId: student.id,
        details: `Memberi bonus +${numAmount} XP kepada ${student.fullName}. Alasan: ${reason.trim()}`,
        createdAt: new Date().toISOString()
      });

      // Check rank up
      const newXp = calculateNetXp(student.id, db);
      const newRank = getRankByXp(newXp);

      if (newRank.order > prevRank.order) {
        db.notifications.push({
          id: `notif-rank-${Date.now()}`,
          userId: student.id,
          title: 'Selamat Naik Rank! 🏆',
          message: `Mubarak! Kamu telah mencapai Rank ${newRank.name} (${newXp} XP)!`,
          type: 'rank_up',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      await saveDb(db);

      return res.json({
        message: `Bonus +${numAmount} XP berhasil diberikan kepada ${student.fullName}.`,
        studentId: student.id,
        newXp,
        newRank
      });
    } catch (err: any) {
      console.error('Teacher bonus error:', err);
      return res.status(500).json({ error: 'Gagal memberikan bonus XP.' });
    }
  });

  // Teacher Note per Bagian 14
  app.post('/api/teacher/notes', authenticateToken, requireRole('guru', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { studentId, message } = req.body;
      if (!message || message.trim().length < 5) {
        return res.status(400).json({ error: 'Isi catatan motivasi minimal 5 karakter.' });
      }

      const db = getDb();
      const student = db.profiles.find(p => p.id === studentId);
      if (!student) {
        return res.status(404).json({ error: 'Murid tidak ditemukan.' });
      }

      const teacher = db.profiles.find(p => p.id === req.user!.userId)!;

      const newNote: TeacherNote = {
        id: `note-${Date.now()}`,
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        studentId: student.id,
        message: message.trim(),
        createdAt: new Date().toISOString(),
        isRead: false
      };
      db.teacher_notes.push(newNote);

      // Notification
      db.notifications.push({
        id: `notif-note-${Date.now()}`,
        userId: student.id,
        title: `Catatan Baru dari ${teacher.fullName}`,
        message: message.trim(),
        type: 'note',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);
      return res.status(201).json({ message: 'Catatan motivasi berhasil dikirim.', note: newNote });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal mengirim catatan motivasi.' });
    }
  });

  // ==================== ADMIN DASHBOARD ====================
  // Summary Stats per Bagian 15
  app.get('/api/admin/summary', authenticateToken, requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const todayMakassar = getLocalDateMakassar();

    const totalMurid = db.profiles.filter(p => p.role === 'murid' && p.status === 'aktif').length;
    const totalGuru = db.profiles.filter(p => p.role === 'guru' && p.status === 'aktif').length;
    const totalGroups = db.groups.length;
    const activeTargets = db.memorization_targets.filter(t => t.status === 'aktif').length;
    const completedTargets = db.memorization_targets.filter(t => t.status === 'selesai').length;
    const totalMurajaahSessions = db.murajaah_sessions.filter(m => m.status === 'selesai').length;

    const activeTodayStudents = db.daily_learning_activity.filter(d => d.localDate === todayMakassar && d.activeLearning).length;

    // Rank distribution
    const rankDistribution: Record<string, number> = {};
    RANKS_DATA.forEach(r => (rankDistribution[r.name] = 0));

    db.profiles.filter(p => p.role === 'murid' && p.status === 'aktif').forEach(student => {
      const xp = calculateNetXp(student.id, db);
      const r = getRankByXp(xp);
      rankDistribution[r.name] = (rankDistribution[r.name] || 0) + 1;
    });

    return res.json({
      summary: {
        totalMurid,
        totalGuru,
        totalGroups,
        activeTargets,
        completedTargets,
        totalMurajaahSessions,
        activeTodayStudents,
        rankDistribution
      }
    });
  });

  // Admin User Management
  app.get('/api/admin/users', authenticateToken, requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const users = db.profiles.map(p => {
      const xp = calculateNetXp(p.id, db);
      return {
        id: p.id,
        username: p.username,
        fullName: p.fullName,
        role: p.role,
        avatarUrl: p.avatarUrl,
        status: p.status,
        groupId: p.groupId,
        phoneNumber: p.phoneNumber,
        institution: p.institution,
        sanadInfo: p.sanadInfo,
        approvalStatus: p.approvalStatus,
        createdAt: p.createdAt,
        xp: p.role === 'murid' ? xp : undefined,
        rank: p.role === 'murid' ? getRankByXp(xp) : undefined
      };
    });
    return res.json({ users });
  });

  // Admin Create User (Teacher or Student)
  app.post('/api/admin/users', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, password, fullName, role, groupId } = req.body;
      if (!username || !password || !fullName || !role) {
        return res.status(400).json({ error: 'Semua kolom wajib diisi.' });
      }

      if (!['murid', 'guru', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Peran tidak valid.' });
      }

      const db = getDb();
      const cleanUsername = username.trim().toLowerCase();

      if (db.profiles.some(p => p.username.toLowerCase() === cleanUsername)) {
        return res.status(409).json({ error: 'Username sudah digunakan.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const newUserId = `usr-${Date.now()}`;

      const newProfile: UserProfile = {
        id: newUserId,
        username: cleanUsername,
        fullName: fullName.trim(),
        role,
        passwordHash,
        avatarUrl: '',
        status: 'aktif',
        groupId: groupId || undefined,
        createdAt: new Date().toISOString()
      };
      db.profiles.push(newProfile);

      db.audit_logs.push({
        id: `aud-adm-user-${Date.now()}`,
        actorId: req.user!.userId,
        actorName: req.user!.username,
        action: 'ADMIN_CREATE_USER',
        targetType: 'USER',
        targetId: newUserId,
        details: `Admin membuat akun ${role.toUpperCase()}: ${newProfile.fullName} (@${newProfile.username})`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);
      return res.status(201).json({ message: 'Pengguna berhasil dibuat.', user: newProfile });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal membuat pengguna baru.' });
    }
  });

  // Admin XP Correction with Audit per Bagian 15
  app.post('/api/admin/correct-xp', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, delta, reason } = req.body;
      const numDelta = parseInt(delta, 10);

      if (isNaN(numDelta) || numDelta === 0) {
        return res.status(400).json({ error: 'Jumlah koreksi XP tidak boleh 0.' });
      }

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ error: 'Alasan koreksi administratif wajib dicatat dengan jelas.' });
      }

      const db = getDb();
      const student = db.profiles.find(p => p.id === userId && p.role === 'murid');
      if (!student) {
        return res.status(404).json({ error: 'Murid tidak ditemukan.' });
      }

      const prevXp = calculateNetXp(student.id, db);
      const safeDelta = (prevXp + numDelta < 0) ? -prevXp : numDelta;

      const tx: XpTransaction = {
        id: `tx-adm-corr-${Date.now()}`,
        userId: student.id,
        transactionType: 'koreksi_admin',
        amount: safeDelta,
        reason: `[Koreksi Admin] ${reason.trim()}`,
        sourceActivity: 'admin_correction',
        grantedBy: req.user!.userId,
        createdAt: new Date().toISOString()
      };
      db.xp_transactions.push(tx);

      const newXp = calculateNetXp(student.id, db);

      db.audit_logs.push({
        id: `aud-corr-${Date.now()}`,
        actorId: req.user!.userId,
        actorName: req.user!.username,
        action: 'CORRECT_XP',
        targetType: 'STUDENT_XP',
        targetId: student.id,
        details: `Koreksi XP murid ${student.fullName}: ${prevXp} -> ${newXp} (Delta: ${safeDelta}). Alasan: ${reason.trim()}`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);

      return res.json({
        message: 'Koreksi XP berhasil dicatat ke dalam audit ledger.',
        prevXp,
        newXp,
        delta: safeDelta,
        rank: getRankByXp(newXp)
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal melakukan koreksi XP.' });
    }
  });

  // Admin Inactivity Penalty Runner
  app.post('/api/admin/run-inactivity-check', authenticateToken, requireRole('admin'), async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const db = getDb();
      const result = evaluateInactivityPenalties(db);
      await saveDb(db);
      return res.json({
        message: `Evaluasi ketidakaktifan (Zona Asia/Makassar) selesai. Diterapkan ${result.penaltiesApplied} sanksi.`,
        ...result
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal menjalankan evaluasi ketidakaktifan.' });
    }
  });

  // Admin Audit Logs
  app.get('/api/admin/audit-logs', authenticateToken, requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const logs = [...db.audit_logs].reverse().slice(0, 100);
    return res.json({ logs });
  });

  // Admin Groups
  app.get('/api/admin/groups', authenticateToken, requireRole('admin', 'guru'), (_req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    return res.json({ groups: db.groups });
  });

  // Admin Pending Teachers Verification Queue
  app.get('/api/admin/pending-teachers', authenticateToken, requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
    const db = getDb();
    const pendingTeachers = db.profiles
      .filter(p => p.role === 'guru' && p.status === 'menunggu_verifikasi')
      .map(p => ({
        id: p.id,
        username: p.username,
        fullName: p.fullName,
        phoneNumber: p.phoneNumber || '-',
        institution: p.institution || 'Belum diisi',
        sanadInfo: p.sanadInfo || 'Belum diisi',
        avatarUrl: p.avatarUrl,
        status: p.status,
        createdAt: p.createdAt
      }));
    return res.json({ pendingTeachers });
  });

  // Admin Approve Teacher
  app.post('/api/admin/approve-teacher', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { teacherId } = req.body;
      if (!teacherId) {
        return res.status(400).json({ error: 'ID Guru wajib disertakan.' });
      }

      const db = getDb();
      const teacher = db.profiles.find(p => p.id === teacherId && p.role === 'guru');

      if (!teacher) {
        return res.status(404).json({ error: 'Akun guru pembina tidak ditemukan.' });
      }

      if (teacher.status === 'aktif') {
        return res.status(400).json({ error: 'Akun guru ini sudah aktif sebelumnya.' });
      }

      teacher.status = 'aktif';
      teacher.approvalStatus = 'approved';
      teacher.approvedBy = req.user!.userId;
      teacher.approvedAt = new Date().toISOString();

      // Create teacher's halaqah group if not exists
      if (!teacher.groupId) {
        const newGroupId = `grp-${Date.now()}`;
        teacher.groupId = newGroupId;
        db.groups.push({
          id: newGroupId,
          name: `Halaqah ${teacher.fullName}`,
          description: `Kelompok hafalan Al-Qur'an bimbingan ${teacher.fullName} (${teacher.institution || 'Pesantren'})`,
          teacherId: teacher.id,
          createdAt: new Date().toISOString()
        });
      }

      // Welcome notification to teacher
      db.notifications.push({
        id: `notif-appr-${Date.now()}`,
        userId: teacher.id,
        title: 'Akun Guru Pembina Disetujui! 🌟',
        message: 'Alhamdulillah, akun Anda telah diverifikasi dan disetujui oleh Administrator Lembaga. Anda dapat mengelola halaqah dan membimbing santri.',
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // Audit log
      db.audit_logs.push({
        id: `aud-appr-${Date.now()}`,
        actorId: req.user!.userId,
        actorName: req.user!.username,
        action: 'ADMIN_APPROVE_TEACHER',
        targetType: 'USER',
        targetId: teacher.id,
        details: `Administrator menyetujui akun Guru Pembina: ${teacher.fullName} (@${teacher.username}) dari ${teacher.institution || 'Pesantren'}. Halaqah otomatis dibentuk.`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);

      return res.json({
        message: `Akun ${teacher.fullName} berhasil disetujui dan diaktifkan.`,
        teacher: {
          id: teacher.id,
          username: teacher.username,
          fullName: teacher.fullName,
          status: teacher.status,
          groupId: teacher.groupId
        }
      });
    } catch (err: any) {
      console.error('Approve teacher error:', err);
      return res.status(500).json({ error: 'Gagal menyetujui akun guru.' });
    }
  });

  // Admin Reject Teacher
  app.post('/api/admin/reject-teacher', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { teacherId, reason } = req.body;
      if (!teacherId) {
        return res.status(400).json({ error: 'ID Guru wajib disertakan.' });
      }

      const db = getDb();
      const teacher = db.profiles.find(p => p.id === teacherId && p.role === 'guru');

      if (!teacher) {
        return res.status(404).json({ error: 'Akun guru pembina tidak ditemukan.' });
      }

      const rejectionReason = reason && reason.trim() ? reason.trim() : 'Persyaratan atau kualifikasi hafalan belum memenuhi kriteria lembaga.';
      teacher.status = 'ditolak';
      teacher.approvalStatus = 'rejected';
      teacher.rejectionReason = rejectionReason;
      teacher.approvedBy = req.user!.userId;

      // Audit log
      db.audit_logs.push({
        id: `aud-rej-${Date.now()}`,
        actorId: req.user!.userId,
        actorName: req.user!.username,
        action: 'ADMIN_REJECT_TEACHER',
        targetType: 'USER',
        targetId: teacher.id,
        details: `Administrator menolak akun Guru Pembina: ${teacher.fullName} (@${teacher.username}). Alasan: ${rejectionReason}`,
        createdAt: new Date().toISOString()
      });

      await saveDb(db);

      return res.json({
        message: `Pengajuan akun ${teacher.fullName} telah ditolak.`,
        teacherId: teacher.id
      });
    } catch (err: any) {
      console.error('Reject teacher error:', err);
      return res.status(500).json({ error: 'Gagal menolak akun guru.' });
    }
  });

  // Admin Verification Key Retrieval
  app.get('/api/admin/verification-key', authenticateToken, requireRole('admin'), (_req: AuthenticatedRequest, res: Response) => {
    return res.json({
      approvalKey: MASTER_TEACHER_APPROVAL_CODE,
      description: 'Kode ini dapat dibagikan kepada dewan guru/ustadz bersertifikat untuk aktivasi instan tanpa menunggu tinjauan manual.'
    });
  });

  // ==================== VITE MIDDLEWARE SETUP ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HIFZUP server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start HIFZUP server:', err);
  process.exit(1);
});
