import { v4 as uuidv4 } from "uuid";
import path from "node:path";
import { AppError } from "../../shared/errors/AppError.ts";
import type { CardCardCategory, CardCategory, Card } from "./card.model.ts";
import { readDB, writeDB } from "../../shared/helpers/dbHelper.ts";
import { getGameMode } from "../gameModes/gameMode.service.ts";
import type { Icon } from "../../types/icons.ts";
import pool from "../../shared/db/index.ts";
import { handleDbError } from "../../shared/utils/dbErrorHandler.ts";
const CARDS_DB_PATH = path.resolve("cards.json");
const CARD_CATEGORIES_DB_PATH = path.resolve("card_categories.json");
const CARD_CARD_CATEOGORIES_DB_PATH = path.resolve("card_card_categories.json");
const ICONS_PATH = path.resolve("icons.json");

export const readCardsDB = async () => await readDB<Card[]>(CARDS_DB_PATH);
export const readCardCategoriesDB = async () =>
  await readDB<CardCategory[]>(CARD_CATEGORIES_DB_PATH);
export const readCardCardCategoriesDB = async () =>
  await readDB<CardCardCategory[]>(CARD_CARD_CATEOGORIES_DB_PATH);
export const writeCardsDB = async (cards: Card[]) =>
  await writeDB<Card[]>(CARDS_DB_PATH, cards);
export const writeCardCategoriesDB = async (cardCategories: CardCategory[]) =>
  await writeDB<CardCategory[]>(CARD_CATEGORIES_DB_PATH, cardCategories);
export const writeCardCardCategoriesDB = async (
  cardCardCategories: CardCardCategory[],
) =>
  await writeDB<CardCardCategory[]>(
    CARD_CARD_CATEOGORIES_DB_PATH,
    cardCardCategories,
  );

export const createCard = async (
  prompt: string,
  gameModeId: string,
  iconId: string,
) => {
  const gameMode = await getGameMode(gameModeId);
  if (!gameMode) throw new AppError(400, "Game Mode does not exist");

  const icons = await readDB<Icon[]>(ICONS_PATH);

  if (!icons.find((u) => u.id === iconId)) {
    throw new AppError(400, "Icon does not exist");
  }

  try {
    const res = await pool.query(
      `INSERT INTO cards (prompt, icon_id, game_mode_id) VALUES ($1, $2, $3) RETURNING *`,
      [prompt, iconId, gameModeId],
    );

    return res.rows[0];
  } catch (err) {
    handleDbError(err, "Card");
  }
};

export const createCardCategory = async (name: string, iconId: string) => {
  const id = uuidv4();

  const cardCategories = await readCardCategoriesDB();

  // Check if card exists
  if (cardCategories.find((u) => u.name === name)) {
    throw new AppError(401, "Card Category already exists");
  }

  const icons = await readDB<Icon[]>(ICONS_PATH);

  if (!icons.find((i) => i.id === iconId)) {
    throw new AppError(400, "Icon does not exist");
  }

  const newCardCategory: CardCategory = {
    id,
    name,
    iconId,
    createdAt: Date.now(),
  };

  cardCategories.push(newCardCategory);
  await writeCardCategoriesDB(cardCategories);

  return newCardCategory;
};

export const addCardToCardCategories = async (
  cardId: string,
  cardCategoryIds: Array<string>,
) => {
  const cards = await readCardsDB();
  const cardCategories = await readCardCategoriesDB();
  const cardCardCategories = await readCardCardCategoriesDB();

  const card = cards.find((u) => u.id === cardId);
  if (!card) throw new AppError(400, "Invalid or missing ID");

  for (var i = 0; i < cardCategoryIds.length; i++) {
    const cardCategory = cardCategories.find(
      (g) => g.id === cardCategoryIds[i],
    );
    if (!cardCategory) {
      throw new AppError(400, "Card Category not found");
    }
  }

  const existingCardCategoriesNames = [];
  for (const cardCategoryId of cardCategoryIds) {
    const isDuplicate = cardCardCategories.find(
      (c) => c.cardCategoryId === cardCategoryId && c.cardId === cardId,
    );

    if (isDuplicate) {
      const categoryData = cardCategories.find((c) => c.id === cardCategoryId);
      existingCardCategoriesNames.push(categoryData?.name || cardCategoryId);
    }
  }

  if (existingCardCategoriesNames.length > 0) {
    const categoryListString = existingCardCategoriesNames.join(", ");
    throw new AppError(
      400,
      `This card is already part of the categories: ${categoryListString}`,
    );
  }

  const newCardCardCategories = cardCategoryIds.map((cardCategoryId) => {
    const id = uuidv4();
    const newCardCardCategory: CardCardCategory = {
      id,
      cardId,
      cardCategoryId,
      createdAt: Date.now(),
    };
    cardCardCategories.push(newCardCardCategory);
    return newCardCardCategory;
  });

  writeCardCardCategoriesDB(cardCardCategories);

  return newCardCardCategories;
};

export const getCard = async (id: string) => {
  const cards = await readCardsDB();

  // Check if card exists
  const foundCard = cards.find((u) => u.id === id);
  if (!foundCard) {
    throw new AppError(400, "Card not found");
  }
  return foundCard;
};

export const getCardCategory = async (id: string) => {
  const cardCategories = await readCardCategoriesDB();

  // Check if cardCategory exists
  const foundCardCategory = cardCategories.find((u) => u.id === id);
  if (!foundCardCategory) {
    throw new AppError(400, "Card not found");
  }
  return foundCardCategory;
};
