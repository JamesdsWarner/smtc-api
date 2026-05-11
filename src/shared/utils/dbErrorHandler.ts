import { AppError } from "../errors/AppError.ts";

const PG_ERROR_MAP: Record<string, string> = {
  "23505": "already exists",
  "23503": "references a record that does not exist",
  "23502": "is missing a required value",
  "23514": "has an invalid value for one of its fields", // Add this!
};

export const handleDbError = (err: any, entityName: string): never => {
  const messageSuffix = PG_ERROR_MAP[err?.code];

  if (messageSuffix) {
    throw new AppError(400, `${entityName} ${messageSuffix}`);
  }

  // 1. Log the full error to your console so you can debug the "unknown" code
  console.error(`--- Unexpected DB Error [${entityName}] ---`);
  console.error(`Code: ${err?.code}`);
  console.error(`Message: ${err?.message}`);
  console.error(`------------------------------------------`);

  // 2. Wrap the unknown error in a generic 500 AppError
  // This prevents the raw error from crashing your app
  throw new AppError(
    500,
    `A database error occurred while processing ${entityName}.`,
  );
};
