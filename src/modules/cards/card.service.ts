import fs from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../shared/errors/AppError.ts";
import type { Icon } from "../../types/icons.ts";
import pool from "../../shared/db/index.ts";
import { handleDbError } from "../../shared/utils/dbErrorHandler.ts";

const ICONS_PATH = path.resolve("icons.json");

export const verifyIconExists = async (iconId: string): Promise<void> => {
  try {
    const data = await fs.readFile(ICONS_PATH, "utf-8");
    const icons = JSON.parse(data) as Icon[];

    const iconExists = icons.some((i) => i.id === iconId);
    if (!iconExists) {
      throw new AppError(
        400,
        `Icon '${iconId}' does not exist in local assets`,
      );
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Catch JSON parse or missing file system errors cleanly
    throw new AppError(500, "Failed to read local icon configuration file");
  }
};

export const createCard = async (
  prompt: string,
  gameModeId: string,
  iconId: string,
  cardCategoryId: string,
) => {
  await verifyIconExists(iconId);

  try {
    const res = await pool.query(
      `INSERT INTO cards (prompt, icon_id, game_mode_id, card_category_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, prompt, icon_id AS "iconId", game_mode_id AS "gameModeId", card_category_id AS "cardCategoryId", created_at AS "createdAt";`,
      [prompt, iconId, gameModeId, cardCategoryId],
    );

    return res.rows[0];
  } catch (err) {
    handleDbError(err, "Card");
  }
};

export const getCard = async (id: string) => {
  try {
    const res = await pool.query(
      `SELECT id, prompt, icon_id AS "iconId", game_mode_id AS "gameModeId", card_category_id AS "cardCategoryId", created_at AS "createdAt"
       FROM cards 
       WHERE id::text = $1;`,
      [id],
    );

    if (res.rows.length === 0) {
      throw new AppError(404, "Card not found");
    }

    return res.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    handleDbError(err, "Card");
  }
};

export const assignCardToCategory = async (
  cardId: string,
  cardCategoryId: string,
) => {
  try {
    const res = await pool.query(
      `UPDATE cards 
       SET card_category_id = $1 
       WHERE id::text = $2 
       RETURNING id, prompt, icon_id AS "iconId", game_mode_id AS "gameModeId", card_category_id AS "cardCategoryId";`,
      [cardCategoryId, cardId],
    );

    if (res.rows.length === 0) {
      throw new AppError(404, "Card not found");
    }

    return res.rows[0];
  } catch (err: any) {
    handleDbError(err, "Card");
  }
};

export const createCardCategory = async (name: string, iconId: string) => {
  await verifyIconExists(iconId);

  try {
    const res = await pool.query(
      `INSERT INTO card_categories (name, icon_id) 
       VALUES ($1, $2) 
       RETURNING id, name, icon_id AS "iconId", created_at AS "createdAt";`,
      [name, iconId],
    );

    return res.rows[0];
  } catch (err: any) {
    handleDbError(err, "Card Category");
  }
};

export const getCardCategory = async (id: string) => {
  try {
    const res = await pool.query(
      `SELECT id, name, icon_id AS "iconId", created_at AS "createdAt" 
       FROM card_categories 
       WHERE id::text = $1;`,
      [id],
    );

    if (res.rows.length === 0) {
      throw new AppError(404, "Card Category not found");
    }

    return res.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    handleDbError(err, "Card Category");
  }
};
