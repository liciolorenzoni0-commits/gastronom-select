import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  createEvaluation,
  findEvaluationById,
  listEvaluationsByCandidate,
  submitEvaluation,
} from "./queries/evaluations";
import { findAiSummaryByEvaluation } from "./queries/aiSummaries";

export const evaluationRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        candidateId: z.number(),
        interviewerName: z.string().optional(),
        interviewerEmail: z.string().optional(),
        restaurantName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Generate client token from restaurant name
      const clientToken = input.restaurantName
        ? input.restaurantName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50)
        : undefined;
      const id = await createEvaluation({
        ...input,
        clientToken,
        status: "draft",
      });
      return { id };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const evaluation = await findEvaluationById(input.id);
      if (!evaluation) return null;

      const scoresModule = await import("./queries/evaluations");
      const scores = await scoresModule.listScoresByEvaluation(evaluation.id);
      const aiSummary = evaluation.aiSummaryId
        ? await findAiSummaryByEvaluation(evaluation.id)
        : null;

      return { ...evaluation, scores, aiSummary };
    }),

  getByCandidate: publicQuery
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      return listEvaluationsByCandidate(input.candidateId);
    }),

  submit: publicQuery
    .input(
      z.object({
        id: z.number(),
        interviewerName: z.string(),
        interviewerEmail: z.string(),
        restaurantName: z.string(),
        overallScore: z.number().min(0).max(10),
        recommendation: z.enum(["strong_hire", "hire", "consider", "pass"]),
        generalNotes: z.string(),
        scores: z.array(
          z.object({
            metricName: z.string(),
            score: z.number().min(0).max(10),
            weight: z.number().optional(),
            category: z.enum(["technical", "soft_skills", "leadership", "hygiene"]).optional(),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      await submitEvaluation(input.id, {
        interviewerName: input.interviewerName,
        interviewerEmail: input.interviewerEmail,
        restaurantName: input.restaurantName,
        overallScore: input.overallScore.toFixed(1),
        recommendation: input.recommendation,
        generalNotes: input.generalNotes,
      });

      // Save individual scores
      const scoresModule = await import("./queries/evaluations");
      for (const score of input.scores) {
        await scoresModule.createEvaluationScore({
          evaluationId: input.id,
          metricName: score.metricName,
          score: score.score.toFixed(1),
          weight: score.weight?.toFixed(2) ?? "1.0",
          category: score.category ?? "technical",
          notes: score.notes,
        });
      }

      return { success: true };
    }),
});
