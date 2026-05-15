import { createRouter, publicQuery } from "./middleware";
import { env } from "./lib/env";
import { createConnection } from "mysql2/promise";

export const setupRouter = createRouter({
  migrate: publicQuery.query(async () => {
    const dbUrl = env.databaseUrl;
    if (!dbUrl) {
      throw new Error("DATABASE_URL no configurado");
    }

    const conn = await createConnection(dbUrl);

    try {
      const results: string[] = [];

      // Check if job_postings table exists
      const [jobRows] = await conn.execute(
        "SHOW TABLES LIKE 'job_postings'"
      );
      const jobTableExists = (jobRows as any[]).length > 0;

      if (!jobTableExists) {
        await conn.execute(`
          CREATE TABLE job_postings (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            role ENUM('chef','sous_chef','manager','waiter','bartender','host') NOT NULL,
            required_skills JSON,
            required_years INT,
            description TEXT,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          )
        `);
        results.push("Tabla 'job_postings' creada");
      } else {
        results.push("Tabla 'job_postings' ya existe");
      }

      // Check if candidates table has cvText column
      const [cvTextRows] = await conn.execute(
        "SHOW COLUMNS FROM candidates LIKE 'cvText'"
      );
      if ((cvTextRows as any[]).length === 0) {
        await conn.execute(
          "ALTER TABLE candidates ADD COLUMN cvText TEXT"
        );
        results.push("Columna 'cvText' agregada a candidates");
      } else {
        results.push("Columna 'cvText' ya existe");
      }

      // Check if candidates table has matchScore column
      const [matchScoreRows] = await conn.execute(
        "SHOW COLUMNS FROM candidates LIKE 'matchScore'"
      );
      if ((matchScoreRows as any[]).length === 0) {
        await conn.execute(
          "ALTER TABLE candidates ADD COLUMN matchScore INT"
        );
        results.push("Columna 'matchScore' agregada a candidates");
      } else {
        results.push("Columna 'matchScore' ya existe");
      }

      return {
        success: true,
        applied: results.length,
        details: results,
        message: "Migracion completada. Las tablas y columnas estan listas.",
      };
    } finally {
      await conn.end();
    }
  }),
});
