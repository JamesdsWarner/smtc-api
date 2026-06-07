import { type Request, type Response, Router } from "express";
import * as SessionService from "./session.service.ts";
import * as UserService from "../users/user.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { logger } from "../../shared/utils/logger.ts";
import { Session } from "./session.model.ts";

const router = Router();

const createSession = async (req: Request, res: Response) => {
  const { userName, pin } = req.body;

  if (!pin) {
    throw new AppError(400, "Missing required fields: pin");
  }

  if (!userName) {
    throw new AppError(400, "Missing required fields: userName");
  }

  const user = await UserService.createUser(userName);
  const session = await SessionService.createSession(user.id);
  await SessionService.addUserToSession(session.id, user.id, pin, true);

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

const updateSessionStatus = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { status, userId } = req.body;

  if (typeof sessionId !== "string") {
    throw new AppError(400, "Invalid or missing sessionId parameter");
  }

  if (typeof userId !== "string") {
    throw new AppError(
      400,
      "Missing or invalid user authorization header (x-user-id)",
    );
  }

  const validStatuses = ["in_progress", "completed"];
  if (!validStatuses.includes(status)) {
    throw new AppError(
      400,
      "Status must be either 'in_progress' or 'completed'",
    );
  }

  const updatedSession = await SessionService.updateSessionStatus(
    sessionId,
    userId,
    status,
  );

  res.status(200).json(updatedSession);
};

const addUserToSession = async (req: Request, res: Response) => {
  const { userName, pin } = req.body;
  const { roomCode } = req.params;

  if (typeof userName !== "string") {
    throw new AppError(400, "Invalid or missing userName");
  }

  if (typeof roomCode !== "string") {
    throw new AppError(400, "Invalid or missing room code");
  }

  if (typeof pin !== "string") {
    throw new AppError(400, "Invalid or missing PIN");
  }

  const session = await SessionService.getSessionByRoomCode(roomCode);
  const user = await UserService.createUser(userName);
  const sessionUser = await SessionService.addUserToSession(
    session.id,
    user.id,
    pin,
  );
  res.status(200).json(sessionUser);
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

  const sessionUserCards = await SessionService.assignCardsToPlayer(
    userId,
    sessionId,
    amountOfCards,
  );
  res.status(200).json(sessionUserCards);
};

router.post("/create", createSession);
router.get("/:identifier", getSession);
router.post("/:sessionId/update-status", updateSessionStatus);
router.post("/:roomCode/add-player", addUserToSession);
router.post("/:sessionId/add-game-modes", addGameModesToSession);
router.post("/:sessionId/add-cards", addCardsToSession);
router.post("/:sessionId/players/:userId/cards", createSessionUserCards);

export default router;
