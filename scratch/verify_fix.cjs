const { differenceInCalendarWeeks, startOfDay, format } = require('date-fns');

const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const isRecurringActive = (schedule, date) => {
  if (!schedule.active) return false;
  
  // Normaliza para o início do dia
  const targetDate = startOfDay(typeof date === 'string' ? parseLocalDate(date) : date);
  
  if (!schedule.frequency || schedule.frequency === 'weekly') {
    return true;
  }

  if (schedule.frequency === 'biweekly') {
    if (!schedule.startDate) {
      return false; 
    }

    const start = startOfDay(parseLocalDate(schedule.startDate));
    const weeksDiff = Math.abs(differenceInCalendarWeeks(targetDate, start, { weekStartsOn: 0 }));
    
    return weeksDiff % 2 === 0;
  }

  return true;
};

// Test Case 1: Standard biweekly (Active this week, Inactive next week)
const schedule1 = { active: true, frequency: 'biweekly', startDate: '2026-04-20' }; // Last week Monday
const targetToday = '2026-04-29'; // This week Wednesday
const targetNextWeek = '2026-05-06'; // Next week Wednesday

console.log("Test Case 1:");
console.log(`Today (${targetToday}): ${isRecurringActive(schedule1, targetToday)} (Expected: false)`);
console.log(`Next Week (${targetNextWeek}): ${isRecurringActive(schedule1, targetNextWeek)} (Expected: true)`);

// Wait, if startDate was April 20 (Week 0). 
// April 29 is Week 1 (1 % 2 === 1) -> False.
// May 6 is Week 2 (2 % 2 === 0) -> True.
// Correct.

// Test Case 2: Missing startDate
const schedule2 = { active: true, frequency: 'biweekly', startDate: undefined };
console.log("\nTest Case 2 (Missing startDate):");
console.log(`Today: ${isRecurringActive(schedule2, targetToday)} (Expected: false)`);

// Test Case 3: Weekly
const schedule3 = { active: true, frequency: 'weekly' };
console.log("\nTest Case 3 (Weekly):");
console.log(`Today: ${isRecurringActive(schedule3, targetToday)} (Expected: true)`);
