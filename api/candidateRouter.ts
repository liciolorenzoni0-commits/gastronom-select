import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import {
  findCandidateByToken,
  findCandidateById,
  listCandidates,
  createCandidate,
  updateCandidateStatus,
} from "./queries/candidates";
import { listEvaluationsByCandidate } from "./queries/evaluations";
import { findAiSummaryByEvaluation } from "./queries/aiSummaries";

export const candidateRouter = createRouter({
  getByToken: publicQuery
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const candidate = await findCandidateByToken(input.token);
      if (!candidate) return null;

      // Fetch evaluations and their AI summaries
      const evaluations = await listEvaluationsByCandidate(candidate.id);
      const evaluationsWithSummaries = await Promise.all(
        evaluations.map(async (ev) => {
          const scores = await import("./queries/evaluations").then((m) =>
            m.listScoresByEvaluation(ev.id)
          );
          const aiSummary = ev.aiSummaryId
            ? await findAiSummaryByEvaluation(ev.id)
            : null;
          return { ...ev, scores, aiSummary };
        })
      );

      return { ...candidate, evaluations: evaluationsWithSummaries };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const candidate = await findCandidateById(input.id);
      if (!candidate) return null;
      const evaluations = await listEvaluationsByCandidate(candidate.id);
      return { ...candidate, evaluations };
    }),

  list: adminQuery.query(async () => {
    return listCandidates();
  }),

  create: adminQuery
    .input(
      z.object({
        token: z.string().min(1),
        fullName: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(["chef", "sous_chef", "manager", "waiter", "bartender", "host"]),
        experienceYears: z.number().optional(),
        tags: z.array(z.string()).optional(),
        cvUrl: z.string().optional(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createCandidate({
        ...input,
        tags: input.tags ?? [],
        status: "active",
      });
      return { id };
    }),

  updateStatus: adminQuery
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
