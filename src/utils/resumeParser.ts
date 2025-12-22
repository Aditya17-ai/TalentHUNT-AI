
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ParsedResume {
  text: string;
  skills: string[];
  education: string;
  experience_years: number;
}

const COMMON_SKILLS = [
  "javascript", "typescript", "react", "node.js", "python", "java", "cpp", "c++", "c#", "go", "rust",
  "html", "css", "sql", "postgresql", "mongodb", "aws", "docker", "kubernetes", "git", "graphql",
  "next.js", "vue", "angular", "express", "django", "flask", "springboot", "redux", "tailwind",
  "agile", "scrum", "jira", "figma", "machine learning", "ai", "nlp", "tensorflow", "pytorch"
];

export const parseResume = async (file: File): Promise<ParsedResume> => {
  if (file.type === "application/pdf") {
    return parsePdf(file);
  } else {
    // Basic fallback for text files or unknown types (treat as text if possible)
    return parseTextFile(file);
  }
};

const parsePdf = async (file: File): Promise<ParsedResume> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + " ";
  }

  return extractInfo(fullText);
};

const parseTextFile = async (file: File): Promise<ParsedResume> => {
  const text = await file.text();
  return extractInfo(text);
};

const extractInfo = (text: string): ParsedResume => {
  const lowerText = text.toLowerCase();

  // 1. Extract Skills
  const foundSkills = COMMON_SKILLS.filter(skill => 
    lowerText.includes(skill.toLowerCase())
  );

  // 2. Extract Experience (Simple Heuristic: Look for years nearby the word "experience")
  // e.g., "5 years experience", "experience: 3 years"
  let experience = 0;
  const expRegex = /(\d+)\+?\s*(?:year|yr)s?/i;
  const expMatch = text.match(expRegex);
  if (expMatch && expMatch[1]) {
    experience = parseInt(expMatch[1]);
  }

  // 3. Extract Education (Simple Heuristic: Look for degrees)
  let education = "Not specified";
  if (lowerText.includes("phd") || lowerText.includes("doctorate")) education = "PhD";
  else if (lowerText.includes("master") || lowerText.includes("m.s.") || lowerText.includes("mba")) education = "Master's Degree";
  else if (lowerText.includes("bachelor") || lowerText.includes("b.s.") || lowerText.includes("b.a.") || lowerText.includes("btech")) education = "Bachelor's Degree";

  return {
    text: text.slice(0, 2000), // storage limit precaution
    skills: [...new Set(foundSkills)], // remove duplicates
    experience_years: experience,
    education
  };
};
