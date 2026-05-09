import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { type Session, type SessionParticipant } from "./session.model.ts";
import fs from "node:fs/promises";
import path from "node:path";
import type { User } from "../users/user.model.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { logger } from "../../shared/utils/logger.ts";
const SESSIONS_DB_PATH = path.resolve("sessions.json");
const USERS_DB_PATH = path.resolve("users.json");
const SESSION_PARTICIPANTS_DB_PATH = path.resolve("sessionParticipants.json");

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
