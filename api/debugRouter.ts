import { createRouter, publicQuery } from "./middleware";
import { createConnection } from "mysql2/promise";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { jobPostings } from "@db/schema";

export const debugRouter = createRouter({
  // Check current state of the table
  check: publicQuery.query(async () => {
    // Use direct connection for SHOW COLUMNS (works fine)
    const conn = await createConnection(env.databaseUrl);
    const results: Record<string, string> = {};

    try {
      // 1. Check columns
      try {
        const [cols] = await conn.execute("SHOW COLUMNS FROM job_postings");
        results.columns = (cols as any[]).map((c) => `${c.Field}=${c.Type}`).join(", ");
      } catch (e: any) {
        results.columns = "ERROR: " + e.message;
      }

      // 2. Count rows
      try {
        const [rows] = await conn.execute("SELECT COUNT(*) as cnt FROM job_postings");
        results.rowCount = String((rows as any[])[0].cnt);
      } catch (e: any) {
        results.rowCount = "ERROR: " + e.message;
      }

      // 3. Test direct INSERT with mysql2
      try {
        await conn.execute(
          "INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (?, ?, ?, ?, ?)",
          ["Direct Test", "chef", "[]", 1, "Direct"]
        );
        results.directInsert = "OK";
        await conn.execute("DELETE FROM job_postings WHERE title = 'Direct Test'");
      } catch (e: any) {
        results.directInsert = "FAILED: " + e.message + " (errno=" + e.errno + ")";
      }

      // 4. Test Drizzle ORM INSERT (uses pool)
      try {
        const db = getDb();
        await db.insert(jobPostings).values({
          title: "ORM Test",
          role: "chef" as any,
          requiredSkills: "[]",
          requiredYears: 1,
          description: "ORM",
        }).$returningId();
        results.ormInsert = "OK";
        await conn.execute("DELETE FROM job_postings WHERE title = 'ORM Test'");
      } catch (e: any) {
        results.ormInsert = "FAILED: " + e.message + " (errno=" + e.errno + ")";
      }

      return results;
    } catch (e: any) {
      return { fatal: e.message };
    } finally {
      await conn.end();
    }
  }),

  // Fix: recreate table using direct connection (never the Drizzle pool)
  fix: publicQuery.query(async () => {
    const conn = await createConnection(env.databaseUrl);
    const results: string[] = [];

    try {
      await conn.execute("SET FOREIGN_KEY_CHECKS = 0");

      // Drop corrupted table
      await conn.execute("DROP TABLE IF EXISTS job_postings");
      results.push("Dropped");

      // Recreate with TEXT columns and exact names Drizzle expects
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
      results.push("Created with TEXT");

      // Verify
      const [cols] = await conn.execute("SHOW COLUMNS FROM job_postings");
      const colList = (cols as any[]).map((c) => `${c.Field}=${c.Type}`).join(", ");
      results.push("Columns: " + colList);

      // Test insert
      await conn.execute(
        "INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (?, ?, ?, ?, ?)",
        ["Fix Test", "chef", "[]", 3, "Test"]
      );
      results.push("Insert OK");
      await conn.execute("DELETE FROM job_postings WHERE title = 'Fix Test'");

      await conn.execute("SET FOREIGN_KEY_CHECKS = 1");

      return { status: "fixed", details: results };
    } catch (e: any) {
      return { status: "error", message: e.message, errno: e.errno, details: results };
    } finally {
      await conn.end();
    }
  }),
});
