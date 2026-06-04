import { differenceInCalendarWeeks, startOfDay, format } from 'date-fns';

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

const startDateStr = '2024-05-01'; // Wednesday
const startDate = startOfDay(parseLocalDate(startDateStr));

const testDates = [
  '2024-05-01', // Wed (Same week) -> weeksDiff 0
  '2024-05-05', // Sun (Next week) -> weeksDiff 1
  '2024-05-08', // Wed (Next week) -> weeksDiff 1
  '2024-05-12', // Sun (Week after) -> weeksDiff 2
  '2024-05-15', // Wed (Week after) -> weeksDiff 2
  '2024-12-25', // Wed (Christmas)
  '2025-01-01', // Wed (New Year)
  '2025-01-08', // Wed
];

console.log(`Start Date: ${startDateStr}`);
testDates.forEach(dStr => {
  const targetDate = startOfDay(parseLocalDate(dStr));
  const diff = Math.abs(differenceInCalendarWeeks(targetDate, startDate, { weekStartsOn: 0 }));
  const active = diff % 2 === 0;
  console.log(`${dStr}: diff=${diff}, active=${active}`);
});
