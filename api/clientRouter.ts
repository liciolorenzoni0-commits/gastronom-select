import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { candidates, evaluations } from "@db/schema";
import { eq, like, or } from "drizzle-orm";

function parseJsonField<T>(value: string | null): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export const portalRouter = createRouter({
  getCandidates: publicQuery
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const token = input.token.toLowerCase();

      // Find evaluations matching this client
      const matchingEvals = await db
        .select()
        .from(evaluations)
        .where(
          or(
            like(evaluations.clientToken, `%${token}%`),
            like(evaluations.restaurantName, `%${token}%`),
            like(evaluations.interviewerEmail, `%${token}%`)
          )
        );

      const candidateIds = [...new Set(matchingEvals.map((e) => e.candidateId))];
      if (candidateIds.length === 0) return [];

      // Get those candidates with their evaluations
      const result = [];
      for (const cid of candidateIds) {
        const candidateRows = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, cid))
          .limit(1);

        if (candidateRows[0]) {
          const candidateEvals = await db
            .select()
            .from(evaluations)
            .where(eq(evaluations.candidateId, cid));

          result.push({
            ...candidateRows[0],
            tags: parseJsonField<string[]>(candidateRows[0].tags),
            evaluations: candidateEvals,
          });
        }
      }

      return result;
    }),
});
