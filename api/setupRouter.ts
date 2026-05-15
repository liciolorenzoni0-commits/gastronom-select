import { createRouter, publicQuery } from "./middleware";
import { createConnection } from "mysql2/promise";
import { env } from "./lib/env";

export const setupRouter = createRouter({
  migrate: publicQuery.query(async () => {
    // Use a DIRECT connection (not Drizzle pool) for DDL operations
    // Drizzle pool corrupts connections after DROP/CREATE
    const conn = await createConnection(env.databaseUrl);
    const results: string[] = [];

    try {
      await conn.execute("SET FOREIGN_KEY_CHECKS = 0");

      // Step 1: Check current columns before drop
      try {
        const [cols] = await conn.execute("SHOW COLUMNS FROM job_postings");
        const colList = (cols as any[]).map((c) => `${c.Field}=${c.Type}`).join(", ");
        results.push("BEFORE: " + colList);
      } catch {
        results.push("BEFORE: table does not exist");
      }

      // Step 2: Drop the corrupted table
      await conn.execute("DROP TABLE IF EXISTS job_postings");
      results.push("Table dropped");

      // Step 3: Recreate with TEXT columns (never JSON)
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
      results.push("Table created with TEXT columns");

      // Step 4: Verify new columns
      const [newCols] = await conn.execute("SHOW COLUMNS FROM job_postings");
      const newColList = (newCols as any[]).map((c) => `${c.Field}=${c.Type}`).join(", ");
      results.push("AFTER: " + newColList);

      // Step 5: Test INSERT with mysql2 direct
      await conn.execute(
        "INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (?, ?, ?, ?, ?)",
        ["Migration Test", "chef", '["skill1","skill2"]', 5, "Test after migration"]
      );
      results.push("Direct INSERT: OK");

      // Clean up test row
      await conn.execute("DELETE FROM job_postings WHERE title = 'Migration Test'");

      await conn.execute("SET FOREIGN_KEY_CHECKS = 1");

      return {
        success: true,
        message: "Base de datos actualizada. Ahora puedes crear puestos.",
        details: results,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message,
        code: e.code,
        errno: e.errno,
        sqlState: e.sqlState,
        details: results,
      };
    } finally {
      await conn.end();
    }
  }),
});
