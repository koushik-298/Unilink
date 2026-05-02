const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { z } = require("zod");

const { connectDb } = require("./db");
const { clientOrigin } = require("./config");
const { authRouter } = require("./routes/auth");
const { meRouter } = require("./routes/me");
const { profilesRouter } = require("./routes/profiles");
const { postsRouter } = require("./routes/posts");
const { eventsRouter } = require("./routes/events");
const { groupsRouter } = require("./routes/groups");
const { connectionsRouter } = require("./routes/connections");
const { adminRouter } = require("./routes/admin");
const { userRouter } = require("./routes/user");

function createServer() {
  const app = express();

  // ── Body / logging middleware ────────────────────────────────────────────────
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);

        const allowedFromEnv = clientOrigin
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const isLocalVite =
          /^http:\/\/localhost:51\d{2}$/.test(origin) || /^http:\/\/127\.0\.0\.1:51\d{2}$/.test(origin);

        if (allowedFromEnv.includes(origin) || isLocalVite) return cb(null, true);
        return cb(new Error("CORS blocked"), false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" })); // parse JSON request bodies
  app.use(morgan("dev")); // HTTP request logger

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "unilink-api" });
  });

  // ── API Routes ────────────────────────────────────────────────────────────────
  app.use("/api/auth", authRouter);
  app.use("/api/me", meRouter);
  app.use("/api/profiles", profilesRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/groups", groupsRouter);
  app.use("/api/connections", connectionsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/user", userRouter);

  // ── Error handler ─────────────────────────────────────────────────────────────
  app.use((err, _req, res, _next) => {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        issues: err.issues?.map((i) => ({
          path: i.path?.join("."),
          message: i.message,
        })),
      });
    }
    const status = typeof err?.status === "number" ? err.status : 500;
    const message =
      status >= 500 ? "Internal server error" : err?.message || "Request error";
    res.status(status).json({ error: message });
  });

  return { app, connectDb };
}

module.exports = { createServer };

