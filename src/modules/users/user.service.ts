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

export const getUser = async (id: string) => {
  try {
    const query = `
      SELECT id, name, user_type, created_at 
      FROM users 
      WHERE id = $1;
    `;

    const res = await pool.query(query, [id]);

    if (res.rows.length === 0) {
      throw new AppError(404, "User not found");
    }

    return res.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;

    handleDbError(err, "User");
  }
};
