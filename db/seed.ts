import { getDb } from "../api/queries/connection";
import { candidates, evaluations, evaluationScores, aiSummaries, feedback } from "./schema";
import type { InsertCandidate, InsertEvaluation, InsertEvaluationScore, InsertAiSummary, InsertFeedback } from "./schema";

async function seed() {
  const db = getDb();

  // Insert demo candidates
  const candidate1Data: InsertCandidate = {
    token: "chef-elena-2026",
    fullName: "Elena Voss",
    email: "elena.voss@email.com",
    phone: "+41 79 123 4567",
    role: "sous_chef",
    experienceYears: 8,
    tags: ["Michelin Exp", "Plating", "French", "Pastry", "Leadership"],
    cvUrl: "https://example.com/cv/elena",
    avatarUrl: "/candidate-1.jpg",
    status: "active",
  };
  const c1 = await db.insert(candidates).values(candidate1Data).$returningId();

  const candidate2Data: InsertCandidate = {
    token: "chef-marcus-2026",
    fullName: "Marcus Chen",
    email: "marcus.chen@email.com",
    phone: "+41 78 987 6543",
    role: "chef",
    experienceYears: 15,
    tags: ["Executive", "Asian Fusion", "Michelin Star", "Menu Design", "Team Building"],
    cvUrl: "https://example.com/cv/marcus",
    avatarUrl: "/candidate-2.jpg",
    status: "active",
  };
  await db.insert(candidates).values(candidate2Data).$returningId();

  const candidate3Data: InsertCandidate = {
    token: "pastry-sophie-2026",
    fullName: "Sophie Laurent",
    email: "sophie.laurent@email.com",
    phone: "+41 76 456 7890",
    role: "chef",
    experienceYears: 6,
    tags: ["Pastry", "Chocolate Work", "Sugar Art", "Fine Dining", "Creative"],
    cvUrl: "https://example.com/cv/sophie",
    avatarUrl: "/candidate-3.jpg",
    status: "active",
  };
  await db.insert(candidates).values(candidate3Data).$returningId();

  // Insert a completed evaluation for candidate 1
  const evalData: InsertEvaluation = {
    candidateId: c1[0].id,
    interviewerName: "Thomas Meyer",
    interviewerEmail: "thomas@lemillenaire.ch",
    restaurantName: "Le Millénaire",
    overallScore: "9.4",
    recommendation: "strong_hire",
    generalNotes: "Elena demonstrated exceptional knife skills and a deep understanding of French cuisine fundamentals. Her plating presentation was artistic yet functional. She showed strong leadership potential when discussing her previous role managing a team of 4 junior chefs. Her sauce work was particularly impressive — the béarnaise she prepared during the practical was flawless. Minor area for improvement: speed during peak service simulation, though this is expected given the precision of her work.",
    status: "submitted",
  };
  const e1 = await db.insert(evaluations).values(evalData).$returningId();

  // Insert evaluation scores
  const scoresData: InsertEvaluationScore[] = [
    { evaluationId: e1[0].id, metricName: "Knife Skills", score: "9.5", weight: "1.0", category: "technical", notes: "Exceptional precision and speed" },
    { evaluationId: e1[0].id, metricName: "Sauce Work", score: "9.8", weight: "1.0", category: "technical", notes: "Béarnaise was flawless" },
    { evaluationId: e1[0].id, metricName: "Plating Presentation", score: "9.6", weight: "1.0", category: "technical", notes: "Artistic yet functional" },
    { evaluationId: e1[0].id, metricName: "Leadership", score: "8.5", weight: "1.0", category: "leadership", notes: "Strong potential, managed team of 4" },
    { evaluationId: e1[0].id, metricName: "Kitchen Hygiene", score: "9.7", weight: "1.0", category: "hygiene", notes: "Exemplary standards" },
    { evaluationId: e1[0].id, metricName: "Speed Under Pressure", score: "8.0", weight: "1.0", category: "technical", notes: "Good but can improve during peak" },
    { evaluationId: e1[0].id, metricName: "Cultural Fit", score: "9.2", weight: "1.0", category: "soft_skills", notes: "Aligns well with our values" },
  ];
  await db.insert(evaluationScores).values(scoresData);

  // Insert AI summary
  const aiData: InsertAiSummary = {
    evaluationId: e1[0].id,
    executiveSummary: "Elena Voss presents as an exceptional sous chef candidate with a rare combination of technical mastery and creative artistry. Her 8 years of experience, including Michelin-starred environments, are evident in every aspect of her practical evaluation. The precision of her knife work and the flawless execution of classical sauces demonstrate a deep, foundational understanding of French cuisine. Her plating reveals a sophisticated aesthetic sensibility that would elevate any fine dining establishment. While her speed during peak simulation showed room for improvement, this is offset by the extraordinary quality of her output. Her leadership experience managing a team of 4 junior chefs suggests she is ready for increased responsibility. Overall, Elena represents a strong hire who would bring immediate technical excellence and long-term leadership potential.",
    recommendationScore: "9.4",
    strengths: ["Exceptional technical skills — knife work, sauces, and plating all scored above 9.5", "Michelin-level experience with understanding of fine dining standards", "Strong leadership track record with team management experience", "Exemplary kitchen hygiene practices", "Creative plating that balances artistry with functionality"],
    concerns: ["Speed during peak service could improve — scored 8.0", "May need support transitioning to our specific kitchen workflow"],
    culturalFit: "excellent",
  };
  await db.insert(aiSummaries).values(aiData);

  // Insert feedback
  const feedbackData: InsertFeedback[] = [
    {
      clientName: "Thomas Meyer",
      clientEmail: "thomas@lemillenaire.ch",
      restaurantName: "Le Millénaire",
      serviceRating: 5,
      responsivenessRating: 5,
      candidateQualityRating: 5,
      comments: "Gastronom consistently delivers exceptional candidates. Elena's profile was perfectly matched to our needs and the evaluation process was seamless.",
      wouldRecommend: true,
    },
    {
      clientName: "Claudia Weber",
      clientEmail: "claudia@bergrose.ch",
      restaurantName: "Bergrose",
      serviceRating: 4,
      responsivenessRating: 5,
      candidateQualityRating: 4,
      comments: "Great service overall. Would appreciate slightly faster turnaround on candidate sourcing, but the quality is always excellent.",
      wouldRecommend: true,
    },
  ];
  await db.insert(feedback).values(feedbackData);

  console.log("Seed data inserted successfully!");
}

seed().catch(console.error);
