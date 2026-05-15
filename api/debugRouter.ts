import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sql } from "drizzle-orm";

export const debugRouter = createRouter({
  // Check: use Drizzle db.execute (already working)
  check: publicQuery.query(async () => {
    try {
      const db = getDb();
      const results: Record<string, string> = {};

      // 1. Check columns
      try {
        const rows = await db.execute(sql`SHOW COLUMNS FROM job_postings`);
        results.columns = ((rows[0] as unknown) as any[]).map((c: any) => `${c.Field}=${c.Type}`).join(", ");
      } catch (e: any) {
        results.columns = "ERROR: " + e.message;
      }

      // 2. Count rows
      try {
        const rows = await db.execute(sql`SELECT COUNT(*) as cnt FROM job_postings`);
        results.rowCount = String(((rows[0] as unknown) as any[])[0]?.cnt ?? -1);
      } catch (e: any) {
        results.rowCount = "ERROR: " + e.message;
      }

      return results;
    } catch (e: any) {
      return { fatal: e.message, code: e.code, errno: e.errno };
    }
  }),

  // Fix: use Drizzle TRANSACTION to get exclusive connection
  fix: publicQuery.query(async () => {
    const db = getDb();
    const results: string[] = [];

    try {
      // Use transaction - this gives us an exclusive connection from the pool
      await db.transaction(async (tx) => {
        // Check before
        try {
          const before = await tx.execute(sql`SHOW COLUMNS FROM job_postings`);
          const colList = ((before[0] as unknown) as any[]).map((c: any) => `${c.Field}=${c.Type}`).join(", ");
          results.push("BEFORE: " + colList);
        } catch {
          results.push("BEFORE: table missing");
        }

        // Disable FK checks within transaction
        await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

        // Drop and recreate
        await tx.execute(sql`DROP TABLE IF EXISTS job_postings`);
        results.push("Dropped");

        await tx.execute(sql`
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
        results.push("Created with TEXT columns");

        // Verify
        const after = await tx.execute(sql`SHOW COLUMNS FROM job_postings`);
        const newColList = ((after[0] as unknown) as any[]).map((c: any) => `${c.Field}=${c.Type}`).join(", ");
        results.push("AFTER: " + newColList);

        // Test insert within same transaction
        await tx.execute(sql`INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES ('FixTest', 'chef', '[]', 3, 'Test')`);
        results.push("Insert test OK");
        await tx.execute(sql`DELETE FROM job_postings WHERE title = 'FixTest'`);

        await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);

        // Transaction will auto-commit
      });

      return { status: "fixed", details: results };
    } catch (e: any) {
      return { status: "error", message: e.message, code: e.code, errno: e.errno, details: results || [] };
    }
  }),
});
