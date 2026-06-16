export type TimeOfDay = "morning" | "midday" | "evening";

export interface BreathStep {
  type: "inhale" | "exhale" | "hold";
  duration: number; // seconds
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
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SessionSection = 'STARRED' | 'MINE' | 'SHARED';

export interface SessionListItem {
  session: BreathSession;
  section: SessionSection;
}

export interface BreathSessionListResponse {
  items: SessionListItem[];
  nextCursor: string | undefined;
}

export interface CreateBreathSessionPayload {
  description: string;
  exercises: BreathExercise[];
  shared?: boolean;
  timeOfDay?: TimeOfDay;
}
