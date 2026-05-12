import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  createVoiceNote,
  listVoiceNotesByEvaluation,
} from "./queries/voiceNotes";

export const voiceRouter = createRouter({
  transcribe: publicQuery
    .input(
      z.object({
        evaluationId: z.number(),
        audioBase64: z.string(),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Simulate voice transcription with contextual content
      // In production, this would call Whisper API or similar
      const transcript = `[Voice recording — ${input.duration ?? 45}s]\n\nThe candidate demonstrated strong technical skills during the practical exam. Their knife work was precise and efficient, showing years of practice. I was particularly impressed with their sauce preparation — the consistency and flavor balance were excellent.\n\nWhen asked about handling pressure during service, they provided clear examples from their previous role at a Michelin-starred restaurant. They seem to have good leadership potential, though I'd like to see more evidence of mentoring junior staff.\n\nOverall, this is a strong candidate who would be an asset to any fine dining establishment. I recommend moving forward with the hiring process.`;

      const summary =
        "Strong technical skills, precise knife work, excellent sauce preparation. Good leadership potential with Michelin experience. Recommended for hire.";

      const id = await createVoiceNote({
        evaluationId: input.evaluationId,
        transcript,
        summary,
        duration: input.duration ?? 45,
      });

      return {
        id,
        transcript,
        summary,
        duration: input.duration ?? 45,
      };
    }),

  getByEvaluation: publicQuery
    .input(z.object({ evaluationId: z.number() }))
    .query(async ({ input }) => {
      return listVoiceNotesByEvaluation(input.evaluationId);
    }),
});
