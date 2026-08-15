const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateCurrentStreak = (reviewedDates: string[], now = new Date()): number => {
  const dates = new Set(reviewedDates);
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!dates.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(dateKey(cursor))) {
      return 0;
    }
  }
  let streak = 0;
  while (dates.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
