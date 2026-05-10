import { type Request, type Response, Router } from "express";
import * as GameModeService from "./gameMode.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { logger } from "../../shared/utils/logger.ts";

const router = Router();

const createGameMode = async (req: Request, res: Response) => {
  const { name, description, iconId } = req.body;

  if (!name) {
    throw new AppError(400, "Missing name field");
  }

  if (!description) {
    throw new AppError(400, "Missing description field");
  }

  if (!iconId) {
    throw new AppError(400, "Missing iconId field");
  }

  const gameMode = await GameModeService.createGameMode(
    name,
    description,
    iconId,
  );
  const gameModeId = gameMode.id;

  if (!gameModeId) {
    throw new AppError(400, "Error creating gameMode");
  }

  res.status(201).json(gameMode);
};

const getGameMode = async (req: Request, res: Response) => {
  const { gameModeId } = req.params;

  if (typeof gameModeId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  const user = await GameModeService.getGameMode(gameModeId);
  res.status(200).json(user);
};

// const addCardToGameMode = async (req: Request, res: Response) => {
//   const { gameModeIds, cardId } = req.body;

//   if (
//     !Array.isArray(gameModeIds) ||
//     !gameModeIds.every((id) => typeof id === "string")
//   ) {
//     throw new AppError(400, "gameModeIds must be an array of strings");
//   }

//   if (typeof cardId !== "string") {
//     throw new AppError(400, "Invalid or missing ID");
//   }

//   const gameModeCards = await GameModeService.addCardToGameModes(
//     gameModeIds,
//     cardId,
//   );
//   res.status(200).json(gameModeCards);
// };

router.post("/create", createGameMode);
router.get("/:gameModeId", getGameMode);
// router.post("/add-card", addCardToGameMode);

export default router;
