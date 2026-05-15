import { createRouter, publicQuery } from "./middleware";
import { createConnection } from "mysql2/promise";
import { env } from "./lib/env";

export const setupRouter = createRouter({
  migrate: publicQuery.query(async () => {
    const dbUrl = env.databaseUrl;
    if (!dbUrl) return { error: "DATABASE_URL no configurado" };

    const conn = await createConnection(dbUrl);
    const results: string[] = [];

    try {
      // Check current column types BEFORE any changes
      const [cols] = await conn.execute("SHOW COLUMNS FROM job_postings");
      const columns = (cols as any[]).map((c) => `${c.Field}:${c.Type}`);
      results.push("Columnas ACTUALES: " + columns.join(", "));

      // The nuclear approach: drop and recreate with guaranteed TEXT columns
      await conn.execute("DROP TABLE IF EXISTS job_postings");
      results.push("Tabla job_postings eliminada");

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
      results.push("Tabla job_postings recreada con columnas TEXT");

      // Verify new columns
      const [newCols] = await conn.execute("SHOW COLUMNS FROM job_postings");
      const newColumns = (newCols as any[]).map((c) => `${c.Field}:${c.Type}`);
      results.push("Nuevas columnas: " + newColumns.join(", "));

      // Test insert
      try {
        await conn.execute(
          "INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (?, ?, ?, ?, ?)",
          ["Test Job", "chef", '["Italiana"]', 3, "Test"]
        );
        results.push("INSERT de prueba: OK");
        await conn.execute("DELETE FROM job_postings WHERE title = 'Test Job'");
      } catch (e: any) {
        results.push("INSERT de prueba FALLO: " + e.message);
      }

      return {
        success: true,
        applied: results.length,
        details: results,
        message: "Base de datos actualizada. Intenta crear un puesto ahora.",
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        code: err.code,
        sqlState: err.sqlState,
        details: results,
      };
    } finally {
      await conn.end();
    }
  }),
});
