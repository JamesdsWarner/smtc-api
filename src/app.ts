import express, { Router } from "express";
const app = express();
const port = 3000;
import userRouter from "./modules/users/user.controller.ts";
import sessionRouter from "./modules/sessions/session.controller.ts";

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/sessions", sessionRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
