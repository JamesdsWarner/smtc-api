import express, { Router } from "express";
const app = express();
const port = 3000;
import userRouter from "./modules/users/user.controller.ts";
import sessionRouter from "./modules/sessions/session.controller.ts";
import cardRouter from "./modules/cards/cards.controller.ts";
import { errorHandler } from "./shared/middleware/errorHandler.ts";
import winston from "winston";
import expressWinston from "express-winston";

app.get("/", (req, res) => {
  res.send("Hello World!");
});

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

app.use("/api/users", userRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/cards", cardRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use(errorHandler);
