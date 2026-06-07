import { type Request, type Response, Router } from "express";
import * as CardService from "./card.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";

const router = Router();

const createCard = async (req: Request, res: Response) => {
  const { prompt, gameModeId, iconId, cardCategoryId } = req.body;

  if (!prompt) throw new AppError(400, "Missing prompt field");
  if (!gameModeId) throw new AppError(400, "Missing gameModeId field");
  if (!iconId) throw new AppError(400, "Missing iconId field");

  if (!cardCategoryId) throw new AppError(400, "Missing cardCategoryId field");

  const card = await CardService.createCard(
    prompt,
    gameModeId,
    iconId,
    cardCategoryId,
  );
  res.status(201).json(card);
};

const createCardCategory = async (req: Request, res: Response) => {
  const { name, iconId } = req.body;

  if (!name) throw new AppError(400, "Missing name field");
  if (!iconId) throw new AppError(400, "Missing iconId field");

  const cardCategory = await CardService.createCardCategory(name, iconId);
  res.status(201).json(cardCategory);
};

const getCard = async (req: Request, res: Response) => {
  const { cardId } = req.params;

  if (!cardId || typeof cardId !== "string") {
    throw new AppError(400, "Invalid or missing cardId parameter");
  }

  const card = await CardService.getCard(cardId);
  res.status(200).json(card);
};

const getCardCategory = async (req: Request, res: Response) => {
  const { cardCategoryId } = req.params;

  if (!cardCategoryId || typeof cardCategoryId !== "string") {
    throw new AppError(400, "Invalid or missing cardCategoryId parameter");
  }

  const cardCategory = await CardService.getCardCategory(cardCategoryId);
  res.status(200).json(cardCategory);
};

const assignCardToCategory = async (req: Request, res: Response) => {
  const { cardId, cardCategoryId } = req.body;

  if (!cardId || typeof cardId !== "string") {
    throw new AppError(400, "Invalid or missing cardId");
  }

  if (!cardCategoryId || typeof cardCategoryId !== "string") {
    throw new AppError(400, "Invalid or missing cardCategoryId");
  }

  const updatedCard = await CardService.assignCardToCategory(
    cardId,
    cardCategoryId,
  );
  res.status(200).json(updatedCard);
};

// Routes Setup
router.post("/create", createCard);
router.get("/:cardId", getCard);
router.post("/categories/create", createCardCategory);
router.get("/categories/:cardCategoryId", getCardCategory);
router.post("/assign-category", assignCardToCategory);

export default router;
