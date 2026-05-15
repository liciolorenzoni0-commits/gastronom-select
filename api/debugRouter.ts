import { createRouter, publicQuery } from "./middleware";
import { createConnection } from "mysql2/promise";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { jobPostings } from "@db/schema";

export const debugRouter = createRouter({
  checkDb: publicQuery.query(async () => {
    const dbUrl = env.databaseUrl;
    if (!dbUrl) return { error: "DATABASE_URL no configurado" };

    const conn = await createConnection(dbUrl);
    const results: Record<string, any> = {};

    try {
      // 1. Check job_postings columns
      const [jobCols] = await conn.execute("SHOW COLUMNS FROM job_postings");
      results.jobPostingsColumns = (jobCols as any[]).map((c) => ({
        name: c.Field,
        type: c.Type,
        null: c.Null,
        default: c.Default,
      }));

      // 2. Check candidates columns  
      const [candCols] = await conn.execute("SHOW COLUMNS FROM candidates");
      results.candidatesColumns = (candCols as any[]).map((c) => ({
        name: c.Field,
        type: c.Type,
        null: c.Null,
        default: c.Default,
      }));

      // 3. Try direct INSERT with mysql2
      try {
        await conn.execute(
          `INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (?, ?, ?, ?, ?)`,
          ["Test Job", "chef", '["Italiana"]', 3, "Test"]
        );
        results.directInsert = "SUCCESS - mysql2 insert works";
        // Clean up
        await conn.execute("DELETE FROM job_postings WHERE title = 'Test Job'");
      } catch (e: any) {
        results.directInsert = `FAILED: ${e.message} (code: ${e.code})`;
      }

      // 4. Try to list with Drizzle
      try {
        const jobs = await getDb().select().from(jobPostings).limit(1);
        results.drizzleSelect = `SUCCESS - found ${jobs.length} jobs`;
      } catch (e: any) {
        results.drizzleSelect = `FAILED: ${e.message}`;
      }

      return results;
    } catch (e: any) {
      return { error: e.message };
    } finally {
      await conn.end();
    }
  }),

  // Nuclear option: drop everything and recreate
  nuclearReset: publicQuery.query(async () => {
    const dbUrl = env.databaseUrl;
    if (!dbUrl) return { error: "DATABASE_URL no configurado" };

    const conn = await createConnection(dbUrl);
    const results: string[] = [];

    try {
      await conn.execute("SET FOREIGN_KEY_CHECKS = 0");

      // Drop tables in correct order
      await conn.execute("DROP TABLE IF EXISTS job_postings");
      results.push("job_postings dropped");

      await conn.execute("DROP TABLE IF EXISTS ai_summaries");
      results.push("ai_summaries dropped");

      await conn.execute("DROP TABLE IF EXISTS evaluations");
      results.push("evaluations dropped");

      await conn.execute("DROP TABLE IF EXISTS candidates");
      results.push("candidates dropped");

      // Recreate candidates
      await conn.execute(`
        CREATE TABLE candidates (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          token VARCHAR(100) NOT NULL,
          fullName VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          role ENUM('chef','sous_chef','manager','waiter','bartender','host') NOT NULL,
          experienceYears INT,
          tags TEXT,
          cvUrl TEXT,
          cvText TEXT,
          matchScore INT,
          avatarUrl TEXT,
          status ENUM('active','hired','rejected','archived') DEFAULT 'active' NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          UNIQUE KEY token_idx (token)
        )
      `);
      results.push("candidates recreated");

      // Recreate evaluations
      await conn.execute(`
        CREATE TABLE evaluations (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          candidateId INT UNSIGNED NOT NULL,
          interviewerEmail VARCHAR(255),
          restaurantName VARCHAR(255),
          clientToken VARCHAR(100),
          scores TEXT,
          generalNotes TEXT,
          recommendation ENUM('strong_hire','hire','consider','pass'),
          audioUrl TEXT,
          aiSummaryId INT UNSIGNED,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      results.push("evaluations recreated");

      // Recreate ai_summaries
      await conn.execute(`
        CREATE TABLE ai_summaries (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          evaluationId INT UNSIGNED NOT NULL,
          executiveSummary TEXT,
          recommendationScore VARCHAR(10),
          strengths TEXT,
          concerns TEXT,
          culturalFit ENUM('excellent','good','moderate','poor'),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      results.push("ai_summaries recreated");

      // Recreate job_postings
      await conn.execute(`
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
      results.push("job_postings recreated");

      await conn.execute("SET FOREIGN_KEY_CHECKS = 1");

      return {
        success: true,
        message: "Todas las tablas recreadas desde cero",
        details: results,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e.message,
        code: e.code,
        details: results,
      };
    } finally {
      await conn.end();
    }
  }),
});
