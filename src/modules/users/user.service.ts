import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { type User } from "./user.model.ts";
import fs from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../shared/errors/AppError.ts";
import { readDB, writeDB } from "../../shared/helpers/dbHelper.ts";
import pool from "../../shared/db/index.ts";
import { handleDbError } from "../../shared/utils/dbErrorHandler.ts";
import { logger } from "../../shared/utils/logger.ts";
const USER_DB_PATH = path.resolve("users.json");

export const readUsersDB = async () => await readDB<User[]>(USER_DB_PATH);
export const writeUsersDB = async (users: User[]) =>
  await writeDB<User[]>(USER_DB_PATH, users);

export const createUser = async (
  name: string,
  userType: "temporary" | "permanent" = "temporary",
) => {
  try {
    const query = `
    INSERT INTO users (name, user_type) 
    VALUES ($1, $2) 
    RETURNING id, name, user_type;
  `;
    const res = await pool.query(query, [name, userType]);
    return res.rows[0];
  } catch (err) {
    handleDbError(err, "User");
  }
};

export const getUser = async (id: string, plainPin?: string) => {
  const users = await readUsersDB();

  // Check if user exists
  const foundUser = users.find((u) => u.id === id);
  if (!foundUser) {
    throw new AppError(400, "User not found");
  }

  // const isValid = await bcrypt.compare(plainPin, foundUser.pinHash);

  // if (!isValid) throw new AppError(401, "Incorrect pin");

  return foundUser;
};
