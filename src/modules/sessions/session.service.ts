import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {
  type Session,
  type SessionParticipant,
  type SessionUserCard,
} from "./session.model.ts";
import fs from "node:fs/promises";
import path from "node:path";
import type { User } from "../users/user.model.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { logger } from "../../shared/utils/logger.ts";
import { getUser } from "../users/user.service.ts";
import type { Card } from "../cards/card.model.ts";
const SESSIONS_DB_PATH = path.resolve("sessions.json");
const USERS_DB_PATH = path.resolve("users.json");
const SESSION_PARTICIPANTS_DB_PATH = path.resolve("sessionParticipants.json");
const SESSION_USER_CARDS_DB_OATH = path.resolve("sessionUserCards.json");
const CARDS_DB_PATH = path.resolve("cards.json");

const readCardDB = async (): Promise<Card[]> => {
  const data = await fs.readFile(CARDS_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const readSessionDB = async (): Promise<Session[]> => {
  const data = await fs.readFile(SESSIONS_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const readUserDB = async (): Promise<User[]> => {
  const data = await fs.readFile(USERS_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const readSessionParticipantsDB = async (): Promise<SessionParticipant[]> => {
  const data = await fs.readFile(SESSION_PARTICIPANTS_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const writeSessionDB = async (sessions: Session[]) => {
  await fs.writeFile(SESSIONS_DB_PATH, JSON.stringify(sessions, null, 2));
};

const writeSessionParticipantDB = async (sessions: SessionParticipant[]) => {
  await fs.writeFile(
    SESSION_PARTICIPANTS_DB_PATH,
    JSON.stringify(sessions, null, 2),
  );
};

const readSessionUserCardDB = async (): Promise<SessionUserCard[]> => {
  const data = await fs.readFile(SESSION_USER_CARDS_DB_OATH, "utf-8");
  return JSON.parse(data);
};
const writeSessionUserCardDB = async (cards: SessionUserCard[]) => {
  await fs.writeFile(
    SESSION_USER_CARDS_DB_OATH,
    JSON.stringify(cards, null, 2),
  );
};

export const createSession = async (name: string, hostPlayer: string) => {
  const id = uuidv4();

  const sessions = await readSessionDB();
  const users = await readUserDB();

  const user = users.find((u) => u.id === hostPlayer);

  if (!user) throw new AppError(400, "Invalid or missing ID");

  const newSession: Session = {
    id,
    name,
    hostPlayer,
  };

  sessions.push(newSession);
  await writeSessionDB(sessions);

  return newSession;
};

export const getSession = async (id: string) => {
  const sessions = await readSessionDB();

  // Check if session exists
  const foundSession = sessions.find((u) => u.id === id);
  if (!foundSession) {
    throw new AppError(400, "Session not found");
  }
  return foundSession;
};

export const addUserToSession = async (
  sessionId: string,
  userId: string,
  isHost = false,
) => {
  const users = await readUserDB();
  const sessions = await readSessionDB();
  const sessionParticipants = await readSessionParticipantsDB();

  logger.info(sessionId, userId);

  // Check if session exists
  // getSession(sessionId);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new AppError(400, "User not found");
  }

  const session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    throw new AppError(400, "Session not found");
  }

  const sessionParticipantDuplicate = sessionParticipants.find(
    (sp) => sp.sessionId === sessionId && sp.userId === userId,
  );

  if (sessionParticipantDuplicate)
    throw new AppError(400, `This user is already part of this session}`);

  const id = uuidv4();

  const newSessionParticipant: SessionParticipant = {
    id,
    sessionId,
    userId,
    joinedAt: Date.now(),
    score: 0, // You can store game-specific user data here!
    isHost,
  };

  sessionParticipants.push(newSessionParticipant);
  await writeSessionParticipantDB(sessionParticipants);

  return newSessionParticipant;
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
  const cards = await readCardDB();
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
