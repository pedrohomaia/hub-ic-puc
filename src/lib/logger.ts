// src/lib/logger.ts
type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getLevel(): Level {
  const v = process.env.LOG_LEVEL?.toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function canLog(level: Level) {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[getLevel()];
}

function safe(meta?: Record<string, unknown>) {
  if (!meta) return undefined;

  const m: Record<string, unknown> = { ...meta };

  if (typeof m.token === "string") m.token = "[redacted]";
  if (typeof m.email === "string") m.email = "[redacted]";

  return m;
}

export const logger = {
  info(tag: string, msg: string, meta?: Record<string, unknown>) {
    if (canLog("info")) console.log(`[${tag}] ${msg}`, safe(meta) ?? "");
  },
  warn(tag: string, msg: string, meta?: Record<string, unknown>) {
    if (canLog("warn")) console.warn(`[${tag}] ${msg}`, safe(meta) ?? "");
  },
  error(tag: string, msg: string, meta?: Record<string, unknown>) {
    if (canLog("error")) console.error(`[${tag}] ${msg}`, safe(meta) ?? "");
  },
};
