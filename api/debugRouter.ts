import { createRouter, publicQuery } from "./middleware";
import { createConnection } from "mysql2/promise";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { sql } from "drizzle-orm";

export const debugRouter = createRouter({
  checkDb: publicQuery.query(async () => {
    const dbUrl = env.databaseUrl;
    if (!dbUrl) return { error: "DATABASE_URL no configurado" };

    const conn = await createConnection(dbUrl);
    const results: any = {};

    try {
      // 1. Show all columns
      const [cols] = await conn.execute("SHOW COLUMNS FROM job_postings");
      results.columns = (cols as any[]).map((c) => ({
        name: c.Field,
        type: c.Type,
        null: c.Null,
        default: c.Default,
      }));

      // 2. Try direct mysql2 insert
      try {
        const [r] = await conn.execute(
          "INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (?, ?, ?, ?, ?)",
          ["Test Direct", "chef", '["Test"]', 3, "Direct insert test"]
        );
        results.mysql2Insert = "SUCCESS, id=" + (r as any).insertId;
        await conn.execute("DELETE FROM job_postings WHERE title = 'Test Direct'");
      } catch (e: any) {
        results.mysql2Insert = `FAILED: ${e.message} (errno:${e.errno}, code:${e.code})`;
      }

      // 3. Try Drizzle sql insert
      try {
        const db = getDb();
        await db.execute(
          sql`INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (${"Test Drizzle"}, ${"chef"}, ${'["Test"]'}, ${3}, ${"Drizzle test"})`
        );
        results.drizzleInsert = "SUCCESS";
        await conn.execute("DELETE FROM job_postings WHERE title = 'Test Drizzle'");
      } catch (e: any) {
        results.drizzleInsert = `FAILED: ${e.message} (errno:${e.errno}, code:${e.code})`;
      }

      // 4. Try Drizzle ORM insert
      try {
        const db = getDb();
        // Import here to avoid circular dependency issues
        const { jobPostings } = await import("@db/schema");
        const r = await db.insert(jobPostings).values({
          title: "Test ORM",
          role: "chef" as any,
          requiredSkills: '["Test"]',
          requiredYears: 3,
          description: "ORM test",
        }).$returningId();
        results.ormInsert = "SUCCESS, id=" + r[0].id;
        await conn.execute("DELETE FROM job_postings WHERE title = 'Test ORM'");
      } catch (e: any) {
        results.ormInsert = `FAILED: ${e.message} (errno:${e.errno}, code:${e.code})`;
      }

      return results;
    } catch (e: any) {
      return { error: e.message };
    } finally {
      await conn.end();
    }
  }),

  // Full reset - drops and recreates all tables
  nuclearReset: publicQuery.query(async () => {
    const dbUrl = env.databaseUrl;
    if (!dbUrl) return { error: "DATABASE_URL no configurado" };

    const conn = await createConnection(dbUrl);
    const results: string[] = [];

    try {
      await conn.execute("SET FOREIGN_KEY_CHECKS = 0");

      await conn.execute("DROP TABLE IF EXISTS job_postings");
      results.push("job_postings dropped");

      await conn.execute(`
        CREATE TABLE job_postings (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          \`role\` ENUM('chef','sous_chef','manager','waiter','bartender','host') NOT NULL,
          \`requiredSkills\` TEXT,
          \`requiredYears\` INT,
          \`description\` TEXT,
          \`isActive\` TINYINT(1) DEFAULT 1,
          \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      results.push("job_postings recreated with TEXT");

      await conn.execute("SET FOREIGN_KEY_CHECKS = 1");

      return { success: true, details: results };
    } catch (e: any) {
      return { success: false, error: e.message, details: results };
    } finally {
      await conn.end();
    }
  }),
});
