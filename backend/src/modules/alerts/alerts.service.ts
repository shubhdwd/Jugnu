import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { AlertStatus, AlertType, AlertSeverity, Prisma } from '@prisma/client';

export async function getByPatient(patientId: string, status?: AlertStatus) {
  const where: Prisma.AlertWhereInput = { patientId };
  if (status) where.status = status;
  return prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function update(id: string, data: { status: AlertStatus }) {
  const existing = await prisma.alert.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Alert not found');

  const updateData: Prisma.AlertUpdateInput = { status: data.status };
  if (data.status === 'RESOLVED') {
    updateData.resolvedAt = new Date();
  }

  return prisma.alert.update({ where: { id }, data: updateData });
}

export async function create(data: {
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.alert.create({
    data: {
      patientId: data.patientId,
      type: data.type,
      severity: data.severity,
      message: data.message,
      metadata: data.metadata as any,
    },
  });
}

export async function getAll(
  filters: { status?: AlertStatus; type?: AlertType; severity?: AlertSeverity },
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit;
  const where: Prisma.AlertWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.severity) where.severity = filters.severity;

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      skip,
      take: limit,
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.alert.count({ where }),
  ]);
  return { alerts, total, page, limit };
}
