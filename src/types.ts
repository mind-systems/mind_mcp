export type TimeOfDay = "morning" | "midday" | "evening";

export interface BreathStep {
  type: "inhale" | "exhale" | "hold";
  duration: number; // milliseconds
}

export interface BreathExercise {
  steps: BreathStep[];
  restDuration: number;
  repeatCount: number;
}

export interface BreathSession {
  id: string;
  userId: string;
  description: string;
  exercises: BreathExercise[];
  complexity: number;
  shared: boolean;
  timeOfDay: TimeOfDay | null;
  createdAt: string;
  updatedAt: string;
}

export interface BreathSessionListResponse {
  data: BreathSession[];
  total: number;
  page: number;
  pageSize: number;
}
