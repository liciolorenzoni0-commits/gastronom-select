import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sql } from "drizzle-orm";

export const setupRouter = createRouter({
  migrate: publicQuery.query(async () => {
    const db = getDb();
    const results: string[] = [];

    try {
      await db.transaction(async (tx) => {
        // Check before
        try {
          const before = await tx.execute(sql`SHOW COLUMNS FROM job_postings`);
          const colList = ((before[0] as unknown) as any[]).map((c: any) => `${c.Field}=${c.Type}`).join(", ");
          results.push("BEFORE: " + colList);
        } catch {
          results.push("BEFORE: table missing");
        }

        await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

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
          )
        `);
        results.push("Created");

        const after = await tx.execute(sql`SHOW COLUMNS FROM job_postings`);
        const newList = ((after[0] as unknown) as any[]).map((c: any) => `${c.Field}=${c.Type}`).join(", ");
        results.push("AFTER: " + newList);

        await tx.execute(sql`INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES ('SetupTest', 'chef', '[]', 3, 'Test')`);
        results.push("Insert OK");
        await tx.execute(sql`DELETE FROM job_postings WHERE title = 'SetupTest'`);

        await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
      });

      return {
        success: true,
        message: "Base de datos actualizada.",
        details: results,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message,
        code: e.code,
        errno: e.errno,
        details: results || [],
      };
    }
  }),
});
