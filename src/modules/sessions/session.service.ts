import { v4 as uuidv4 } from "uuid";
import {
  Session,
  type SessionGameMode,
  type SessionUser,
  type SessionUserCard,
} from "./session.model.ts";
import path from "node:path";
import { AppError } from "../../shared/errors/AppError.ts";
import { logger } from "../../shared/utils/logger.ts";
import { getUser, readUsersDB } from "../users/user.service.ts";
import { readDB, writeDB } from "../../shared/helpers/dbHelper.ts";
import { readCardsDB } from "../cards/card.service.ts";
import { readGameModesDB } from "../gameModes/gameMode.service.ts";
import { handleDbError } from "../../shared/utils/dbErrorHandler.ts";
import pool from "../../shared/db/index.ts";
const SESSIONS_DB_PATH = path.resolve("sessions.json");
const SESSION_USERS_DB_PATH = path.resolve("session_users.json");
const SESSION_USER_CARDS_DB_OATH = path.resolve("session_user_cards.json");
const SESSION_GAME_MODES_DB_PATH = path.resolve("session_game_modes.json");

export const readSessionDB = async () =>
  await readDB<Session[]>(SESSIONS_DB_PATH);
export const readSessionUsersDB = async () =>
  await readDB<SessionUser[]>(SESSION_USERS_DB_PATH);
export const readSessionUserCardDB = async () =>
  await readDB<SessionUserCard[]>(SESSION_USER_CARDS_DB_OATH);
export const readSessionGameModesDB = async () =>
  await readDB<SessionGameMode[]>(SESSION_GAME_MODES_DB_PATH);

export const writeSessionDB = async (sessions: Session[]) =>
  await writeDB<Session[]>(SESSIONS_DB_PATH, sessions);
export const writeSessionUserDB = async (SessionUsers: SessionUser[]) =>
  await writeDB<SessionUser[]>(SESSION_USERS_DB_PATH, SessionUsers);
export const writeSessionUserCardDB = async (
  sessionUserCards: SessionUserCard[],
) =>
  await writeDB<SessionUserCard[]>(
    SESSION_USER_CARDS_DB_OATH,
    sessionUserCards,
  );
export const writeSessionGameModesDB = async (
  sessionGameModes: SessionGameMode[],
) =>
  await writeDB<SessionGameMode[]>(
    SESSION_GAME_MODES_DB_PATH,
    sessionGameModes,
  );

/**
 * Generates a random 4-character string for the Room Code
 */
const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

export const createSession = async (
  name: string,
  hostId: string,
): Promise<Session> => {
  const roomCode = generateRoomCode();

  try {
    const query = `
      INSERT INTO sessions (name, room_code, host_id, status)
      VALUES ($1, $2, $3, 'lobby')
      RETURNING id, name, room_code, host_id, status, created_at;
    `;

    const res = await pool.query(query, [name, roomCode, hostId]);

    return res.rows[0];
  } catch (err: any) {
    // If the room_code somehow collides (Unique Violation), try once more
    if (err.code === "23505" && err.constraint === "unique_room_code") {
      return createSession(name, hostId);
    }

    return handleDbError(err, "Session");
  }
};

export const getSession = async (identifier: string): Promise<Session> => {
  try {
    const query = `
      SELECT id, name, room_code, host_id, status, created_at 
      FROM sessions 
      WHERE id::text = $1 OR room_code = $1;
    `;

    const res = await pool.query(query, [identifier]);

    if (res.rows.length === 0) {
      throw new AppError(404, "Session not found");
    }

    return res.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;

    return handleDbError(err, "Session");
  }
};

export const addUserToSession = async (
  sessionId: string,
  userId: string,
  isHost = false,
) => {
  try {
    const query = `
      INSERT INTO session_players (session_id, user_id, is_host)
      VALUES ($1, $2, $3)
      RETURNING id, session_id, user_id, is_host, score, joined_at;
    `;

    const res = await pool.query(query, [sessionId, userId, isHost]);

    return res.rows[0];
  } catch (err: any) {
    return handleDbError(err, "Session Join");
  }
};

export const addGameModesToSession = async (
  sessionId: string,
  gameModeIds: string[],
) => {
  const gameModes = await readGameModesDB();
  const sessionGameModes = await readSessionGameModesDB();

  const session = getSession(sessionId);
  if (!session) throw new AppError(400, "Invalid or missing ID");

  for (var i = 0; i < gameModeIds.length; i++) {
    const gameMode = gameModes.find((g) => g.id === gameModeIds[i]);
    if (!gameMode) {
      throw new AppError(400, "Game Mode not found");
    }
  }

  const existingGameModesNames = [];
  for (const gameModeId of gameModeIds) {
    const isDuplicate = sessionGameModes.find(
      (g) => g.gameModeId === gameModeId && g.sessionId === sessionId,
    );

    if (isDuplicate) {
      const gameModeData = gameModes.find((g) => g.id === gameModeId);
      existingGameModesNames.push(gameModeData?.id);
    }
  }

  if (existingGameModesNames.length > 0) {
    const gameModesListString = existingGameModesNames.join(", ");
    throw new AppError(
      400,
      `This session already has the game modes added: ${gameModesListString}`,
    );
  }

  const newSessionGameModes = gameModeIds.map((gameModeId) => {
    const id = uuidv4();
    const newCardCardCategory: SessionGameMode = {
      id,
      sessionId,
      gameModeId,
      createdAt: Date.now(),
    };
    sessionGameModes.push(newCardCardCategory);
    return newCardCardCategory;
  });

  writeSessionGameModesDB(sessionGameModes);

  return newSessionGameModes;
};

export const assignCardToPlayerInSession = async (
  userId: string,
  sessionId: string,
  amountOfCards: number,
) => {
  // 1. Cross-module validation
  const [user, session] = await Promise.all([
    getUser(userId),
    getSession(sessionId),
  ]);

  if (!user || !session) throw new AppError(404, "User or Session not found");

  // 2. Logic to write to your session_player_cards.json
  // @to-do add get cards route in cards module.
  const cards = await readCardsDB();
  const sessionUserCards = await readSessionUserCardDB();
  const unusedCards = cards.filter(
    (card) =>
      !sessionUserCards.find(
        (c) =>
          c.cardId === card.id &&
          c.userId === userId &&
          c.sessionId === sessionId,
      ),
  );

  if (!unusedCards) {
    throw new AppError(400, "No cards left");
  }

  const newSessionUserCards: SessionUserCard[] = [];
  for (let i = 0; i < amountOfCards; i++) {
    logger.info(unusedCards.length);
    if (unusedCards.length > 0) {
      const randomCardIndex = Math.floor(Math.random() * unusedCards.length);
      const randomCard = unusedCards[randomCardIndex]!;
      const id = uuidv4();
      const newSessionUserCard: SessionUserCard = {
        id,
        cardId: randomCard.id,
        sessionId,
        userId,
        status: "active",
        createdAt: Date.now(),
      };
      sessionUserCards.push(newSessionUserCard);
      unusedCards.splice(randomCardIndex, 1);
      newSessionUserCards.push(newSessionUserCard);
    } else
      throw new AppError(400, "Not enough cards / you've gobbled them all!");
  }

  writeSessionUserCardDB(sessionUserCards);

  return newSessionUserCards;
};
