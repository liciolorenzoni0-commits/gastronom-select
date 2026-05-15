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
      const db = getDb();
      const skillsJson = JSON.stringify(input.requiredSkills || []);
      const reqYears = input.requiredYears ?? null;
      const desc = input.description ?? null;

      // Use Drizzle insert which handles the connection properly
      const result = await db.insert(jobPostings).values({
        title: input.title,
        role: input.role as any,
        requiredSkills: skillsJson,
        requiredYears: reqYears,
        description: desc,
      }).$returningId();

      return { id: result[0].id };
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
