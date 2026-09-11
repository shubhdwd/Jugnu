import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export async function getMyProfile(userId: string) {
  const hw = await prisma.healthWorker.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });
  if (!hw) throw new NotFoundError('Health worker profile not found');
  return hw;
}

export async function getPatients(userId: string, page = 1, limit = 20) {
  const hw = await prisma.healthWorker.findUnique({ where: { userId } });
  if (!hw) throw new NotFoundError('Health worker profile not found');

  const skip = (page - 1) * limit;
  const where = { village: hw.area };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where, skip, take: limit,
      include: {
        caregiver: { select: { id: true, name: true, phone: true } },
        _count: { select: { sessions: true, alerts: true } },
        alerts: { where: { status: 'ACTIVE' }, select: { id: true, type: true, severity: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.patient.count({ where }),
  ]);
  return { patients, total, page, limit };
}

export async function getPriorityList(userId: string) {
  const hw = await prisma.healthWorker.findUnique({ where: { userId } });
  if (!hw) throw new NotFoundError('Health worker profile not found');

  const patients = await prisma.patient.findMany({
    where: { village: hw.area },
    include: {
      alerts: { where: { status: 'ACTIVE' }, orderBy: { severity: 'desc' } },
      sessions: { orderBy: { startedAt: 'desc' }, take: 1, include: { attempts: true } },
      insights: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const scored = patients.map(p => {
    let urgency = 0;
    for (const alert of p.alerts) {
      if (alert.severity === 'CRITICAL') urgency += 4;
      else if (alert.severity === 'HIGH') urgency += 3;
      else if (alert.severity === 'MEDIUM') urgency += 2;
      else urgency += 1;
    }
    if (p.insights[0]?.trend === 'DECLINING') urgency += 3;
    const lastSession = p.sessions[0];
    if (!lastSession) urgency += 2;
    else {
      const daysSince = Math.floor((Date.now() - new Date(lastSession.startedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 7) urgency += 2;
      else if (daysSince > 3) urgency += 1;
    }
    if (lastSession?.attempts?.length) {
      const acc = lastSession.attempts.filter(a => a.correct).length / lastSession.attempts.length;
      if (acc < 0.5) urgency += 2;
      else if (acc < 0.7) urgency += 1;
    }

    return { ...p, urgencyScore: urgency };
  });

  return scored.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

export async function getVisitPlan(userId: string) {
  const hw = await prisma.healthWorker.findUnique({ where: { userId } });
  if (!hw) throw new NotFoundError('Health worker profile not found');

  const patients = await getPriorityList(userId);

  const byVillage: Record<string, typeof patients> = {};
  for (const p of patients) {
    const village = p.village || 'Unknown';
    if (!byVillage[village]) byVillage[village] = [];
    byVillage[village].push(p);
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const plan: Array<{ day: string; villages: Array<{ village: string; patients: typeof patients; estimatedTime: string }> }> = [];

  const villages = Object.keys(byVillage);
  let villageIdx = 0;

  for (const day of days) {
    const dayPlan = { day, villages: [] as Array<{ village: string; patients: typeof patients; estimatedTime: string }> };
    
    for (let i = 0; i < 2 && villageIdx < villages.length; i++, villageIdx++) {
      const v = villages[villageIdx];
      const villagePatients = byVillage[v];
      dayPlan.villages.push({
        village: v,
        patients: villagePatients,
        estimatedTime: `${villagePatients.length * 15} min`,
      });
    }
    plan.push(dayPlan);
  }

  return { careMode: 'distributed', area: hw.area, plan };
}
