import { type Request, type Response, Router } from "express";
import * as CardService from "./card.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { logger } from "../../shared/utils/logger.ts";

const router = Router();

const createCard = async (req: Request, res: Response) => {
  const { prompt, iconUrl } = req.body;

  if (!prompt) {
    throw new AppError(400, "Missing prompt field");
  }

  if (!iconUrl) {
    throw new AppError(400, "Missing iconUrl field");
  }

  const card = await CardService.createCard(prompt, iconUrl);
  const cardId = card.id;

  if (!cardId) {
    throw new AppError(400, "Error creating card");
  }

  res.status(201).json(card);
};

const createCardCategory = async (req: Request, res: Response) => {
  const { name, iconUrl } = req.body;

  if (!name) {
    throw new AppError(400, "Missing name field");
  }

  if (!iconUrl) {
    throw new AppError(400, "Missing iconUrl field");
  }

  const cardCategory = await CardService.createCardCategory(name, iconUrl);
  const cardCategoryId = cardCategory.id;

  if (!cardCategoryId) {
    throw new AppError(400, "Error creating card category");
  }

  res.status(201).json(cardCategory);
};

const getCard = async (req: Request, res: Response) => {
  const { cardId } = req.params;

  if (typeof cardId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  const card = await CardService.getCard(cardId);
  res.status(200).json(card);
};

const getCardCategory = async (req: Request, res: Response) => {
  const { cardCategoryId } = req.params;

  if (typeof cardCategoryId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  const cardCategory = await CardService.getCardCategory(cardCategoryId);
  res.status(200).json(cardCategory);
};

const addCardToCardCategories = async (req: Request, res: Response) => {
  const { cardId, cardCategoryIds } = req.body;

  if (typeof cardId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  if (
    !Array.isArray(cardCategoryIds) ||
    !cardCategoryIds.every((id) => typeof id === "string")
  ) {
    throw new AppError(400, "cardCategoryIds must be an array of strings");
  }

  const cardCardCategory = await CardService.addCardToCardCategories(
    cardId,
    cardCategoryIds,
  );
  res.status(200).json(cardCardCategory);
};

router.post("/create", createCard);
router.get("/:cardId", getCard);
router.post("/categories/create", createCardCategory);
router.get("/categories/:cardCategoryId", getCardCategory);
router.post("/add-to-category", addCardToCardCategories);

export default router;
