export interface Card {
  id: string;
  prompt: string;
  iconUrl: string;
  createdAt: number;
}

export interface CardCategory {
  id: string;
  name: string;
  iconUrl: string;
  createdAt: number;
}

export interface CardCardCategory {
  id: string;
  cardId: string;
  cardCategoryId: string;
  createdAt: number;
}
