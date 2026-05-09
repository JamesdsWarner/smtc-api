import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { type GameMode, type GameModeCard } from "./gameMode.model.ts";
import fs from "node:fs/promises";
import path from "node:path";
import type { User } from "../users/user.model.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { logger } from "../../shared/utils/logger.ts";
const GAME_MODES_DB_PATH = path.resolve("gameModes.json");
const CARDS_DB_PATH = path.resolve("cards.json");
const GAME_MODE_CARDS_DB_PATH = path.resolve("GameModeCards.json");

const readGameModesDB = async (): Promise<GameMode[]> => {
  const data = await fs.readFile(GAME_MODES_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const readCardsDB = async (): Promise<User[]> => {
  const data = await fs.readFile(CARDS_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const readGameModeCardsDB = async (): Promise<GameModeCard[]> => {
  const data = await fs.readFile(GAME_MODE_CARDS_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const writeGameModesDB = async (gameModes: GameMode[]) => {
  await fs.writeFile(GAME_MODES_DB_PATH, JSON.stringify(gameModes, null, 2));
};

const writeGameModeCardsDB = async (gameModeCards: GameModeCard[]) => {
  await fs.writeFile(
    GAME_MODE_CARDS_DB_PATH,
    JSON.stringify(gameModeCards, null, 2),
  );
};

export const createGameMode = async (
  name: string,
  description: string,
  iconUrl: string,
) => {
  const id = uuidv4();

  const gameModes = await readGameModesDB();

  // Check if card exists
  if (gameModes.find((u) => u.name === name)) {
    throw new AppError(401, "Game Mode already exists");
  }

  const newGameMode: GameMode = {
    id,
    name,
    description,
    iconUrl,
    createdAt: Date.now(),
  };

  gameModes.push(newGameMode);
  await writeGameModesDB(gameModes);

  return newGameMode;
};

export const getGameMode = async (id: string) => {
  const gameModes = await readGameModesDB();

  // Check if gameMode exists
  const foundGameMode = gameModes.find((u) => u.id === id);
  if (!foundGameMode) {
    throw new AppError(400, "gameMode not found");
  }
  return foundGameMode;
};

export const addCardToGameModes = async (
  gameModeIds: Array<string>,
  cardId: string,
) => {
  const cards = await readCardsDB();
  const gameModeCards = await readGameModeCardsDB();
  const gameModes = await readGameModesDB();

  const card = cards.find((c) => c.id === cardId);
  if (!card) {
    throw new AppError(400, "Card not found");
  }

  for (var i = 0; i < gameModeIds.length; i++) {
    const gameMode = gameModes.find((g) => g.id === gameModes[i]?.id);
    if (!gameMode) {
      throw new AppError(400, "Game mode not found");
    }
  }

  const existingGameModeNames = [];
  for (const modeId of gameModeIds) {
    const isDuplicate = gameModeCards.find(
      (gc) => gc.gameModeId === modeId && gc.cardId === cardId,
    );

    if (isDuplicate) {
      const modeData = gameModes.find((g) => g.id === modeId);
      existingGameModeNames.push(modeData?.name || modeId);
    }
  }

  if (existingGameModeNames.length > 0) {
    const modeListString = existingGameModeNames.join(", ");
    throw new AppError(
      400,
      `This card is already part of the game modes: ${modeListString}`,
    );
  }

  const newGameModeCards = gameModeIds.map((gameModeId) => {
    const id = uuidv4();
    const newGameModeCard: GameModeCard = {
      id,
      gameModeId,
      cardId,
      createdAt: Date.now(),
    };
    gameModeCards.push(newGameModeCard);
    return newGameModeCard;
  });

  await writeGameModeCardsDB(gameModeCards);

  return newGameModeCards;
};
