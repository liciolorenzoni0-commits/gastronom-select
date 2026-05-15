import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  varchar,
  text,
  timestamp,
  json,
  int,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Candidates table — core entity for HORECA recruitment
export const candidates = mysqlTable("candidates", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", [
    "chef",
    "sous_chef",
    "manager",
    "waiter",
    "bartender",
    "host",
  ]).notNull(),
  experienceYears: int("experienceYears"),
  tags: json("tags").$type<string[]>(),
  cvUrl: text("cvUrl"),
  cvText: text("cvText"),
  matchScore: int("matchScore"),
  avatarUrl: text("avatarUrl"),
  status: mysqlEnum("status", ["active", "hired", "rejected", "archived"])
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

// Job postings — position requirements for CV matching
export const jobPostings = mysqlTable("job_postings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  role: mysqlEnum("role", [
    "chef",
    "sous_chef",
    "manager",
    "waiter",
    "bartender",
    "host",
  ]).notNull(),
  requiredSkills: json("requiredSkills").$type<string[]>(),
  requiredYears: int("requiredYears"),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;

// Evaluations table — interview evaluation records
export const evaluations = mysqlTable("evaluations", {
  id: serial("id").primaryKey(),
  candidateId: bigint("candidateId", { mode: "number", unsigned: true })
    .notNull(),
  interviewerName: varchar("interviewerName", { length: 255 }),
  interviewerEmail: varchar("interviewerEmail", { length: 320 }),
  restaurantName: varchar("restaurantName", { length: 255 }),
  overallScore: decimal("overallScore", { precision: 3, scale: 1 }),
  recommendation: mysqlEnum("recommendation", [
    "strong_hire",
    "hire",
    "consider",
    "pass",
  ]),
  generalNotes: text("generalNotes"),
  clientToken: varchar("clientToken", { length: 100 }),
  aiSummaryId: bigint("aiSummaryId", {
    mode: "number",
    unsigned: true,
  }),
  status: mysqlEnum("status", ["draft", "submitted", "archived"])
    .default("draft")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;

// Evaluation scores — individual metric scores
export const evaluationScores = mysqlTable("evaluation_scores", {
  id: serial("id").primaryKey(),
  evaluationId: bigint("evaluationId", { mode: "number", unsigned: true })
    .notNull(),
  metricName: varchar("metricName", { length: 100 }).notNull(),
  score: decimal("score", { precision: 3, scale: 1 }).notNull(),
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.0"),
  category: mysqlEnum("category", [
    "technical",
    "soft_skills",
    "leadership",
    "hygiene",
  ]),
  notes: text("notes"),
});

export type EvaluationScore = typeof evaluationScores.$inferSelect;
export type InsertEvaluationScore = typeof evaluationScores.$inferInsert;

// AI summaries — AI-generated executive summaries
export const aiSummaries = mysqlTable("ai_summaries", {
  id: serial("id").primaryKey(),
  evaluationId: bigint("evaluationId", { mode: "number", unsigned: true })
    .notNull(),
  executiveSummary: text("executiveSummary"),
  recommendationScore: decimal("recommendationScore", {
    precision: 3,
    scale: 1,
  }),
  strengths: json("strengths").$type<string[]>(),
  concerns: json("concerns").$type<string[]>(),
  culturalFit: mysqlEnum("culturalFit", [
    "excellent",
    "good",
    "moderate",
    "poor",
  ]),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type AiSummary = typeof aiSummaries.$inferSelect;
export type InsertAiSummary = typeof aiSummaries.$inferInsert;

// Feedback — client feedback about Gastronom service
export const feedback = mysqlTable("feedback", {
  id: serial("id").primaryKey(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  restaurantName: varchar("restaurantName", { length: 255 }),
  serviceRating: int("serviceRating").notNull(),
  responsivenessRating: int("responsivenessRating"),
  candidateQualityRating: int("candidateQualityRating"),
  comments: text("comments"),
  wouldRecommend: boolean("wouldRecommend"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

// Voice notes — voice recording transcriptions
export const voiceNotes = mysqlTable("voice_notes", {
  id: serial("id").primaryKey(),
  evaluationId: bigint("evaluationId", { mode: "number", unsigned: true })
    .notNull(),
  transcript: text("transcript"),
  summary: text("summary"),
  duration: int("duration"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceNote = typeof voiceNotes.$inferSelect;
export type InsertVoiceNote = typeof voiceNotes.$inferInsert;
