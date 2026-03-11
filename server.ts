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

// ─── Subscriptions (Stripe Checkout Placeholder) ─────────────────────────────
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { countryCode } = req.body;
    console.log(`Checkout requested for region: ${countryCode}`);
    res.json({
      url: "https://billing.stripe.com/p/login/test_dummy"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
        let matchEvents: any[] = [event];
        try {
          const result = await dbQuery(
            "SELECT data FROM events WHERE data::text LIKE $1 ORDER BY created_at DESC LIMIT 50",
            [`%"matchId":"${event.matchId}"%`]
          );
          if (result.rows.length > 0) {
            matchEvents = result.rows.map((row: any) => typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
          }
        } catch (_) { /* DB unavailable */ }

        const deepSeek = getDeepSeek();
        const aiSystem = "You are an expert professional basketball coach assistant. Respond in 1 brief, highly actionable sentence in the same language as the user.";
        let aiPrompt: string | null = null;

        const teamEvents = matchEvents.filter(e => e.team === event.team);
        
        if (event.type === 'TOV') {
          // 3 turnovers in a row
          if (teamEvents.length >= 3) {
            const last3 = teamEvents.slice(0, 3);
            if (last3.every(e => e.type === 'TOV')) {
              aiPrompt = `The ${event.team} team just committed 3 turnovers in a row. Suggest slowing down the tempo and making safer passes.`;
            }
          }
        } else if (event.type === 'PF') {
          // 2 fouls in a quarter by Player X
          const playerFoulsInQuarter = matchEvents.filter(e => e.playerId === event.playerId && e.type === 'PF' && e.quarter === event.quarter).length;
          if (playerFoulsInQuarter === 2) {
             aiPrompt = `Player ${event.playerName || 'X'} has committed 2 fouls in quarter ${event.quarter}. Suggest substituting them immediately to avoid foul trouble.`;
          }
        } else if (event.type === 'OREB') {
          // Opponent gets 3 offensive rebounds (we evaluate the team getting the OREB)
          const orebCount = matchEvents.filter(e => e.team === event.team && e.type === 'OREB').length;
          if (orebCount > 0 && orebCount % 3 === 0) {
              aiPrompt = `The ${event.team} team has grabbed ${orebCount} offensive rebounds. Suggest to the opponent coach that they need to make adjustments to box out better.`;
          }
        } else if (event.type === 'AST') {
          const astCount = teamEvents.filter(e => e.type === 'AST').length;
          if (astCount > 0 && astCount % 5 === 0) {
            aiPrompt = `The ${event.team} team has ${astCount} assists. Acknowledge the excellent ball movement.`;
          }
        }

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

    let systemPrompt = "You are HoopsAI, a professional basketball tactical analyst. Provide professional, data-driven insights based on the match events provided. Answer in the same language as the user. If asked 'why did we lose' or similar, analyze turnovers (TOV), rebounds (REB), and shooting efficiency.";
    if (mode === "support") {
      systemPrompt = "You are HoopsAI Support. Help users learn how to use the app: recording matches, exporting data, managing rosters. Answer in the same language as the user.";
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

// ─── AI Game Analysis API ────────────────────────────────────────────────────────
app.post("/api/ia/game-report", async (req, res) => {
  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ error: "matchId is required" });

  try {
    let matchEvents: any[] = [];
    try {
      const result = await dbQuery(
        "SELECT data FROM events WHERE data::text LIKE $1 ORDER BY created_at ASC",
        [`%"matchId":"${matchId}"%`]
      );
      matchEvents = result.rows.map((row: any) => typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
    } catch (_) { /* DB unavailable */ }

    if (matchEvents.length === 0) {
      return res.status(404).json({ error: "No events found for this match" });
    }

    const deepSeek = getDeepSeek();
    const systemPrompt = "You are HoopsAI, a professional basketball tactical analyst. Analyze the provided match events chronologically and generate a deep tactical report highlighting key turning points, defensive weaknesses, offensive strengths, and player performances. Use markdown formatting with bold headers and bullet points. Answer in the same language as the user.";

    const contextPrompt = `Please analyze the following match events:\n${JSON.stringify(matchEvents)}`;
    
    const response = await deepSeek.requestCompletion(contextPrompt, systemPrompt);
    return res.json({ report: response });
  } catch (error: any) {
    console.error("AI Game Report Error:", error.message);
    return res.status(500).json({ error: "Failed to generate AI game report" });
  }
});

// ─── AI Predictive Analytics API ────────────────────────────────────────────────
app.post("/api/ia/predict", async (req, res) => {
  const { playerStats } = req.body;
  if (!playerStats) return res.status(400).json({ error: "playerStats is required" });

  try {
    const deepSeek = getDeepSeek();
    const systemPrompt = "You are HoopsAI, an elite basketball scout and predictive analyst. Based on the provided player statistics across recorded games, predict their future performance (expected points, rebounds, assists), identify their primary tactical value, and warn about any potential risks (e.g., foul trouble, turnovers). Use clear markdown formatting with bullet points. Answer in the same language as the user.";

    const contextPrompt = `Please analyze the following player data and provide a concise prediction report:\n${JSON.stringify(playerStats)}`;
    
    const response = await deepSeek.requestCompletion(contextPrompt, systemPrompt);
    return res.json({ prediction: response });
  } catch (error: any) {
    console.error("AI Prediction Error:", error.message);
    return res.status(500).json({ error: "Failed to generate AI prediction" });
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
