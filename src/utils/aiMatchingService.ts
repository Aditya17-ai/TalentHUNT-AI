import { Job } from "@/pages/Jobs";

export interface JobMatchResult {
    job_id: string;
    score: number;
    skill_match: {
        matched: string[];
        missing: string[];
        score: number;
    };
    overall_analysis: string;
}

export const calculateJobMatch = (resume: any, job: Job): JobMatchResult => {
    // 1. Skill Match (70% weight)
    const resumeSkills = (resume.skills || []).map((s: string) => s.toLowerCase());
    const jobSkills = (job.required_skills || []).map((s: string) => s.toLowerCase());

    // Avoid division by zero
    if (jobSkills.length === 0) {
        return {
            job_id: job.id,
            score: 0,
            skill_match: { matched: [], missing: [], score: 0 },
            overall_analysis: "No skills required for this job."
        };
    }

    const matchedSkills = jobSkills.filter((skill: string) =>
        resumeSkills.some((rSkill: string) => rSkill.includes(skill) || skill.includes(rSkill))
    );

    const missingSkills = jobSkills.filter((skill: string) =>
        !resumeSkills.some((rSkill: string) => rSkill.includes(skill) || skill.includes(rSkill))
    );

    // Jaccard-like score: (Matched / Total Required)
    const skillScore = (matchedSkills.length / jobSkills.length) * 100;

    // 2. Experience Match (20% weight)
    let experienceScore = 0;
    const resumeExp = resume.experience_years || 0;
    const jobExp = job.experience_required || 0;

    if (resumeExp >= jobExp) {
        experienceScore = 100;
    } else {
        // Linearly decrease: e.g. Job needs 5, has 3 => (3/5)*100 = 60
        experienceScore = (resumeExp / (jobExp || 1)) * 100;
    }

    // 3. Role/Title Match (10% weight) - Bonus
    let roleScore = 0;
    const jobTitle = job.title.toLowerCase();
    // Simple heuristic: if resume text snippet contains job title words
    // In a real app, strict title matching is better, here we assume extraction might be imperfect
    if (resume.parsed_content && typeof resume.parsed_content === 'string') {
        if (resume.parsed_content.toLowerCase().includes(jobTitle)) {
            roleScore = 100;
        }
    } else {
        // Fallback: check against skills as sometimes roles are skills (e.g. "React Developer")
        if (resumeSkills.some((s: string) => jobTitle.includes(s))) {
            roleScore = 50;
        }
    }

    // Weighted Total
    // Skills (70%) + Experience (20%) + Role (10%)
    const totalScore = Math.round(
        (skillScore * 0.7) +
        (experienceScore * 0.2) +
        (roleScore * 0.1)
    );

    // Analysis Text
    let analysis = `Match Score: ${totalScore}%. `;
    if (totalScore > 80) analysis += "Excellent match! You have most required skills.";
    else if (totalScore > 60) analysis += "Good potential. You meet core requirements.";
    else analysis += "Some gaps found. Consider upskilling.";

    return {
        job_id: job.id,
        score: totalScore,
        skill_match: {
            matched: matchedSkills,
            missing: missingSkills,
            score: skillScore
        },
        overall_analysis: analysis
    };
};

export const batchCalculateMatches = (resume: any, jobs: Job[]): JobMatchResult[] => {
    return jobs.map(job => calculateJobMatch(resume, job)).sort((a, b) => b.score - a.score);
};
