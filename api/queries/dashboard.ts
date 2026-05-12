import { sql, eq, count, avg } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

export async function getDashboardOverview() {
  const db = getDb();

  const totalCandidates = await db
    .select({ count: count() })
    .from(schema.candidates);

  const avgScore = await db
    .select({ avg: avg(schema.evaluations.overallScore) })
    .from(schema.evaluations)
    .where(eq(schema.evaluations.status, "submitted"));

  const pendingEvals = await db
    .select({ count: count() })
    .from(schema.evaluations)
    .where(eq(schema.evaluations.status, "draft"));

  const totalEvaluations = await db
    .select({ count: count() })
    .from(schema.evaluations);

  const recentCandidates = await db
    .select()
    .from(schema.candidates)
    .orderBy(sql`${schema.candidates.createdAt} DESC`)
    .limit(5);

  return {
    totalCandidates: totalCandidates[0]?.count ?? 0,
    averageScore: avgScore[0]?.avg ? parseFloat(avgScore[0].avg).toFixed(1) : "0.0",
    pendingEvaluations: pendingEvals[0]?.count ?? 0,
    totalEvaluations: totalEvaluations[0]?.count ?? 0,
    recentCandidates,
  };
}

export async function getRoleDistribution() {
  const db = getDb();
  return db
    .select({
      role: schema.candidates.role,
      count: count(),
    })
    .from(schema.candidates)
    .groupBy(schema.candidates.role);
}

export async function getScoreDistribution() {
  const db = getDb();
  const scores = await db
    .select({
      score: schema.evaluations.overallScore,
    })
    .from(schema.evaluations)
    .where(eq(schema.evaluations.status, "submitted"));

  // Bucket scores into ranges
  const buckets: Record<string, number> = {
    "0-5": 0,
    "5-6": 0,
    "6-7": 0,
    "7-8": 0,
    "8-9": 0,
    "9-10": 0,
  };

  for (const { score } of scores) {
    if (!score) continue;
    const val = parseFloat(score);
    if (val < 5) buckets["0-5"];
    else if (val < 6) buckets["5-6"];
    else if (val < 7) buckets["6-7"];
    else if (val < 8) buckets["7-8"];
    else if (val < 9) buckets["8-9"];
    else buckets["9-10"]++;
  }

  return Object.entries(buckets).map(([range, count]) => ({ range, count }));
}

export async function getCandidatePipeline() {
  const db = getDb();
  return db
    .select({
      status: schema.candidates.status,
      count: count(),
    })
    .from(schema.candidates)
    .groupBy(schema.candidates.status);
}
