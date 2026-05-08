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

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: number;
  score: number; // You can store game-specific user data here!
  isHost: boolean;
}
