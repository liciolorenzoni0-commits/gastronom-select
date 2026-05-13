import { authRouter } from "./auth-router";
import { candidateRouter } from "./candidateRouter";
import { evaluationRouter } from "./evaluationRouter";
import { aiSummaryRouter } from "./aiSummaryRouter";
import { feedbackRouter } from "./feedbackRouter";
import { voiceRouter } from "./voiceRouter";
import { dashboardRouter } from "./dashboardRouter";
import { portalRouter } from "./clientRouter";
import { passwordRouter } from "./passwordRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  password: passwordRouter,
  candidate: candidateRouter,
  evaluation: evaluationRouter,
  aiSummary: aiSummaryRouter,
  feedback: feedbackRouter,
  voice: voiceRouter,
  dashboard: dashboardRouter,
  portal: portalRouter,
});

export type AppRouter = typeof appRouter;
