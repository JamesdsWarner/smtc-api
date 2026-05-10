export class Session {
  public name: string;
  public id: string;
  public hostPlayer: string;

  constructor(name: string, id: string, hostPlayer: string) {
    this.name = name;
    this.id = id;
    this.hostPlayer = hostPlayer;
  }
}

export interface SessionUser {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: number;
  score: number; // You can store game-specific user data here!
  isHost: boolean;
}

export interface SessionCard {
  id: string;
  cardId: string;
  sessionId: string;
  status: "active" | "discarded" | "success" | "failed" | "notPlayed";
  createdAt: number;
}

export interface SessionUserCard {
  id: string;
  cardId: string;
  sessionId: string;
  userId: string;
  status: "active" | "discarded" | "success" | "failed" | "notPlayed";
  createdAt: number;
}
