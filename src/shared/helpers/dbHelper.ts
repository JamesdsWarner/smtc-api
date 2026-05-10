import fs from "fs/promises";

/**
 * A generic function to read and parse a JSON database file.
 * @template T - The expected shape of the data (e.g., Card[] or User[])
 * @param path - The string path to the JSON file
 */
export const readDB = async <T>(path: string): Promise<T> => {
  const data = await fs.readFile(path, "utf-8");
  return JSON.parse(data) as T;
};

/**
 * A generic function to stringify and write data to a JSON file.
 * @template T - The type of data being written
 * @param path - The destination file path
 * @param data - The data to be saved
 */
export const writeDB = async <T>(path: string, data: T): Promise<void> => {
  await fs.writeFile(path, JSON.stringify(data, null, 2));
};
