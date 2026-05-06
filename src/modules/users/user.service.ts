import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { type User } from "./user.model.ts";
import fs from "node:fs/promises";
import path from "node:path";
const DB_PATH = path.resolve("users.json");

const readDB = async (): Promise<User[]> => {
  const data = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(data);
};

const writeDB = async (users: User[]) => {
  await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2));
};

export const createUser = async (name: string, plainPin: string) => {
  const saltRounds = 10;
  const pinHash = await bcrypt.hash(plainPin, saltRounds);
  const id = uuidv4();

  const users = await readDB();

  // Check if user exists
  if (users.find((u) => u.name === name)) {
    throw new Error("User already exists");
  }

  const newUser: User = {
    id,
    name,
    pinHash,
  };

  users.push(newUser);
  await writeDB(users);

  return newUser;
};

export const getUser = async (id: string, plainPin: string) => {
  const users = await readDB();

  // Check if user exists
  const foundUser = users.find((u) => u.id === id);
  if (!foundUser) {
    throw new Error("User not found");
  }

  const isValid = await bcrypt.compare(plainPin, foundUser.pinHash);

  return { success: isValid, user: isValid ? foundUser : null };
};
