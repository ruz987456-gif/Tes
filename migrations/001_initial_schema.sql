-- HIFZUP PostgreSQL / Supabase Migration
-- 001_initial_schema.sql

CREATE TYPE user_role AS ENUM ('murid', 'guru', 'admin');
CREATE TYPE account_status AS ENUM ('aktif', 'nonaktif');
CREATE TYPE target_status AS ENUM ('aktif', 'selesai', 'diarsipkan');
CREATE TYPE section_status AS ENUM ('belum', 'proses', 'selesai');
CREATE TYPE attendance_status AS ENUM ('hadir', 'izin', 'sakit', 'alpa');
CREATE TYPE transaction_type AS ENUM ('hafalan', 'murajaah', 'bonus_guru', 'sanksi_inaktif', 'koreksi_admin');

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'murid',
  avatar_url TEXT,
  status account_status NOT NULL DEFAULT 'aktif',
  group_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. groups
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. surahs
CREATE TABLE IF NOT EXISTS surahs (
  number INTEGER PRIMARY KEY CHECK (number BETWEEN 1 AND 114),
  name TEXT NOT NULL,
  name_arabic TEXT NOT NULL,
  number_of_ayahs INTEGER NOT NULL CHECK (number_of_ayahs > 0),
  revelation_type TEXT NOT NULL CHECK (revelation_type IN ('Makkiyah', 'Madaniyah'))
);

-- 4. memorization_targets
CREATE TABLE IF NOT EXISTS memorization_targets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL REFERENCES surahs(number),
  surah_name TEXT NOT NULL,
  start_ayah INTEGER NOT NULL CHECK (start_ayah >= 1),
  end_ayah INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  target_date DATE,
  notes TEXT,
  status target_status NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT valid_ayah_range CHECK (start_ayah <= end_ayah)
);

-- 5. memorization_sections (5 sections per target)
CREATE TABLE IF NOT EXISTS memorization_sections (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL REFERENCES memorization_targets(id) ON DELETE CASCADE,
  section_number INTEGER NOT NULL CHECK (section_number BETWEEN 1 AND 5),
  start_ayah INTEGER NOT NULL,
  end_ayah INTEGER NOT NULL,
  status section_status NOT NULL DEFAULT 'belum'
);

-- 6. memorization_stages (4 stages per section)
CREATE TABLE IF NOT EXISTS memorization_stages (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES memorization_sections(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 4),
  repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions BETWEEN 0 AND 5),
  max_repetitions INTEGER NOT NULL DEFAULT 5,
  xp_per_rep INTEGER NOT NULL CHECK (xp_per_rep = stage_number),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  status section_status NOT NULL DEFAULT 'belum'
);

-- 7. murajaah_sessions (0..75 repetitions = 300 XP)
CREATE TABLE IF NOT EXISTS murajaah_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  surah_number INTEGER REFERENCES surahs(number),
  surah_name TEXT,
  repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions BETWEEN 0 AND 75),
  max_repetitions INTEGER NOT NULL DEFAULT 75,
  status TEXT NOT NULL DEFAULT 'berlangsung',
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE
);

-- 8. xp_transactions (The immutable XP audit ledger)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_activity TEXT NOT NULL,
  activity_id TEXT,
  granted_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key TEXT UNIQUE
);

-- 9. attendance
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status attendance_status NOT NULL DEFAULT 'hadir',
  recorded_by TEXT NOT NULL REFERENCES profiles(id),
  notes TEXT,
  CONSTRAINT unique_user_attendance_per_day UNIQUE (user_id, local_date)
);

-- 10. daily_learning_activity
CREATE TABLE IF NOT EXISTS daily_learning_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  active_learning BOOLEAN NOT NULL DEFAULT FALSE,
  rep_count INTEGER NOT NULL DEFAULT 0,
  murajaah_reps INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  CONSTRAINT unique_user_daily_activity UNIQUE (user_id, local_date)
);

-- 11. teacher_student_assignments
CREATE TABLE IF NOT EXISTS teacher_student_assignments (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_teacher_student_assignment UNIQUE (teacher_id, student_id)
);

-- 12. teacher_notes
CREATE TABLE IF NOT EXISTS teacher_notes (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

-- 13. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  link TEXT
);

-- 14. inactivity_exemptions
CREATE TABLE IF NOT EXISTS inactivity_exemptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  approved_by TEXT NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_targets_user ON memorization_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, local_date);
CREATE INDEX IF NOT EXISTS idx_murajaah_user ON murajaah_sessions(user_id);
