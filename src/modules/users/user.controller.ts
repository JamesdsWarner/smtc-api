import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import * as UserService from "./user.service.ts";
import { AppError } from "../../shared/errors/AppError.ts";

const router = Router();

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;

  if (!name) {
    throw new AppError(400, "Missing name field");
  }

  const user = await UserService.createUser(name);
  res.json(user);
};

const getUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (typeof userId !== "string") {
    throw new AppError(400, "Invalid or missing ID");
  }

  const user = await UserService.getUser(userId);
  res.json(user);
};

router.post("/create", createUser);
router.get("/:userId", getUser);

export default router;
