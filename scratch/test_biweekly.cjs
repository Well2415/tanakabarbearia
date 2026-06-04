const { differenceInCalendarWeeks, startOfDay, format } = require('date-fns');

const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const isRecurringActive = (schedule, date) => {
  if (!schedule.active) return false;
  const targetDate = typeof date === 'string' ? parseLocalDate(date) : date;
  if (!schedule.frequency || schedule.frequency === 'weekly') return true;

  if (schedule.frequency === 'biweekly' && schedule.startDate) {
    const start = parseLocalDate(schedule.startDate);
    const weeksDiff = Math.abs(differenceInCalendarWeeks(targetDate, start, { weekStartsOn: 0 }));
    console.log(`Target: ${format(targetDate, 'yyyy-MM-dd')}, Start: ${schedule.startDate}, Diff: ${weeksDiff}`);
    return weeksDiff % 2 === 0;
  }
  return true;
};

const schedule = { active: true, frequency: 'biweekly', startDate: '2026-04-20' }; // Monday last week

console.log("Last week (April 20-26):");
for (let i = 20; i <= 26; i++) {
  const d = parseLocalDate(`2026-04-${i}`);
  console.log(`${format(d, 'EEEE yyyy-MM-dd')}: ${isRecurringActive(schedule, d)}`);
}

console.log("\nThis week (April 27-May 3):");
for (let i = 27; i <= 30; i++) {
  const d = parseLocalDate(`2026-04-${i}`);
  console.log(`${format(d, 'EEEE yyyy-MM-dd')}: ${isRecurringActive(schedule, d)}`);
}
for (let i = 1; i <= 3; i++) {
  const d = parseLocalDate(`2026-05-0${i}`);
  console.log(`${format(d, 'EEEE yyyy-MM-dd')}: ${isRecurringActive(schedule, d)}`);
}
