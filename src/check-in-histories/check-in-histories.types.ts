export type DayStatus = {
  day: string;
  pointsAdded: number;
  checkedIn: boolean;
};

export type CheckInResult = {
  date: string;
  dayNumber: number;
  pointsEarned: number;
  totalPoints: number;
};
