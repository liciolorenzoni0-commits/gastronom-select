import { createRouter, publicQuery } from "./middleware";
import { createConnection } from "mysql2/promise";
import { env } from "./lib/env";

export const setupRouter = createRouter({
  migrate: publicQuery.query(async () => {
    const dbUrl = env.databaseUrl;
    if (!dbUrl) {
      throw new Error("DATABASE_URL no configurado");
    }

    const conn = await createConnection(dbUrl);
    const results: string[] = [];

    try {
      // 1. Create job_postings table if not exists
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS job_postings (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          role ENUM('chef','sous_chef','manager','waiter','bartender','host') NOT NULL,
          required_skills TEXT,
          required_years INT,
          description TEXT,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      results.push("Tabla 'job_postings' lista");

      // 2. Add cvText to candidates if not exists
      const [cvCols] = await conn.execute(
        "SHOW COLUMNS FROM candidates LIKE 'cvText'"
      );
      if ((cvCols as any[]).length === 0) {
        await conn.execute("ALTER TABLE candidates ADD COLUMN cvText TEXT");
        results.push("Columna 'cvText' agregada");
      }

      // 3. Add matchScore to candidates if not exists
      const [matchCols] = await conn.execute(
        "SHOW COLUMNS FROM candidates LIKE 'matchScore'"
      );
      if ((matchCols as any[]).length === 0) {
        await conn.execute("ALTER TABLE candidates ADD COLUMN matchScore INT");
        results.push("Columna 'matchScore' agregada");
      }

      // 4. Change candidates.tags from JSON to TEXT if needed
      try {
        await conn.execute("ALTER TABLE candidates MODIFY COLUMN tags TEXT");
        results.push("Columna 'tags' cambiada a TEXT");
      } catch {
        // may already be TEXT or doesn't exist, ignore
      }

      // 5. Change evaluations.clientToken if needed
      const [clientCols] = await conn.execute(
        "SHOW COLUMNS FROM evaluations LIKE 'clientToken'"
      );
      if ((clientCols as any[]).length === 0) {
        await conn.execute("ALTER TABLE evaluations ADD COLUMN clientToken VARCHAR(100)");
        results.push("Columna 'clientToken' agregada");
      }

      return {
        success: true,
        applied: results.length,
        details: results,
        message: "Base de datos actualizada correctamente.",
      };
    } finally {
      await conn.end();
    }
  }),
});
