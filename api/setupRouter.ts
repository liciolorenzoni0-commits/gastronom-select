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
      // 1. DROP and recreate job_postings with EXACT column names Drizzle expects
      await conn.execute(`DROP TABLE IF EXISTS job_postings`);
      await conn.execute(`
        CREATE TABLE job_postings (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          role ENUM('chef','sous_chef','manager','waiter','bartender','host') NOT NULL,
          requiredSkills TEXT DEFAULT '[]',
          requiredYears INT,
          description TEXT,
          isActive TINYINT(1) DEFAULT 1,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      results.push("Tabla 'job_postings' recreada con columnas correctas");

      // 2. Fix candidates.tags - ensure it's TEXT not JSON
      try {
        await conn.execute(`ALTER TABLE candidates MODIFY COLUMN tags TEXT DEFAULT '[]'`);
        results.push("Columna 'tags' corregida a TEXT");
      } catch (e: any) {
        try {
          await conn.execute(`ALTER TABLE candidates ADD COLUMN tags TEXT DEFAULT '[]'`);
          results.push("Columna 'tags' creada como TEXT");
        } catch (e2: any) {
          results.push("tags: " + (e2.message || 'ok'));
        }
      }

      // 3. Add/fix cvText
      try {
        await conn.execute(`ALTER TABLE candidates MODIFY COLUMN cvText TEXT`);
        results.push("Columna 'cvText' corregida");
      } catch (e: any) {
        try {
          await conn.execute(`ALTER TABLE candidates ADD COLUMN cvText TEXT`);
          results.push("Columna 'cvText' agregada");
        } catch (e2: any) {
          results.push("cvText: " + (e2.message || 'ok'));
        }
      }

      // 4. Add/fix matchScore
      try {
        await conn.execute(`ALTER TABLE candidates MODIFY COLUMN matchScore INT`);
        results.push("Columna 'matchScore' corregida");
      } catch (e: any) {
        try {
          await conn.execute(`ALTER TABLE candidates ADD COLUMN matchScore INT`);
          results.push("Columna 'matchScore' agregada");
        } catch (e2: any) {
          results.push("matchScore: " + (e2.message || 'ok'));
        }
      }

      // 5. Fix ai_summaries.strengths
      try {
        await conn.execute(`ALTER TABLE ai_summaries MODIFY COLUMN strengths TEXT`);
        results.push("Columna 'strengths' corregida a TEXT");
      } catch (e: any) {
        results.push("strengths: " + (e.message || 'ok'));
      }

      // 6. Fix ai_summaries.concerns
      try {
        await conn.execute(`ALTER TABLE ai_summaries MODIFY COLUMN concerns TEXT`);
        results.push("Columna 'concerns' corregida a TEXT");
      } catch (e: any) {
        results.push("concerns: " + (e.message || 'ok'));
      }

      return {
        success: true,
        applied: results.length,
        details: results,
        message: "Base de datos actualizada. Ahora puedes crear puestos.",
      };
    } catch (err: any) {
      return {
        success: false,
        applied: 0,
        details: [err.message],
        message: "Error: " + err.message,
      };
    } finally {
      await conn.end();
    }
  }),
});
