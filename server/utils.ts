import { randomBytes } from "crypto";

export function generateId(): string {
  return randomBytes(16).toString("hex");
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "");
}