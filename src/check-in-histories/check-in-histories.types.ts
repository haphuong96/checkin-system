export type CheckInHistoryItem = {
  id: number;
  date: string;
  score: number;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
