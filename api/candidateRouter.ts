import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { findCandidateByToken, findCandidateById, listCandidates, updateCandidateStatus } from "./queries/candidates";
import { getDb } from "./queries/connection";
import { sql } from "drizzle-orm";

export const candidateRouter = createRouter({
  getByToken: publicQuery
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      return findCandidateByToken(input.token);
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findCandidateById(input.id);
    }),

  list: publicQuery.query(async () => {
    return listCandidates();
  }),

  create: publicQuery
    .input(
      z.object({
        token: z.string().min(1),
        fullName: z.string().min(1),
        email: z.string().optional(),
        phone: z.string().optional(),
        role: z.enum([
          "chef",
          "sous_chef",
          "manager",
          "waiter",
          "bartender",
          "host",
        ]),
        experienceYears: z.number().optional(),
        tags: z.array(z.string()).optional(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const tagsJson = JSON.stringify(input.tags || []);
        const db = getDb();
        const result = await db.execute(
          sql`INSERT INTO candidates (token, fullName, email, phone, role, experienceYears, tags, status) VALUES (${input.token}, ${input.fullName}, ${input.email || null}, ${input.phone || null}, ${input.role}, ${input.experienceYears || null}, ${tagsJson}, 'active')`
        );
        return { id: (result as any)[0].insertId, token: input.token };
      } catch (err: any) {
        console.error("[candidate.create] FAILED:", err.message, "code:", err.code);
        throw new Error(`DB Error: ${err.message} (code: ${err.code || "unknown"})`);
      }
    }),

  updateStatus: publicQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "hired", "rejected", "archived"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateCandidateStatus(input.id, input.status);
      return { success: true };
    }),
});
