import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { listJobs, findJobById, updateJob, deactivateJob } from "./queries/jobs";
import { createConnection } from "mysql2/promise";
import { env } from "./lib/env";

export const jobRouter = createRouter({
  list: publicQuery.query(async () => {
    return listJobs();
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findJobById(input.id);
    }),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        role: z.enum([
          "chef",
          "sous_chef",
          "manager",
          "waiter",
          "bartender",
          "host",
        ]),
        requiredSkills: z.array(z.string()).optional(),
        requiredYears: z.number().min(0).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Use raw SQL to avoid Drizzle column name issues
      const conn = await createConnection(env.databaseUrl);
      try {
        const skillsJson = JSON.stringify(input.requiredSkills || []);
        console.log("[job.create] Inserting:", { title: input.title, role: input.role, skills: skillsJson });
        const [result] = await conn.execute(
          `INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (?, ?, ?, ?, ?)`,
          [
            input.title,
            input.role,
            skillsJson,
            input.requiredYears ?? null,
            input.description ?? null,
          ]
        );
        const insertId = (result as any).insertId;
        console.log("[job.create] Success, id:", insertId);
        return { id: insertId };
      } catch (err: any) {
        console.error("[job.create] FAILED:", err.message, "code:", err.code, "sqlState:", err.sqlState);
        throw err;
      } finally {
        await conn.end();
      }
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        role: z
          .enum(["chef", "sous_chef", "manager", "waiter", "bartender", "host"])
          .optional(),
        requiredSkills: z.array(z.string()).optional(),
        requiredYears: z.number().min(0).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateJob(id, data);
      return findJobById(id);
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deactivateJob(input.id);
      return { success: true };
    }),
});
