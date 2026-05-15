import { authRouter } from "./auth-router";
import { candidateRouter } from "./candidateRouter";
import { evaluationRouter } from "./evaluationRouter";
import { aiSummaryRouter } from "./aiSummaryRouter";
import { feedbackRouter } from "./feedbackRouter";
import { voiceRouter } from "./voiceRouter";
import { dashboardRouter } from "./dashboardRouter";
import { portalRouter } from "./clientRouter";
import { passwordRouter } from "./passwordRouter";
import { uploadRouter } from "./uploadRouter";
import { jobRouter } from "./jobRouter";
import { setupRouter } from "./setupRouter";
import { debugRouter } from "./debugRouter";
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
  upload: uploadRouter,
  job: jobRouter,
  setup: setupRouter,
  debug: debugRouter,
});

export type AppRouter = typeof appRouter;
