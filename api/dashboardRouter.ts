import { createRouter, adminQuery } from "./middleware";
import {
  getDashboardOverview,
  getRoleDistribution,
  getScoreDistribution,
  getCandidatePipeline,
} from "./queries/dashboard";
import { getFeedbackStats } from "./queries/feedback";

export const dashboardRouter = createRouter({
  overview: adminQuery.query(async () => {
    return getDashboardOverview();
  }),

  roleDistribution: adminQuery.query(async () => {
    return getRoleDistribution();
  }),

  scoreDistribution: adminQuery.query(async () => {
    return getScoreDistribution();
  }),

  candidatePipeline: adminQuery.query(async () => {
    return getCandidatePipeline();
  }),

  clientFeedback: adminQuery.query(async () => {
    return getFeedbackStats();
  }),
});
