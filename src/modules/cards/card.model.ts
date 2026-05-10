export interface Card {
  id: string;
  prompt: string;
  iconId: string;
  gameModeId: string;
  createdAt: number;
}

export interface CardCategory {
  id: string;
  name: string;
  iconId: string;
  createdAt: number;
}

export interface CardCardCategory {
  id: string;
  cardId: string;
  cardCategoryId: string;
  createdAt: number;
}
