import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import mysql from "mysql2/promise";

// ---- Startup migration: verify/fix job_postings table ----
// This runs ONCE at server startup with a fresh direct connection
// before Drizzle creates its pool.
async function startupMigration() {
  if (!env.databaseUrl) {
    console.log("[startup] No DATABASE_URL, skipping migration");
    return;
  }

  let connection: mysql.Connection | null = null;
  try {
    console.log("[startup] Checking database...");
    connection = await mysql.createConnection(env.databaseUrl);

    // Check if job_postings exists and has correct columns
    try {
      const [cols] = await connection.execute("SHOW COLUMNS FROM job_postings");
      const columns = (cols as any[]).map((c) => ({ name: c.Field, type: c.Type }));
      console.log("[startup] job_postings columns:", JSON.stringify(columns));

      // Check if requiredSkills is TEXT (not JSON)
      const skillsCol = columns.find((c) => c.name === "requiredSkills");
      if (skillsCol && skillsCol.type.toLowerCase().includes("json")) {
        console.log("[startup] requiredSkills is JSON, recreating table...");
        throw new Error("recreate"); // trigger recreation below
      }

      console.log("[startup] Table OK");
    } catch (e: any) {
      if (e.message === "recreate" || e.message.includes("doesn't exist")) {
        console.log("[startup] Recreating job_postings...");
        await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
        await connection.execute("DROP TABLE IF EXISTS job_postings");
        await connection.execute(`
          CREATE TABLE job_postings (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            \`role\` ENUM('chef','sous_chef','manager','waiter','bartender','host') NOT NULL,
            \`requiredSkills\` TEXT DEFAULT '[]',
            \`requiredYears\` INT,
            \`description\` TEXT,
            \`isActive\` TINYINT(1) DEFAULT 1,
            \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
        console.log("[startup] job_postings recreated successfully");
      } else {
        console.log("[startup] SHOW COLUMNS error:", e.message);
      }
    }

    await connection.end();
  } catch (e: any) {
    console.error("[startup] Migration error:", e.message);
    if (connection) await connection.end().catch(() => {});
  }
}

// Run migration before creating the app
await startupMigration();
// --------------------------------------------------------

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
