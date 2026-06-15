import express, { Router } from "express";
const app = express();
const port = 3000;
import cors from "cors"; // 1. Added CORS import
import userRouter from "./modules/users/user.controller.ts";
import sessionRouter from "./modules/sessions/session.controller.ts";
import cardRouter from "./modules/cards/card.controller.ts";
import gameModeRouter from "./modules/gameModes/gameMode.controller.ts";
import { errorHandler } from "./shared/middleware/errorHandler.ts";
import winston from "winston";
import expressWinston from "express-winston";

// 2. Enable CORS with explicit allowances for your Vite client
app.use(
  cors({
    origin: "http://localhost:5173", // Allows your React application
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "x-user-id"], // Allows the custom host-verification header
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
    ),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) {
      return false;
    }, // optional: allows to skip some log messages based on request and/or response
  }),
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/cards", cardRouter);
app.use("/api/game-modes", gameModeRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
