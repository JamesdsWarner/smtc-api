import { v4 as uuidv4 } from "uuid";
import { type GameMode, type GameModeCard } from "./gameMode.model.ts";
import path from "node:path";
import { AppError } from "../../shared/errors/AppError.ts";
// import { getCard } from "../cards/card.service.ts";
import { readDB, writeDB } from "../../shared/helpers/dbHelper.ts";
import type { Icon } from "../../types/icons.ts";
const GAME_MODES_DB_PATH = path.resolve("game_modes.json");
const GAME_MODE_CARDS_DB_PATH = path.resolve("game_mode_cards.json");
const ICONS_PATH = path.resolve("icons.json");

export const readGameModesDB = async () =>
  await readDB<GameMode[]>(GAME_MODES_DB_PATH);
export const readGameModeCardsDB = async () =>
  await readDB<GameModeCard[]>(GAME_MODE_CARDS_DB_PATH);
export const writeGameModesDB = async (gameModes: GameMode[]) =>
  await writeDB<GameMode[]>(GAME_MODES_DB_PATH, gameModes);
export const writeGameModeCardsDB = async (gameModeCards: GameModeCard[]) =>
  await writeDB<GameModeCard[]>(GAME_MODE_CARDS_DB_PATH, gameModeCards);

export const createGameMode = async (
  name: string,
  description: string,
  iconId: string,
) => {
  const id = uuidv4();

  const gameModes = await readGameModesDB();

  // Check if card exists
  if (gameModes.find((u) => u.name === name)) {
    throw new AppError(400, "Game Mode already exists");
  }

  const icons = await readDB<Icon[]>(ICONS_PATH);

  if (!icons.find((i) => i.id === iconId)) {
    throw new AppError(400, "Icon does not exist");
  }

  const newGameMode: GameMode = {
    id,
    name,
    description,
    iconId,
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

// export const addCardToGameModes = async (
//   gameModeIds: Array<string>,
//   cardId: string,
// ) => {
//   const gameModeCards = await readGameModeCardsDB();
//   const gameModes = await readGameModesDB();

//   if (!getCard(cardId)) throw new AppError(400, "Card not found");

//   for (var i = 0; i < gameModeIds.length; i++) {
//     const gameMode = gameModes.find((g) => g.id === gameModes[i]?.id);
//     if (!gameMode) {
//       throw new AppError(400, "Game mode not found");
//     }
//   }

//   const existingGameModeNames = [];
//   for (const modeId of gameModeIds) {
//     const isDuplicate = gameModeCards.find(
//       (gc) => gc.gameModeId === modeId && gc.cardId === cardId,
//     );

//     if (isDuplicate) {
//       const modeData = gameModes.find((g) => g.id === modeId);
//       existingGameModeNames.push(modeData?.name || modeId);
//     }
//   }

//   if (existingGameModeNames.length > 0) {
//     const modeListString = existingGameModeNames.join(", ");
//     throw new AppError(
//       400,
//       `This card is already part of the game modes: ${modeListString}`,
//     );
//   }

//   const newGameModeCards = gameModeIds.map((gameModeId) => {
//     const id = uuidv4();
//     const newGameModeCard: GameModeCard = {
//       id,
//       gameModeId,
//       cardId,
//       createdAt: Date.now(),
//     };
//     gameModeCards.push(newGameModeCard);
//     return newGameModeCard;
//   });

//   await writeGameModeCardsDB(gameModeCards);

//   return newGameModeCards;
// };
