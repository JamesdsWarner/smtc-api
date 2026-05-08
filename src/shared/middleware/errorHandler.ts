import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../errors/AppError.ts";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Fallback for unexpected crashes (500)
  console.error("💥 Unexpected Error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};
