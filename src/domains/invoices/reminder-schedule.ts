export interface ReminderStep {
  triggerDays: number; // negative = before due date, positive = days overdue
  label: string;
}

// Applied to all users unless they override via reminderSchedule on User
export const DEFAULT_REMINDER_SCHEDULE: ReminderStep[] = [
  { triggerDays: -7, label: 'J-7 avant échéance' },
  { triggerDays: 0,  label: "Jour d'échéance" },
  { triggerDays: 3,  label: 'J+3' },
  { triggerDays: 7,  label: 'J+7' },
  { triggerDays: 14, label: 'J+14' },
  { triggerDays: 30, label: 'Mise en demeure (J+30)' },
];

/**
 * Returns the Date on which the next reminder should fire.
 * reminderCount is the number of reminders already sent (0-based index into schedule).
 * Returns null when the ladder is exhausted.
 */
export function computeNextReminderDate(
  dueDate: Date,
  reminderCount: number,
  schedule: ReminderStep[] = DEFAULT_REMINDER_SCHEDULE
): Date | null {
  const step = schedule[reminderCount];
  if (!step) return null;
  const d = new Date(dueDate);
  d.setDate(d.getDate() + step.triggerDays);
  // Normalize to start of day UTC to avoid time-of-day drift across cron runs
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns true when reminderCount has reached the last step of the schedule
 * (i.e. the upcoming reminder is the Mise en Demeure).
 */
export function isLastReminder(
  reminderCount: number,
  schedule: ReminderStep[] = DEFAULT_REMINDER_SCHEDULE
): boolean {
  return reminderCount === schedule.length - 1;
}

/** Safe parse of a user's custom reminderSchedule JSON — falls back to default. */
export function parseReminderSchedule(raw: unknown): ReminderStep[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_REMINDER_SCHEDULE;
  const parsed = (raw as any[]).filter(
    (s) => typeof s.triggerDays === 'number' && typeof s.label === 'string'
  );
  return parsed.length > 0 ? parsed : DEFAULT_REMINDER_SCHEDULE;
}
