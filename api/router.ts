import { authRouter } from "./auth-router";
import { candidateRouter } from "./candidateRouter";
import { evaluationRouter } from "./evaluationRouter";
import { aiSummaryRouter } from "./aiSummaryRouter";
import { feedbackRouter } from "./feedbackRouter";
import { voiceRouter } from "./voiceRouter";
import { dashboardRouter } from "./dashboardRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  candidate: candidateRouter,
  evaluation: evaluationRouter,
  aiSummary: aiSummaryRouter,
  feedback: feedbackRouter,
  voice: voiceRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
