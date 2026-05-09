import { v4 as uuidv4 } from "uuid";
import fs from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../shared/errors/AppError.ts";
import type { CardCardCategory, CardCategory, Card } from "./card.model.ts";
const CARDS_DB_PATH = path.resolve("cards.json");
const CARD_CATEGORIES_DB_PATH = path.resolve("cardCategories.json");
const CARD_CARD_CATEOGORIES_DB_PATH = path.resolve("cardCardCategories.json");

const readCardDB = async (): Promise<Card[]> => {
  const data = await fs.readFile(CARDS_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const readCardCategoryDB = async (): Promise<CardCategory[]> => {
  const data = await fs.readFile(CARD_CATEGORIES_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const readCardCardCategoryDB = async (): Promise<CardCardCategory[]> => {
  const data = await fs.readFile(CARD_CARD_CATEOGORIES_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const writeCardDB = async (cards: Card[]) => {
  await fs.writeFile(CARDS_DB_PATH, JSON.stringify(cards, null, 2));
};

const writeCardCategoryDB = async (cards: CardCategory[]) => {
  await fs.writeFile(CARD_CATEGORIES_DB_PATH, JSON.stringify(cards, null, 2));
};

const writeCardCardCategoryDB = async (cards: CardCardCategory[]) => {
  await fs.writeFile(
    CARD_CARD_CATEOGORIES_DB_PATH,
    JSON.stringify(cards, null, 2),
  );
};

export const createCard = async (prompt: string, iconUrl: string) => {
  const id = uuidv4();

  const cards = await readCardDB();

  // Check if card exists
  if (cards.find((u) => u.prompt === prompt)) {
    throw new AppError(401, "Card already exists");
  }

  const newCard: Card = {
    id,
    prompt,
    iconUrl,
    createdAt: Date.now(),
  };

  cards.push(newCard);
  await writeCardDB(cards);

  return newCard;
};

export const createCardCategory = async (name: string, iconUrl: string) => {
  const id = uuidv4();

  const cardCategories = await readCardCategoryDB();

  // Check if card exists
  if (cardCategories.find((u) => u.name === name)) {
    throw new AppError(401, "Card Category already exists");
  }

  const newCardCategory: CardCategory = {
    id,
    name,
    iconUrl,
    createdAt: Date.now(),
  };

  cardCategories.push(newCardCategory);
  await writeCardCategoryDB(cardCategories);

  return newCardCategory;
};

export const addCardToCardCategory = async (
  cardId: string,
  cardCategoryId: string,
) => {
  const id = uuidv4();

  const cards = await readCardDB();
  const cardCategories = await readCardCategoryDB();

  const card = cards.find((u) => u.id === cardId);
  if (!card) throw new AppError(400, "Invalid or missing ID");

  const cardCategory = cardCategories.find((u) => u.id === cardCategoryId);
  if (!cardCategory) throw new AppError(400, "Invalid or missing ID");

  const newCardCardCategory: CardCardCategory = {
    id,
    cardId,
    cardCategoryId,
    createdAt: Date.now(),
  };

  const cardCardCategories = await readCardCardCategoryDB();

  cardCardCategories.push(newCardCardCategory);
  writeCardCardCategoryDB(cardCardCategories);

  return newCardCardCategory;
};

export const getCard = async (id: string) => {
  const cards = await readCardDB();

  // Check if card exists
  const foundCard = cards.find((u) => u.id === id);
  if (!foundCard) {
    throw new AppError(400, "Card not found");
  }
  return foundCard;
};

export const getCardCategory = async (id: string) => {
  const cardCategories = await readCardCategoryDB();

  // Check if cardCategory exists
  const foundCardCategory = cardCategories.find((u) => u.id === id);
  if (!foundCardCategory) {
    throw new AppError(400, "Card not found");
  }
  return foundCardCategory;
};
