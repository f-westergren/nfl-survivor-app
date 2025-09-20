import { Timestamp } from "firebase-admin/firestore";

export interface Game {
  home: string;
  away: string;
  winner: string | null;
  startTime: Timestamp;
}

export interface Week {
  week: string;
  firstGameStartTime: Timestamp;
  lastGameEndTime: Timestamp;
  games: Game[];
}

export interface Participant {
  uid: string;
  displayName: string;
  pick?: string;
  eliminated: boolean;
  eliminatedWeek: number;
}
