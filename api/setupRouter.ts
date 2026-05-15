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
      // 1. DROP and recreate job_postings (safe - no data yet)
      await conn.execute(`DROP TABLE IF EXISTS job_postings`);
      await conn.execute(`
        CREATE TABLE job_postings (
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
      results.push("Tabla 'job_postings' recreada correctamente");

      // 2. Fix candidates.tags - change from JSON to TEXT
      try {
        await conn.execute(`ALTER TABLE candidates MODIFY COLUMN tags TEXT`);
        results.push("Columna 'tags' cambiada a TEXT");
      } catch (e: any) {
        if (e.code === 'ER_BAD_FIELD_ERROR') {
          await conn.execute(`ALTER TABLE candidates ADD COLUMN tags TEXT`);
          results.push("Columna 'tags' creada como TEXT");
        } else {
          results.push("Columna 'tags' ya es TEXT o no aplica: " + e.message);
        }
      }

      // 3. Add cvText to candidates
      try {
        await conn.execute(`ALTER TABLE candidates ADD COLUMN cvText TEXT`);
        results.push("Columna 'cvText' agregada");
      } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          try {
            await conn.execute(`ALTER TABLE candidates MODIFY COLUMN cvText TEXT`);
            results.push("Columna 'cvText' cambiada a TEXT");
          } catch {
            results.push("Columna 'cvText' ya existe");
          }
        } else {
          results.push("Columna 'cvText: " + e.message);
        }
      }

      // 4. Add matchScore to candidates
      try {
        await conn.execute(`ALTER TABLE candidates ADD COLUMN matchScore INT`);
        results.push("Columna 'matchScore' agregada");
      } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          results.push("Columna 'matchScore' ya existe");
        } else {
          results.push("matchScore: " + e.message);
        }
      }

      // 5. Fix ai_summaries.strengths and concerns from JSON to TEXT
      try {
        await conn.execute(`ALTER TABLE ai_summaries MODIFY COLUMN strengths TEXT`);
        results.push("Columna 'strengths' cambiada a TEXT");
      } catch (e: any) {
        results.push("strengths: " + (e.message || 'ok'));
      }

      try {
        await conn.execute(`ALTER TABLE ai_summaries MODIFY COLUMN concerns TEXT`);
        results.push("Columna 'concerns' cambiada a TEXT");
      } catch (e: any) {
        results.push("concerns: " + (e.message || 'ok'));
      }

      return {
        success: true,
        applied: results.length,
        details: results,
        message: "Base de datos actualizada correctamente. Ahora puedes crear puestos y subir CVs.",
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
