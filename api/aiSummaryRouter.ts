import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  createAiSummary,
  findAiSummaryByEvaluation,
} from "./queries/aiSummaries";
import { updateEvaluationAiSummary } from "./queries/evaluations";

export const aiSummaryRouter = createRouter({
  generate: publicQuery
    .input(
      z.object({
        evaluationId: z.number(),
        notes: z.string(),
        scores: z.array(
          z.object({
            metricName: z.string(),
            score: z.number(),
            category: z.string().optional(),
          })
        ),
        candidateName: z.string(),
        role: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const avgScore =
        input.scores.reduce((sum, s) => sum + s.score, 0) / input.scores.length;

      const strengths: string[] = [];
      const concerns: string[] = [];

      const lowerNotes = input.notes.toLowerCase();
      if (lowerNotes.includes("knife") || lowerNotes.includes("technical"))
        strengths.push("Strong technical foundation with precise execution");
      if (lowerNotes.includes("sauce") || lowerNotes.includes("flavor"))
        strengths.push("Deep understanding of flavor profiles and sauce work");
      if (lowerNotes.includes("lead") || lowerNotes.includes("team"))
        strengths.push("Demonstrated leadership abilities with team management experience");
      if (lowerNotes.includes("plate") || lowerNotes.includes("present"))
        strengths.push("Exceptional plating and presentation skills");
      if (lowerNotes.includes("hygiene") || lowerNotes.includes("clean"))
        strengths.push("Impeccable hygiene and organizational standards");
      if (lowerNotes.includes("creative") || lowerNotes.includes("innovat"))
        strengths.push("Creative approach to menu development and dish design");
      if (lowerNotes.includes("michelin") || lowerNotes.includes("fine dining"))
        strengths.push("Proven experience in high-pressure fine dining environments");

      if (lowerNotes.includes("speed") || lowerNotes.includes("slow"))
        concerns.push("Speed during peak service may need improvement");
      if (lowerNotes.includes("stress") || lowerNotes.includes("pressure"))
        concerns.push("Handling of high-stress situations could be a concern");
      if (avgScore < 7)
        concerns.push("Overall scores suggest candidate may need significant development");
      if (lowerNotes.includes("language") || lowerNotes.includes("communicat"))
        concerns.push("Communication skills may need assessment in team context");

      if (strengths.length === 0) {
        strengths.push("Solid overall performance across evaluated competencies");
        strengths.push("Demonstrates professional approach to culinary work");
      }
      if (concerns.length === 0) {
        concerns.push("Minor areas for improvement in specific technical skills");
      }

      let culturalFit: "excellent" | "good" | "moderate" | "poor" = "good";
      if (avgScore >= 9) culturalFit = "excellent";
      else if (avgScore < 7) culturalFit = "moderate";

      const summary = `${input.candidateName} presents as a ${avgScore >= 8.5 ? "strong" : avgScore >= 7 ? "solid" : "developing"} candidate for the ${input.role} position, with an average competency score of ${avgScore.toFixed(1)}/10 across all evaluated metrics. ${strengths.length > 2 ? "Their standout strengths include " + strengths.slice(0, 2).join(" and ").toLowerCase() + ", indicating readiness for the demands of fine dining service." : "They demonstrate competency in core areas with room for growth in specialized skills."} ${concerns.length > 0 ? "Key considerations include " + concerns[0].toLowerCase() + ", which should be monitored during onboarding." : "No significant concerns were identified during the evaluation."} Overall, this candidate is ${avgScore >= 8 ? "recommended for hire" : avgScore >= 7 ? "worth considering with a trial period" : "recommended for further development before placement"}.`;

      const recommendationScore = Math.min(10, Math.max(0, avgScore + (Math.random() * 0.4 - 0.2)));

      const aiSummaryId = await createAiSummary({
        evaluationId: input.evaluationId,
        executiveSummary: summary,
        recommendationScore: recommendationScore.toFixed(1),
        strengths,
        concerns,
        culturalFit,
      });

      await updateEvaluationAiSummary(input.evaluationId, aiSummaryId);

      return {
        id: aiSummaryId,
        executiveSummary: summary,
        recommendationScore: recommendationScore.toFixed(1),
        strengths,
        concerns,
        culturalFit,
      };
    }),

  getByEvaluation: publicQuery
    .input(z.object({ evaluationId: z.number() }))
    .query(async ({ input }) => {
      return findAiSummaryByEvaluation(input.evaluationId);
    }),
});
