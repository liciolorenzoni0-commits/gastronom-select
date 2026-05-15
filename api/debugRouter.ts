import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sql } from "drizzle-orm";

export const debugRouter = createRouter({
  check: publicQuery.query(async () => {
    try {
      const db = getDb();

      // Test 1: List columns
      let columns = "unknown";
      try {
        const rows = await db.execute(sql`SHOW COLUMNS FROM job_postings`);
        columns = ((rows[0] as unknown) as any[]).map((c: any) => `${c.Field}=${c.Type}`).join(", ");
      } catch (e: any) {
        columns = "ERROR: " + e.message;
      }

      // Test 2: Count rows
      let rowCount = -1;
      try {
        const rows = await db.execute(sql`SELECT COUNT(*) as cnt FROM job_postings`);
        rowCount = ((rows[0] as unknown) as any[])[0].cnt;
      } catch (e: any) {
        rowCount = -999;
      }

      // Test 3: Try INSERT with db.insert (correct way)
      let ormInsert = "not tested";
      try {
        const { jobPostings } = await import("@db/schema");
        const result = await db.insert(jobPostings).values({
          title: "Debug Test",
          role: "chef" as any,
          requiredSkills: "[]",
          requiredYears: 1,
          description: "Debug",
        }).$returningId();
        ormInsert = "SUCCESS id=" + result[0].id;
        // Clean up
        await db.execute(sql`DELETE FROM job_postings WHERE title = 'Debug Test'`);
      } catch (e: any) {
        ormInsert = "FAILED: " + e.message + " (code=" + (e.code || "none") + ")";
      }

      return { columns, rowCount, ormInsert };
    } catch (e: any) {
      return { fatal: e.message };
    }
  }),

  fix: publicQuery.query(async () => {
    try {
      const db = getDb();

      // Drop and recreate
      await db.execute(sql`DROP TABLE IF EXISTS job_postings`);
      await db.execute(sql`
        CREATE TABLE job_postings (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          role ENUM('chef','sous_chef','manager','waiter','bartender','host') NOT NULL,
          requiredSkills TEXT,
          requiredYears INT,
          description TEXT,
          isActive TINYINT(1) DEFAULT 1,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);

      // Test insert
      let testResult = "pending";
      try {
        const { jobPostings } = await import("@db/schema");
        await db.insert(jobPostings).values({
          title: "Fix Test",
          role: "chef" as any,
          requiredSkills: '["test"]',
          requiredYears: 3,
          description: "Test",
        }).$returningId();
        testResult = "OK";
        await db.execute(sql`DELETE FROM job_postings WHERE title = 'Fix Test'`);
      } catch (e: any) {
        testResult = "FAILED: " + e.message;
      }

      return { status: "fixed", testResult };
    } catch (e: any) {
      return { status: "error", message: e.message };
    }
  }),
});
