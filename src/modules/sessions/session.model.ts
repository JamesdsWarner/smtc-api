export type SessionStatus = "lobby" | "in_progress" | "finished";

export class Session {
  public id: string; // UUID from Postgres
  public name: string; // The display name for the room
  public roomCode: string; // The 4-character join code (e.g., 'ABCD')
  public hostId: string; // UUID of the player who created the room
  public status: SessionStatus;
  public createdAt: Date;

  constructor(
    id: string,
    name: string,
    roomCode: string,
    hostId: string,
    status: SessionStatus = "lobby",
    createdAt: Date = new Date(),
  ) {
    this.id = id;
    this.name = name;
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.status = status;
    this.createdAt = createdAt;
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

export interface SessionGameMode {
  id: string;
  sessionId: string;
  gameModeId: string;
  createdAt: number;
}
