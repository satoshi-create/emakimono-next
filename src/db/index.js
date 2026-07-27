import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

let db;

/** @returns {boolean} */
export function isDbConfigured() {
  return Boolean(process.env.TURSO_DATABASE_URL);
}

export function getDb() {
  if (db) {
    return db;
  }

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is not configured");
  }

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  db = drizzle(client, { schema });
  return db;
}
