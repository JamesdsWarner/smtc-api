import express, { Router } from "express";
const app = express();
const port = 3000;
import userRouter from "./modules/users/user.controller.ts";

export const router = Router();
router.use(userRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(express.json());

app.use("/api/users", router);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
