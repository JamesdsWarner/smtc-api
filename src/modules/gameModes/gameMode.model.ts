export interface GameMode {
  id: string;
  name: string;
  description: string;
  iconId: string;
  createdAt: number;
}

export interface GameModeCard {
  id: string;
  gameModeId: string;
  cardId: string;
  createdAt: number;
}
