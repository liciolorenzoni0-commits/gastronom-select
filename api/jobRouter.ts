import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { listJobs, findJobById, updateJob, deactivateJob } from "./queries/jobs";
import { getDb } from "./queries/connection";
import { jobPostings } from "@db/schema";

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
        const db = getDb();

        // REMOVED .$returningId() — it breaks with mysql2/TiDB
        // MySQL doesn't support RETURNING natively. Drizzle emulates it
        // but fails silently on TiDB Cloud.
        await db.insert(jobPostings).values({
          title: input.title,
          role: input.role,
          requiredSkills: JSON.stringify(input.requiredSkills || []),
          requiredYears: input.requiredYears ?? null,
          description: input.description ?? null,
        });

        return { success: true };
      } catch (err: any) {
        // Log the REAL error with full details
        console.error("[job.create] COMPLETE ERROR:", {
          message: err.message,
          code: err.code,
          errno: err.errno,
          sqlState: err.sqlState,
          sql: err.sql,
          stack: err.stack?.split("\n")?.slice(0, 3),
        });
        throw new Error(
          `Insert failed: ${err.message} (code=${err.code}, errno=${err.errno}, sqlState=${err.sqlState})`
        );
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
