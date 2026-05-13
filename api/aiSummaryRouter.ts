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
      if (lowerNotes.includes("cuchillo") || lowerNotes.includes("técnica"))
        strengths.push("Sólida base técnica con ejecución precisa");
      if (lowerNotes.includes("salsa") || lowerNotes.includes("sabor"))
        strengths.push("Profundo entendimiento de perfiles de sabor y salsas");
      if (lowerNotes.includes("líder") || lowerNotes.includes("equipo"))
        strengths.push("Capacidades de liderazgo demostradas con experiencia gestionando equipos");
      if (lowerNotes.includes("plat") || lowerNotes.includes("present"))
        strengths.push("Habilidades excepcionales de emplatado y presentación");
      if (lowerNotes.includes("higiene") || lowerNotes.includes("limp"))
        strengths.push("Estándares impecables de higiene y organización");
      if (lowerNotes.includes("creativ") || lowerNotes.includes("innov"))
        strengths.push("Enfoque creativo para el desarrollo de menú y diseño de platos");
      if (lowerNotes.includes("michelin") || lowerNotes.includes("alta cocina"))
        strengths.push("Experiencia comprobada en entornos de alta cocina bajo presión");

      if (lowerNotes.includes("velocid") || lowerNotes.includes("lent"))
        concerns.push("La velocidad durante el servicio punta podría mejorar");
      if (lowerNotes.includes("estrés") || lowerNotes.includes("presión"))
        concerns.push("El manejo de situaciones de alto estrés podría ser una preocupación");
      if (avgScore < 7)
        concerns.push("Los puntajes generales sugieren que el candidato podría necesitar desarrollo significativo");
      if (lowerNotes.includes("lenguaje") || lowerNotes.includes("comunic"))
        concerns.push("Las habilidades de comunicación podrían necesitar evaluación en contexto de equipo");

      if (strengths.length === 0) {
        strengths.push("Desempeño sólido en general en las competencias evaluadas");
        strengths.push("Demuestra enfoque profesional hacia el trabajo culinario");
      }
      if (concerns.length === 0) {
        concerns.push("Áreas menores para mejorar en habilidades técnicas específicas");
      }

      let culturalFit: "excellent" | "good" | "moderate" | "poor" = "good";
      if (avgScore >= 9) culturalFit = "excellent";
      else if (avgScore < 7) culturalFit = "moderate";

      const summary = `${input.candidateName} se presenta como un candidato ${avgScore >= 8.5 ? "fuerte" : avgScore >= 7 ? "sólido" : "en desarrollo"} para el puesto de ${input.role}, con una puntuación promedio de competencias de ${avgScore.toFixed(1)}/10 en todas las áreas evaluadas. ${strengths.length > 2 ? "Sus fortalezas destacadas incluyen " + strengths.slice(0, 2).join(" y ").toLowerCase() + ", lo que indica preparación para las demandas del servicio de alta cocina." : "Demuestran competencia en áreas centrales con espacio para crecer en habilidades especializadas."} ${concerns.length > 0 ? "Consideraciones clave incluyen " + concerns[0].toLowerCase() + ", lo cual debería monitorearse durante la integración." : "No se identificaron preocupaciones significativas durante la evaluación."} En general, este candidato es ${avgScore >= 8 ? "recomendado para contratación" : avgScore >= 7 ? "vale la pena considerar con un período de prueba" : "recomendado para desarrollo adicional antes de la colocación"}.`;

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
