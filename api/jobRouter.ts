import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { jobPostings } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const jobRouter = createRouter({
  list: publicQuery.query(async () => {
    return getDb()
      .select()
      .from(jobPostings)
      .orderBy(desc(jobPostings.createdAt));
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const rows = await getDb()
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, input.id))
        .limit(1);
      return rows[0] || null;
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
      const result = await getDb()
        .insert(jobPostings)
        .values({
          title: input.title,
          role: input.role,
          requiredSkills: input.requiredSkills || [],
          requiredYears: input.requiredYears || null,
          description: input.description || null,
        })
        .$returningId();

      const newJob = await getDb()
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, result[0].id))
        .limit(1);

      return newJob[0];
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
      await getDb()
        .update(jobPostings)
        .set(data)
        .where(eq(jobPostings.id, id));

      const rows = await getDb()
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, id))
        .limit(1);
      return rows[0] || null;
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb()
        .update(jobPostings)
        .set({ isActive: false })
        .where(eq(jobPostings.id, input.id));
      return { success: true };
    }),
});
