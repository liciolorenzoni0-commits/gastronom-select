import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { listJobs, findJobById, updateJob, deactivateJob } from "./queries/jobs";
import { getDb } from "./queries/connection";
import { sql } from "drizzle-orm";

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
      try {
        const skillsJson = JSON.stringify(input.requiredSkills || []);
        const reqYears = input.requiredYears ?? null;
        const desc = input.description ?? null;

        // Use existing DB connection with raw SQL
        const db = getDb();
        const result = await db.execute(
          sql`INSERT INTO job_postings (title, role, requiredSkills, requiredYears, description) VALUES (${input.title}, ${input.role}, ${skillsJson}, ${reqYears}, ${desc})`
        );

        return { id: (result as any)[0].insertId };
      } catch (err: any) {
        console.error("[job.create] FAILED:", err.message, "code:", err.code);
        // Return the error so client can see it
        throw new Error(`DB Error: ${err.message} (code: ${err.code || "unknown"})`);
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
