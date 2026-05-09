import { type Request, type Response, Router } from "express";
import * as SessionService from "./session.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { logger } from "../../shared/utils/logger.ts";

const router = Router();

const createSession = async (req: Request, res: Response) => {
  const { name, hostPlayer } = req.body;

  if (!name) {
    throw new AppError(400, "Missing name field");
  }

  if (!hostPlayer) {
    throw new AppError(400, "Missing hostplayer field");
  }

  const session = await SessionService.createSession(name, hostPlayer);
  const sessionId = session.id;

  if (!sessionId) {
    throw new AppError(400, "Error creating session");
  }

  const user = await SessionService.addUserToSession(
    sessionId,
    hostPlayer,
    true,
  );

  const userId = user.id;

  if (!userId) {
    throw new AppError(400, "Error adding user to session");
  }

  res.status(201).json(session);
};

const getSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (typeof sessionId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  const user = await SessionService.getSession(sessionId);
  res.status(200).json(user);
};

const addUserToSession = async (req: Request, res: Response) => {
  const { sessionId, userId } = req.body;

  logger.info(req.params.userId);
  logger.info(req.params.sessionId);

  if (typeof sessionId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  if (typeof userId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  const user = await SessionService.addUserToSession(sessionId, userId);
  res.status(200).json(user);
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
router.get("/:sessionId", getSession);
router.post("/add-user", addUserToSession);
router.post("/:sessionId/players/:userId/cards", createSessionUserCards);

export default router;
