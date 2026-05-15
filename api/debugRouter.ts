import { createRouter, publicQuery } from "./middleware";
import { env } from "./lib/env";
import mysql from "mysql2/promise";

// Helper: get a raw connection from the pool (Drizzle pool, already working)
async function getRawConnection() {
  const pool = mysql.createPool(env.databaseUrl + "?connectionLimit=1");
  const connection = await pool.getConnection();
  return { connection, pool };
}

export const debugRouter = createRouter({
  check: publicQuery.query(async () => {
    const results: Record<string, string> = {};
    let connection: any = null;
    let pool: any = null;

    try {
      ({ connection, pool } = await getRawConnection());

      // 1. Check columns
      try {
        const [cols] = await connection.execute("SHOW COLUMNS FROM job_postings");
        results.columns = (cols as any[]).map((c: any) => `${c.Field}=${c.Type}`).join(", ");
      } catch (e: any) {
        results.columns = "ERROR: " + (e.message || "unknown");
      }

      // 2. Count rows
      try {
        const [rows] = await connection.execute("SELECT COUNT(*) as cnt FROM job_postings");
        results.rowCount = String((rows as any[])[0]?.cnt ?? -1);
      } catch (e: any) {
        results.rowCount = "ERROR: " + (e.message || "unknown");
      }

      // 3. Test INSERT with raw mysql2
      try {
        await connection.execute(
          "INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (?, ?, ?, ?, ?)",
          ["Direct Test", "chef", "[]", 1, "Direct"]
        );
        results.insertTest = "OK";
        await connection.execute("DELETE FROM job_postings WHERE title = 'Direct Test'");
      } catch (e: any) {
        results.insertTest = "FAILED: " + (e.message || "no message") + " errno=" + (e.errno || "?");
      }

      connection.release();
      await pool.end();

      return results;
    } catch (e: any) {
      return { fatal: e.message || "unknown fatal error", stack: e.stack || "no stack" };
    } finally {
      if (connection) try { connection.release(); } catch {}
      if (pool) try { pool.end(); } catch {}
    }
  }),

  fix: publicQuery.query(async () => {
    const results: string[] = [];
    let connection: any = null;
    let pool: any = null;

    try {
      ({ connection, pool } = await getRawConnection());

      // Check current columns before
      try {
        const [cols] = await connection.execute("SHOW COLUMNS FROM job_postings");
        const colList = (cols as any[]).map((c: any) => `${c.Field}=${c.Type}`).join(", ");
        results.push("BEFORE: " + colList);
      } catch {
        results.push("BEFORE: table missing");
      }

      // Recreate table
      await connection.execute("SET FOREIGN_KEY_CHECKS = 0");

      await connection.execute("DROP TABLE IF EXISTS job_postings");
      results.push("Dropped");

      await connection.execute(`
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
      const [newCols] = await connection.execute("SHOW COLUMNS FROM job_postings");
      const newColList = (newCols as any[]).map((c: any) => `${c.Field}=${c.Type}`).join(", ");
      results.push("AFTER: " + newColList);

      // Test insert
      await connection.execute(
        "INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (?, ?, ?, ?, ?)",
        ["Fix Test", "chef", "[]", 3, "Test"]
      );
      results.push("Insert OK");

      await connection.execute("DELETE FROM job_postings WHERE title = 'Fix Test'");
      await connection.execute("SET FOREIGN_KEY_CHECKS = 1");

      connection.release();
      await pool.end();

      return { status: "fixed", details: results };
    } catch (e: any) {
      results.push("ERROR: " + (e.message || "unknown") + " errno=" + (e.errno || "?"));
      return { status: "error", message: e.message || "", errno: e.errno, details: results };
    } finally {
      if (connection) try { connection.release(); } catch {}
      if (pool) try { pool.end(); } catch {}
    }
  }),
});
