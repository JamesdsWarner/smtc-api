import {
  Session,
  type SessionGameMode,
  type SessionUserCard,
} from "./session.model.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { handleDbError } from "../../shared/utils/dbErrorHandler.ts";
import pool from "../../shared/db/index.ts";
import bcrypt from "bcrypt";

/**
 * Generates a random 4-character string for the Room Code
 */
const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

export const createSession = async (hostId: string): Promise<Session> => {
  const roomCode = generateRoomCode();

  try {
    const query = `
      INSERT INTO sessions (room_code, host_id, status)
      VALUES ($1, $2, 'lobby')
      RETURNING id, room_code, host_id, status, created_at;
    `;

    const res = await pool.query(query, [roomCode, hostId]);

    return res.rows[0];
  } catch (err: any) {
    // If the room_code somehow collides (Unique Violation), try once more
    if (err.code === "23505" && err.constraint === "unique_room_code") {
      return createSession(hostId);
    }

    return handleDbError(err, "Session");
  }
};

export const updateSessionStatus = async (
  sessionId: string,
  userId: string,
  status: "in_progress" | "completed",
) => {
  try {
    const authCheckQuery = `
      SELECT is_host 
      FROM session_users 
      WHERE session_id::text = $1 AND user_id::text = $2;
    `;

    const authRes = await pool.query(authCheckQuery, [sessionId, userId]);

    if (authRes.rows.length === 0) {
      throw new AppError(
        403,
        "Unauthorized: You are not a member of this session",
      );
    }

    if (authRes.rows[0].is_host !== true) {
      throw new AppError(
        403,
        "Unauthorized: Only the host can modify the session status",
      );
    }

    const updateQuery = `
      UPDATE sessions
      SET status = $1
      WHERE id::text = $2
      RETURNING id, room_code AS "roomCode", host_id AS "hostId", status, created_at AS "createdAt";
    `;

    const res = await pool.query(updateQuery, [status, sessionId]);

    // Defensive fallback check in case the session table row disappeared
    if (res.rows.length === 0) {
      throw new AppError(404, "Session not found");
    }

    return res.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    return handleDbError(err, "Session Update");
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

export const getSessionByRoomCode = async (roomCode: string) => {
  try {
    const query = `
      SELECT 
        id, 
        room_code AS "roomCode", 
        host_id AS "hostId", 
        status, 
        created_at AS "createdAt" 
      FROM sessions 
      WHERE room_code = $1;
    `;

    const res = await pool.query(query, [roomCode.toUpperCase()]);

    if (res.rows.length === 0) {
      throw new AppError(404, `Session with room code '${roomCode}' not found`);
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
  pin: string,
  isHost = false,
) => {
  const isFourDigits = /^\d{4}$/.test(pin);

  if (!isFourDigits) {
    throw new AppError(
      400,
      "Room PIN must be exactly 4 numbers (e.g., '1234')",
    );
  }

  try {
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(pin, saltRounds);

    const query = `
      INSERT INTO session_users (session_id, user_id, pin_hash, is_host)
      VALUES ($1, $2, $3, $4)
      RETURNING id, session_id AS "sessionId", user_id AS "userId", is_host AS "isHost", score, joined_at AS "joinedAt";
    `;

    const res = await pool.query(query, [sessionId, userId, pinHash, isHost]);

    return res.rows[0];
  } catch (err: any) {
    if (err.code === "23505") {
      throw new AppError(400, "This user is already part of this session");
    }

    return handleDbError(err, "Session Join");
  }
};

export const addGameModesToSession = async (
  sessionId: string,
  gameModeIds: string[],
): Promise<SessionGameMode[]> => {
  try {
    // 1. Bulk Insert with UNNEST
    // This inserts one row for every ID in the gameModeIds array
    const query = `
      INSERT INTO session_game_modes (session_id, game_mode_id)
      SELECT $1, unnest($2::uuid[])
      ON CONFLICT (session_id, game_mode_id) DO NOTHING
      RETURNING id, session_id, game_mode_id, created_at;
    `;

    const res = await pool.query(query, [sessionId, gameModeIds]);

    // 2. Check if anything was actually inserted
    // If the count doesn't match the input, some were duplicates (ignored by DO NOTHING)
    if (res.rows.length === 0 && gameModeIds.length > 0) {
      throw new AppError(
        400,
        "All selected game modes were already added to this session",
      );
    }

    return res.rows.map((row) => row);
  } catch (err: any) {
    return handleDbError(err, "SessionGameMode");
  }
};

export const assignCardsToPlayer = async (
  userId: string,
  sessionId: string,
  amount: number,
): Promise<SessionUserCard[]> => {
  try {
    // 1. Find random cards that haven't been used in this session yet
    // We use a subquery to exclude cards already in session_user_cards
    const findCardsQuery = `
      SELECT id FROM cards c
      WHERE NOT EXISTS (
        SELECT 1 FROM session_user_cards suc 
        WHERE suc.card_id = c.id AND suc.session_id = $1
      )
      ORDER BY RANDOM()
      LIMIT $2;
    `;

    const availableCards = await pool.query(findCardsQuery, [
      sessionId,
      amount,
    ]);

    if (availableCards.rows.length < amount) {
      throw new AppError(400, "Not enough unique cards left in the deck!");
    }

    // 2. Bulk Insert the dealt cards
    const cardIds = availableCards.rows.map((row) => row.id);
    const insertQuery = `
      INSERT INTO session_user_cards (session_id, user_id, card_id)
      SELECT $1, $2, unnest($3::uuid[])
      RETURNING id, session_id, user_id, card_id, status, created_at;
    `;

    const res = await pool.query(insertQuery, [sessionId, userId, cardIds]);

    return res.rows.map((row) => row);
  } catch (err) {
    if (err instanceof AppError) throw err;
    return handleDbError(err, "SessionUserCard");
  }
};
