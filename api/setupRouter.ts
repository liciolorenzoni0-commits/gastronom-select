import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { jobPostings } from "@db/schema";
import { sql } from "drizzle-orm";

export const setupRouter = createRouter({
  migrate: publicQuery.query(async () => {
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

      // Test insert with correct Drizzle method
      let testResult = "pending";
      try {
        await db.insert(jobPostings).values({
          title: "Setup Test",
          role: "chef" as any,
          requiredSkills: '["test"]',
          requiredYears: 3,
          description: "Setup test",
        }).$returningId();
        testResult = "OK";
        await db.execute(sql`DELETE FROM job_postings WHERE title = 'Setup Test'`);
      } catch (e: any) {
        testResult = "FAILED: " + e.message;
      }

      return {
        success: true,
        message: "Tabla job_postings recreada.",
        testResult,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message,
      };
    }
  }),
});
