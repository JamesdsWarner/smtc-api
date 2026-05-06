import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { type Session } from "./session.model.ts";
import fs from "node:fs/promises";
import path from "node:path";
import type { User } from "../users/user.model.ts";
const SESSIONS_DB_PATH = path.resolve("sessions.json");
const USERS_DB_PATH = path.resolve("users.json");

const readSessionDB = async (): Promise<Session[]> => {
  const data = await fs.readFile(SESSIONS_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const readUserDB = async (): Promise<User[]> => {
  const data = await fs.readFile(USERS_DB_PATH, "utf-8");
  return JSON.parse(data);
};

const writeSessionDB = async (sessions: Session[]) => {
  await fs.writeFile(SESSIONS_DB_PATH, JSON.stringify(sessions, null, 2));
};

export const createSession = async (name: string, hostPlayer: string) => {
  const id = uuidv4();

  const sessions = await readSessionDB();
  const users = await readUserDB();

  const user = users.find((u) => u.id === hostPlayer);

  if (!user) return { success: false };

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
    throw new Error("session not found");
  }
  return { success: true, session: foundSession };
};
