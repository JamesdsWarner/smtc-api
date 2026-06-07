import { type GameMode } from "./gameMode.model.ts";
import path from "node:path";
import { AppError } from "../../shared/errors/AppError.ts";
// import { getCard } from "../cards/card.service.ts";
import { readDB } from "../../shared/helpers/dbHelper.ts";
import type { Icon } from "../../types/icons.ts";
import pool from "../../shared/db/index.ts";
import { handleDbError } from "../../shared/utils/dbErrorHandler.ts";
const ICONS_PATH = path.resolve("icons.json");

export const createGameMode = async (
  name: string,
  description: string,
  iconId: string,
): Promise<GameMode> => {
  const icons = await readDB<Icon[]>(ICONS_PATH);

  if (!icons.find((i) => i.id === iconId)) {
    throw new AppError(400, "Icon does not exist");
  }

  try {
    const query = `
      INSERT INTO game_modes (name, description, icon_id) 
      VALUES ($1, $2, $3) 
      RETURNING id, name, description, icon_id, created_at;
    `;

    const res = await pool.query(query, [name, description, iconId]);
    return res.rows[0];
  } catch (err: any) {
    return handleDbError(err, "GameMode");
  }
};

export const getGameMode = async (id: string): Promise<GameMode> => {
  try {
    const query = `
      SELECT id, name, description, icon_id, created_at 
      FROM game_modes 
      WHERE id::text = $1;
    `;

    const res = await pool.query(query, [id]);

    if (res.rows.length === 0) {
      throw new AppError(404, "Game mode not found");
    }

    return res.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;

    return handleDbError(err, "GameMode");
  }
};

// export const addCardToGameModes = async (
//   gameModeIds: Array<string>,
//   cardId: string,
// ) => {
//   const gameModeCards = await readGameModeCardsDB();
//   const gameModes = await readGameModesDB();

//   if (!getCard(cardId)) throw new AppError(400, "Card not found");

//   for (var i = 0; i < gameModeIds.length; i++) {
//     const gameMode = gameModes.find((g) => g.id === gameModeIds[i]);
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
