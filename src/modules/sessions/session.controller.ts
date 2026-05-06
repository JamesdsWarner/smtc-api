import { type Request, type Response, Router } from "express";
import * as SessionService from "./session.service.ts";

const router = Router();

const createSession = async (req: Request, res: Response) => {
  const { name, hostPlayer } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Missing name field" });
  }

  if (!hostPlayer) {
    return res.status(400).json({ error: "Missing hostplayer field" });
  }

  const session = await SessionService.createSession(name, hostPlayer);
  res.json(session);
};

const getSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (typeof sessionId !== "string") {
    return res.status(400).json({ error: "Invalid or missing ID" });
  }

  const user = await SessionService.getSession(sessionId);
  res.json(user);
};

router.post("/create", createSession);
router.get("/:sessionId", getSession);

export default router;
