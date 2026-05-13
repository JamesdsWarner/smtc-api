import { type Request, type Response, Router } from "express";
import * as SessionService from "./session.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { logger } from "../../shared/utils/logger.ts";

const router = Router();

const createSession = async (req: Request, res: Response) => {
  const { name, hostId } = req.body;

  if (!name || !hostId) {
    throw new AppError(400, "Missing required fields: name and hostId");
  }

  const session = await SessionService.createSession(name, hostId);
  await SessionService.addUserToSession(session.id, hostId, true);

  res.status(201).json(session);
};

const getSession = async (req: Request, res: Response) => {
  const { identifier } = req.params;

  if (typeof identifier !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  const user = await SessionService.getSession(identifier);
  res.status(200).json(user);
};

const addUserToSession = async (req: Request, res: Response) => {
  const { sessionId, userId } = req.params;

  if (typeof sessionId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  if (typeof userId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  const user = await SessionService.addUserToSession(sessionId, userId);
  res.status(200).json(user);
};

const addGameModesToSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { gameModeIds } = req.body;

  if (typeof sessionId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  if (
    !Array.isArray(gameModeIds) ||
    !gameModeIds.every((id) => typeof id === "string")
  ) {
    throw new AppError(400, "gameModeIds must be an array of strings");
  }

  const sessionGameModes = await SessionService.addGameModesToSession(
    sessionId,
    gameModeIds,
  );
  res.status(200).json(sessionGameModes);
};

const addCardsToSession = async (req: Request, res: Response) => {
  const { cards } = req.body;
};

export const createSessionUserCards = async (req: Request, res: Response) => {
  const { amountOfCards = 1 } = req.body;
  const { userId, sessionId } = req.params;

  if (typeof userId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  if (typeof sessionId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  if (typeof amountOfCards !== "number") {
    throw new AppError(400, "Invalid amount of cards");
  }

  const sessionUserCards = await SessionService.assignCardToPlayerInSession(
    userId,
    sessionId,
    amountOfCards,
  );
  res.status(200).json(sessionUserCards);
};

router.post("/create", createSession);
router.get("/:identifier", getSession);
router.post("/:sessionId/players/:userId", addUserToSession);
router.post("/:sessionId/add-game-modes", addGameModesToSession);
router.post("/:sessionId/add-cards", addCardsToSession);
router.post("/:sessionId/players/:userId/cards", createSessionUserCards);

export default router;
