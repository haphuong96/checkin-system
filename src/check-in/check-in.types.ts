export enum CheckInDay {
  DAY_1 = 'DAY-1',
  DAY_2 = 'DAY-2',
  DAY_3 = 'DAY-3',
  DAY_4 = 'DAY-4',
  DAY_5 = 'DAY-5',
  DAY_6 = 'DAY-6',
  DAY_7 = 'DAY-7',
}

// Ordered by check-in sequence; index 0 = first check-in of the month.
export const CHECK_IN_DAY_CODES: CheckInDay[] = [
  CheckInDay.DAY_1,
  CheckInDay.DAY_2,
  CheckInDay.DAY_3,
  CheckInDay.DAY_4,
  CheckInDay.DAY_5,
  CheckInDay.DAY_6,
  CheckInDay.DAY_7,
];

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
