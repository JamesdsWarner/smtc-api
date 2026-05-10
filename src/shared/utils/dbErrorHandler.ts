import { AppError } from "../errors/AppError.ts";

const PG_ERROR_MAP: Record<string, string> = {
  "23505": "already exists",
  "23503": "references a record that does not exist",
  "23502": "is missing a required value",
};

export const handleDbError = (err: any, entityName: string) => {
  const messageSuffix = PG_ERROR_MAP[err.code];

  if (messageSuffix) {
    // e.g., "Card prompt already exists"
    throw new AppError(400, `${entityName} ${messageSuffix}`);
  }

  // If it's not one of our "Big Three", it's a real system error
  console.error(`Unexpected Database Error [${entityName}]:`, err);
  throw err; // Controller catches this and sends a 500
};
