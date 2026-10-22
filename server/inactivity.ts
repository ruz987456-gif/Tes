import { AppDatabase, calculateNetXp, getLocalDateMakassar, XpTransaction, NotificationItem, AuditLogItem } from './db';

// Cumulative penalties by day of inactivity
// Day 1: 0, Day 2: 0, Day 3: 25, Day 4: 60, Day 5: 100, Day 6: 145, Day 7: 200
const CUMULATIVE_SCHEDULE: Record<number, number> = {
  1: 0,
  2: 0,
  3: 25,
  4: 60,
  5: 100,
  6: 145,
  7: 200
};

export function evaluateInactivityPenalties(db: AppDatabase): {
  penaltiesApplied: number;
  evaluatedStudents: number;
  logs: string[];
} {
  const todayMakassar = getLocalDateMakassar();
  const students = db.profiles.filter(p => p.role === 'murid' && p.status === 'aktif');
  let penaltiesApplied = 0;
  const logs: string[] = [];

  for (const student of students) {
    // Check if exempted
    const isExempted = db.inactivity_exemptions.some(ex => {
      return ex.userId === student.id && ex.startDate <= todayMakassar && ex.endDate >= todayMakassar;
    });

    if (isExempted) {
      logs.push(`Murid ${student.fullName} dikecualikan dari evaluasi ketidakaktifan.`);
      continue;
    }

    // Find the last completed date with valid active learning
    // Note: completed days only, exclude todayMakassar (as ongoing day is not completed yet per Bagian 13)
    const learningDays = db.daily_learning_activity
      .filter(dla => dla.userId === student.id && dla.activeLearning && dla.localDate < todayMakassar)
      .map(dla => dla.localDate)
      .sort();

    // If no prior learning records, consider account creation date
    let lastActiveDateStr = learningDays.length > 0 ? learningDays[learningDays.length - 1] : student.createdAt.split('T')[0];
    if (lastActiveDateStr >= todayMakassar) {
      // Learnt today or in the future
      continue;
    }

    // Calculate number of elapsed completed days between lastActiveDate and yesterday
    const lastActiveTime = new Date(`${lastActiveDateStr}T00:00:00+08:00`).getTime();
    const todayTime = new Date(`${todayMakassar}T00:00:00+08:00`).getTime();
    const diffDays = Math.floor((todayTime - lastActiveTime) / 86400000) - 1;

    if (diffDays < 3) {
      // Days 1 and 2: no penalty
      continue;
    }

    const cappedDays = Math.min(7, diffDays);
    const targetCumulativePenalty = CUMULATIVE_SCHEDULE[cappedDays] || 200;

    // Check how much penalty has ALREADY been applied for this current streak of inactivity
    // Find inactivity transactions since lastActiveDate
    const existingPenaltyTxs = db.xp_transactions.filter(tx =>
      tx.userId === student.id &&
      tx.transactionType === 'sanksi_inaktif' &&
      tx.createdAt > new Date(lastActiveTime).toISOString()
    );

    const alreadyDeducted = existingPenaltyTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const neededDeduction = targetCumulativePenalty - alreadyDeducted;

    if (neededDeduction > 0) {
      const currentNetXp = calculateNetXp(student.id, db);
      const actualDeduction = Math.min(currentNetXp, neededDeduction);

      if (actualDeduction > 0) {
        const txId = `tx-sanksi-${student.id}-${todayMakassar}-d${cappedDays}`;
        const newTx: XpTransaction = {
          id: txId,
          userId: student.id,
          transactionType: 'sanksi_inaktif',
          amount: -actualDeduction,
          reason: `Sanksi tidak aktif belajar selama ${diffDays} hari berturut-turut (Kumulatif: ${targetCumulativePenalty} XP)`,
          sourceActivity: 'inactivity_evaluator',
          createdAt: new Date().toISOString()
        };
        db.xp_transactions.push(newTx);
        penaltiesApplied++;

        // Add notification
        const notif: NotificationItem = {
          id: `notif-sanksi-${student.id}-${Date.now()}`,
          userId: student.id,
          title: 'Pengurangan XP Ketidakaktifan',
          message: `XP berkurang sebesar -${actualDeduction} XP karena tidak ada aktivitas belajar selama ${diffDays} hari. Yuk segera murajaah!`,
          type: 'penalty',
          isRead: false,
          createdAt: new Date().toISOString()
        };
        db.notifications.push(notif);

        // Audit log
        const audit: AuditLogItem = {
          id: `aud-sanksi-${Date.now()}-${student.id}`,
          actorId: 'system-evaluator',
          actorName: 'Sistem Evaluasi Ketidakaktifan',
          action: 'APPLY_INACTIVITY_PENALTY',
          targetType: 'STUDENT_XP',
          targetId: student.id,
          details: `Murid: ${student.fullName}, hari tidak aktif: ${diffDays}, pengurangan: -${actualDeduction} XP`,
          createdAt: new Date().toISOString()
        };
        db.audit_logs.push(audit);

        logs.push(`Sanksi diterapkan untuk ${student.fullName}: -${actualDeduction} XP (${diffDays} hari tidak aktif).`);
      }
    }
  }

  return {
    penaltiesApplied,
    evaluatedStudents: students.length,
    logs
  };
}
