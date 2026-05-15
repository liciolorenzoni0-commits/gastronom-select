export interface MatchResult {
  score: number; // 0-100
  skillMatches: string[];
  skillGaps: string[];
  experienceMatch: boolean;
  yearsFound: number | null;
  keywordHits: number;
  analysis: string;
}

export function calculateMatch(
  cvText: string,
  requiredSkills: string[],
  requiredYears: number | null,
  jobDescription: string | null
): MatchResult {
  const cvLower = cvText.toLowerCase();
  const cvWords = cvLower.split(/\s+/);

  // Skill matching
  const skillMatches: string[] = [];
  const skillGaps: string[] = [];

  for (const skill of requiredSkills) {
    const skillVariants = generateVariants(skill);
    const matched = skillVariants.some((v) => cvLower.includes(v));
    if (matched) {
      skillMatches.push(skill);
    } else {
      skillGaps.push(skill);
    }
  }

  // Experience years extraction
  const yearsFound = extractYearsOfExperience(cvText);
  const experienceMatch =
    !requiredYears || !yearsFound || yearsFound >= requiredYears;

  // Keyword matching from job description
  let keywordHits = 0;
  if (jobDescription) {
    const jobKeywords = extractKeywords(jobDescription);
    for (const kw of jobKeywords) {
      if (cvLower.includes(kw.toLowerCase())) keywordHits++;
    }
  }

  // Calculate overall score
  const skillScore =
    requiredSkills.length > 0
      ? (skillMatches.length / requiredSkills.length) * 50
      : 25;

  const expScore = experienceMatch ? 20 : Math.max(0, 20 - (requiredYears || 0) * 2);

  const keywordScore =
    keywordHits > 0 ? Math.min(20, (keywordHits / Math.max(10, keywordHits)) * 20) : 0;

  const cvRichness = Math.min(10, cvWords.length / 100);

  const totalScore = Math.round(skillScore + expScore + keywordScore + cvRichness + (yearsFound ? 0 : 0));
  const clampedScore = Math.min(100, Math.max(0, totalScore));

  // Analysis text
  const analysis = buildAnalysis(
    clampedScore,
    skillMatches,
    skillGaps,
    yearsFound,
    experienceMatch
  );

  return {
    score: clampedScore,
    skillMatches,
    skillGaps,
    experienceMatch,
    yearsFound,
    keywordHits,
    analysis,
  };
}

function generateVariants(skill: string): string[] {
  const base = skill.toLowerCase().trim();
  const variants = [base];

  // Common culinary term variants
  const expansions: Record<string, string[]> = {
    "cocina molecular": ["molecular", "cocina molecular"],
    "sous-vide": ["sous vide", "sous-vide"],
    "alta cocina": ["alta cocina", "haute cuisine", "fine dining"],
    "pasteleria": ["pasteleria", "pastry"],
    "panaderia": ["panaderia", "pan"],
    "cocina francesa": ["francesa", "french cuisine", "cocina francesa"],
    "cocina japonesa": ["japonesa", "japanese cuisine"],
    "cocina mediterranea": ["mediterranea", "mediterranean"],
    "gestion de equipos": ["gestion", "liderazgo", "equipos"],
    "costes": ["costes", "costos", "cost control", "food cost"],
    "control de calidad": ["calidad", "quality", "control"],
    "seguridad alimentaria": ["haccp", "seguridad alimentaria", "food safety"],
    "menu engineering": ["menu engineering", "ingenieria de menu", "menu"],
    "cocina en vivo": ["cocina en vivo", "show cooking"],
    "catering": ["catering", "eventos", "banquetes"],
    "inventario": ["inventario", "inventory", "stock"],
    "proveedores": ["proveedores", "suppliers", "compras"],
    "nutricion": ["nutricion", "nutrition", "dietetica"],
    "platos frios": ["frios", "cold kitchen", "garde manger"],
    "carnes": ["carnes", "butchery", "grill"],
    "pescados": ["pescados", "mariscos", "seafood"],
  };

  for (const [key, values] of Object.entries(expansions)) {
    if (base === key || base.includes(key)) {
      variants.push(...values);
    }
  }

  return [...new Set(variants)];
}

function extractYearsOfExperience(text: string): number | null {
  // Look for patterns like "8 años de experiencia", "5+ years", "diez años"
  const patterns = [
    /(\d+)\+?\s*(años?|years?|y)\s+de\s+experiencia/i,
    /(\d+)\+?\s*(años?|years?)\s+de\s+experiencia/i,
    /experiencia\s*:?\s*(\d+)\+?\s*(años?|years?)/i,
    /(\d+)\+?\s*(años?|years?)\s+en\s+(?:cocina|restauracion|hosteleria|hoteleria)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseInt(match[1]);
      if (!isNaN(years) && years > 0 && years < 60) return years;
    }
  }

  return null;
}

function extractKeywords(description: string): string[] {
  const stopWords = new Set([
    "el", "la", "los", "las", "un", "una", "de", "del", "al", "en", "y", "o",
    "con", "por", "para", "que", "es", "son", "se", "su", "sus", "al", "the",
    "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "is",
    "are", "we", "our", "looking", "seeking", "required", "must", "will",
  ]);

  return description
    .toLowerCase()
    .replace(/[^\w\sáéíóúüñ-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));
}

function buildAnalysis(
  score: number,
  matches: string[],
  gaps: string[],
  yearsFound: number | null,
  expMatch: boolean
): string {
  const parts: string[] = [];

  if (score >= 85) {
    parts.push("Candidato altamente alineado con el puesto.");
  } else if (score >= 60) {
    parts.push("Candidato con buena afinidad, con areas de desarrollo.");
  } else {
    parts.push("Candidato con baja afinidad al perfil requerido.");
  }

  if (matches.length > 0) {
    parts.push(`Fortalezas: ${matches.slice(0, 4).join(", ")}.`);
  }
  if (gaps.length > 0) {
    parts.push(`Areas a desarrollar: ${gaps.slice(0, 3).join(", ")}.`);
  }
  if (yearsFound) {
    parts.push(
      expMatch
        ? `Cumple con los años de experiencia (${yearsFound}).`
        : `Experiencia: ${yearsFound} años (requiere ${yearsFound + 2}+).`
    );
  }

  return parts.join(" ") + ` Puntaje final: ${score}/100.`;
}
