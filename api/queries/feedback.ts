import { sql } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

export async function createFeedback(data: schema.InsertFeedback) {
  const db = getDb();
  const result = await db.insert(schema.feedback).values(data).$returningId();
  return result[0]?.id;
}

export async function listFeedback() {
  const db = getDb();
  return db.select().from(schema.feedback).orderBy(schema.feedback.createdAt);
}

export async function getFeedbackStats() {
  const db = getDb();
  const rows = await db
    .select({
      avgService: sql<number>`AVG(${schema.feedback.serviceRating})`,
      avgResponsiveness: sql<number>`AVG(${schema.feedback.responsivenessRating})`,
      avgQuality: sql<number>`AVG(${schema.feedback.candidateQualityRating})`,
      totalCount: sql<number>`COUNT(*)`,
      recommendCount: sql<number>`SUM(CASE WHEN ${schema.feedback.wouldRecommend} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(schema.feedback);
  return rows.at(0);
}
