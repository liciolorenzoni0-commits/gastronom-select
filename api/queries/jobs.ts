import { eq, desc } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

function parseJsonField<T>(value: string | null): T | null {
  if (!value || value === "null") return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function serializeSkills(skills: string[] | null | undefined): string {
  if (!skills || skills.length === 0) return "[]";
  return JSON.stringify(skills);
}

export async function listJobs() {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.jobPostings)
    .orderBy(desc(schema.jobPostings.createdAt));
  return rows.map((row) => ({
    ...row,
    requiredSkills: parseJsonField<string[]>(row.requiredSkills),
  }));
}

export async function findJobById(id: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.jobPostings)
    .where(eq(schema.jobPostings.id, id))
    .limit(1);
  const row = rows.at(0);
  if (!row) return null;
  return {
    ...row,
    requiredSkills: parseJsonField<string[]>(row.requiredSkills),
  };
}

export async function createJob(data: {
  title: string;
  role: string;
  requiredSkills: string[] | null;
  requiredYears: number | null;
  description: string | null;
}) {
  const db = getDb();
  const result = await db
    .insert(schema.jobPostings)
    .values({
      title: data.title,
      role: data.role as any,
      requiredSkills: serializeSkills(data.requiredSkills),
      requiredYears: data.requiredYears,
      description: data.description,
    })
    .$returningId();
  return result[0]?.id;
}

export async function updateJob(
  id: number,
  data: Partial<{
    title: string;
    role: string;
    requiredSkills: string[];
    requiredYears: number;
    description: string;
    isActive: boolean;
  }>
) {
  const db = getDb();
  const updateData: Record<string, any> = { ...data };
  if (data.requiredSkills !== undefined) {
    updateData.requiredSkills = serializeSkills(data.requiredSkills);
  }
  if (data.role !== undefined) {
    updateData.role = data.role;
  }
  await db
    .update(schema.jobPostings)
    .set(updateData)
    .where(eq(schema.jobPostings.id, id));
}

export async function deactivateJob(id: number) {
  const db = getDb();
  await db
    .update(schema.jobPostings)
    .set({ isActive: false })
    .where(eq(schema.jobPostings.id, id));
}
