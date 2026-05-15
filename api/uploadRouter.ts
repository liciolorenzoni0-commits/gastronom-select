import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { extractTextFromPdf } from "./lib/pdfParser";
import { calculateMatch } from "./matchingEngine";
import { getDb } from "./queries/connection";
import { candidates, jobPostings } from "@db/schema";
import { eq } from "drizzle-orm";

export const uploadRouter = createRouter({
  uploadCv: publicQuery
    .input(
      z.object({
        candidateId: z.number(),
        base64Pdf: z.string(),
        jobPostingId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Decode base64 to buffer
      const buffer = Buffer.from(input.base64Pdf, "base64");

      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error("El PDF no debe exceder 5MB");
      }

      // Extract text from PDF
      const cvText = await extractTextFromPdf(buffer);

      if (!cvText || cvText.trim().length < 50) {
        throw new Error(
          "No se pudo extraer texto del PDF. Asegurate de que sea un CV con contenido textual."
        );
      }

      // Calculate match score if job posting is provided
      let matchScore: number | null = null;
      if (input.jobPostingId) {
        const jobs = await getDb()
          .select()
          .from(jobPostings)
          .where(eq(jobPostings.id, input.jobPostingId))
          .limit(1);

        if (jobs.length > 0) {
          const job = jobs[0];
          const requiredSkills = job.requiredSkills || [];
          const result = calculateMatch(
            cvText,
            requiredSkills,
            job.requiredYears,
            job.description
          );
          matchScore = result.score;
        }
      }

      // Store CV text and match score
      await getDb()
        .update(candidates)
        .set({
          cvText: cvText,
          matchScore: matchScore,
        })
        .where(eq(candidates.id, input.candidateId));

      return {
        success: true,
        extractedLength: cvText.length,
        matchScore,
      };
    }),

  analyzeCv: publicQuery
    .input(
      z.object({
        candidateId: z.number(),
        jobPostingId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const [candidateRows, jobRows] = await Promise.all([
        getDb()
          .select()
          .from(candidates)
          .where(eq(candidates.id, input.candidateId))
          .limit(1),
        getDb()
          .select()
          .from(jobPostings)
          .where(eq(jobPostings.id, input.jobPostingId))
          .limit(1),
      ]);

      if (candidateRows.length === 0) {
        throw new Error("Candidato no encontrado");
      }
      if (jobRows.length === 0) {
        throw new Error("Puesto no encontrado");
      }

      const candidate = candidateRows[0];
      const job = jobRows[0];

      if (!candidate.cvText) {
        throw new Error("El candidato no tiene CV cargado");
      }

      const result = calculateMatch(
        candidate.cvText,
        job.requiredSkills || [],
        job.requiredYears,
        job.description
      );

      return result;
    }),

  rankCandidates: publicQuery
    .input(
      z.object({
        jobPostingId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const jobRows = await getDb()
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.id, input.jobPostingId))
        .limit(1);

      if (jobRows.length === 0) {
        throw new Error("Puesto no encontrado");
      }

      const job = jobRows[0];

      // Get all candidates with CVs for this role
      const allCandidates = await getDb()
        .select()
        .from(candidates)
        .where(eq(candidates.role, job.role));

      const ranked = allCandidates
        .filter((c) => c.cvText)
        .map((c) => {
          const result = calculateMatch(
            c.cvText!,
            job.requiredSkills || [],
            job.requiredYears,
            job.description
          );
          return {
            candidateId: c.id,
            candidateName: c.fullName,
            role: c.role,
            experienceYears: c.experienceYears,
            tags: c.tags || [],
            ...result,
          };
        })
        .sort((a, b) => b.score - a.score);

      return ranked;
    }),
});
