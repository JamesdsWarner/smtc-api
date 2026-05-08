import { type Request, type Response, Router } from "express";
import * as UserService from "./user.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";

const router = Router();

const createUser = async (req: Request, res: Response) => {
  const { name, plainPin } = req.body;

  if (!name || !plainPin) {
    throw new AppError(400, "Missing fields");
  }

  const user = await UserService.createUser(name, plainPin);
  res.json(user);
};

const getUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { plainPin } = req.body;

  if (typeof userId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  if (!plainPin || typeof plainPin !== "string") {
    throw new AppError(400, "Pin is required");
  }

  const user = await UserService.getUser(userId, plainPin);
  res.json(user);
};

router.post("/create", createUser);
router.get("/:userId", getUser);

export default router;
