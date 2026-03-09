import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from 'pg';
const { Pool } = pg;

import { getDeepSeek } from "./src/lib/deepseek";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Resilient Database Pool (lazy, never crashes server) ─────────────────────
let pool: InstanceType<typeof Pool> | null = null;

const getPool = () => {
  if (!pool && process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
      });
      pool.on('error', (err: Error) => {
        console.error('DB pool error (non-fatal):', err.message);
        pool = null; // reset so next call re-creates it
      });
    } catch (e: any) {
      console.error('DB pool creation failed (non-fatal):', e.message);
      pool = null;
    }
  }
  return pool;
};

const dbQuery = async (sql: string, params?: any[]) => {
  const p = getPool();
  if (!p) throw new Error("No database connection");
  return p.query(sql, params);
};

// ─── SSE Clients ───────────────────────────────────────────────────────────────
let sseClients: any[] = [];

const app = express();
app.use(express.json());

// ─── Health Check (always 200, even if DB is down) ────────────────────────────
app.get("/api/health", async (_req, res) => {
  let dbStatus = "not_configured";
  if (process.env.DATABASE_URL) {
    try {
      await dbQuery('SELECT NOW()');
      dbStatus = "connected";
    } catch (e: any) {
      dbStatus = `error: ${e.message}`;
    }
  }
  const aiConfigured = !!(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'sk_xxx');
  res.json({
    status: "ok",
    db: dbStatus,
    ai: aiConfigured ? "configured" : "missing_api_key",
    timestamp: new Date().toISOString()
  });
});

// ─── SSE Endpoint ─────────────────────────────────────────────────────────────
app.get("/api/events/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  sseClients.push({ id: clientId, res });
  req.on("close", () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

const broadcastEvent = (data: any) => {
  sseClients.forEach(client => {
    try { client.res.write(`data: ${JSON.stringify(data)}\n\n`); }
    catch (e) { /* client disconnected */ }
  });
};

// ─── Match Events API ─────────────────────────────────────────────────────────
app.post("/api/events", async (req, res) => {
  const event = req.body;
  broadcastEvent(event); // always broadcast via SSE

  // Persist if DB is available (non-blocking for response)
  res.status(201).json({ status: "ok" });

  try {
    await dbQuery(
      'INSERT INTO events (data, created_at) VALUES ($1, NOW())',
      [JSON.stringify(event)]
    );
  } catch (err: any) {
    console.error("DB persist error (non-fatal):", err.message);
  }

  // Proactive AI Coach Triggers (Non-blocking)
  if (["TOV", "PF", "OREB", "AST"].includes(event.type) && event.matchId) {
    (async () => {
      try {
        let count = 1;
        try {
          const result = await dbQuery(
            "SELECT data FROM events WHERE data::text LIKE $1",
            [`%"matchId":"${event.matchId}"%`]
          );
          count = result.rows.filter((row: any) => {
            const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            return d.type === event.type && d.team === event.team;
          }).length;
        } catch (_) { /* DB unavailable, skip count */ }

        const deepSeek = getDeepSeek();
        const aiSystem = "You are an expert basketball coach AI. Respond in 1 brief sentence.";
        let aiPrompt: string | null = null;

        if (event.type === 'TOV' && count >= 10 && count % 5 === 0)
          aiPrompt = `Team ${event.team} committed ${count} turnovers. Suggest slowing offense and improving passing.`;
        else if (event.type === 'PF' && count >= 10 && count % 5 === 0)
          aiPrompt = `Team ${event.team} committed ${count} fouls. Suggest a defensive adjustment.`;
        else if (event.type === 'OREB' && count >= 8 && count % 4 === 0)
          aiPrompt = `Team ${event.team} grabbed ${count} offensive rebounds. Suggest the opponent needs stronger box-out.`;
        else if (event.type === 'AST' && count >= 15 && count % 5 === 0)
          aiPrompt = `Team ${event.team} has ${count} assists. Acknowledge the excellent ball movement.`;

        if (aiPrompt) {
          const response = await deepSeek.requestCompletion(aiPrompt, aiSystem);
          broadcastEvent({ type: "AI_SUGGESTION", message: response, team: event.team });
        }
      } catch (e: any) {
        console.error("Proactive AI trigger error (non-fatal):", e.message);
      }
    })();
  }
});

// ─── AI Analyst API ───────────────────────────────────────────────────────────
app.post("/api/ia/analyze", async (req, res) => {
  const { prompt, mode, matchData } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const deepSeek = getDeepSeek();

    let systemPrompt = "You are HoopsAI, a professional basketball tactical analyst. Answer in the same language as the user.";
    if (mode === "support") {
      systemPrompt = "You are HoopsAI Support. Help users learn how to use the app: recording matches, exporting data, managing rosters.";
    }

    const contextPrompt = matchData && Object.keys(matchData).length > 0
      ? `Match Context: ${JSON.stringify(matchData)}\n\nUser Question: ${prompt}`
      : prompt;

    const response = await deepSeek.requestCompletion(contextPrompt, systemPrompt);
    return res.json(response);
  } catch (error: any) {
    console.error("AI Error:", error.message);
    return res.status(500).json({
      error: "Failed to get AI response",
      message: error.message,
      hint: process.env.DEEPSEEK_API_KEY === 'sk_xxx'
        ? "DEEPSEEK_API_KEY is still the placeholder value. Update it in Vercel → Settings → Environment Variables."
        : "Check your DEEPSEEK_API_KEY in Vercel environment variables."
    });
  }
});

// ─── Production Static Files ───────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// ─── Local Dev Server ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
