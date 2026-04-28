import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { DEFAULT_REMINDER_SCHEDULE, parseReminderSchedule } from '@/domains/invoices/reminder-schedule';
import { Prisma } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { reminderEnabled: true, reminderSchedule: true },
  });

  return NextResponse.json({
    enabled: user?.reminderEnabled ?? true,
    schedule: parseReminderSchedule(user?.reminderSchedule),
    isCustom: Array.isArray(user?.reminderSchedule) && (user.reminderSchedule as unknown[]).length > 0,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const data: Prisma.UserUpdateInput = {};

  if (typeof body.enabled === 'boolean') {
    data.reminderEnabled = body.enabled;
  }

  if (body.schedule === null) {
    data.reminderSchedule = Prisma.DbNull;
  } else if (Array.isArray(body.schedule)) {
    const parsed = parseReminderSchedule(body.schedule);
    data.reminderSchedule = parsed as unknown as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { reminderEnabled: true, reminderSchedule: true },
  });

  return NextResponse.json({
    enabled: updated.reminderEnabled,
    schedule: parseReminderSchedule(updated.reminderSchedule),
    isCustom: Array.isArray(updated.reminderSchedule) && (updated.reminderSchedule as unknown[]).length > 0,
    defaultSchedule: DEFAULT_REMINDER_SCHEDULE,
  });
}
