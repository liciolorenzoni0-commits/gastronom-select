import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import {
  createFeedback,
  listFeedback,
  getFeedbackStats,
} from "./queries/feedback";

export const feedbackRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        clientName: z.string().min(1),
        clientEmail: z.string().email().optional(),
        restaurantName: z.string().optional(),
        serviceRating: z.number().min(1).max(5),
        responsivenessRating: z.number().min(1).max(5).optional(),
        candidateQualityRating: z.number().min(1).max(5).optional(),
        comments: z.string().optional(),
        wouldRecommend: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createFeedback(input);
      return { id, success: true };
    }),

  list: adminQuery.query(async () => {
    return listFeedback();
  }),

  stats: adminQuery.query(async () => {
    return getFeedbackStats();
  }),
});
