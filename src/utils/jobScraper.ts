import { v4 as uuidv4 } from 'uuid';

export interface ScrapedJob {
    title: string;
    company: string;
    location: string;
    salary_range: string;
    employment_type: string;
    description: string;
    required_skills: string[];
    requirements: string; // Adding for compatibility
    source: 'Indeed' | 'Naukri' | 'LinkedIn' | 'Glassdoor';
    external_link: string;
}

const COMPANIES = [
    'TechCorp', 'DataSystems', 'CreativeStudio', 'InnovateX', 'CloudScale',
    'FutureNet', 'SoftSolutions', 'WebWizards', 'AppMasters', 'AI Frontiers'
];

const LOCATIONS = [
    'Remote', 'New York, NY', 'San Francisco, CA', 'Austin, TX', 'Seattle, WA',
    'Bangalore, KA', 'Mumbai, MH', 'Delhi, NCR', 'Hyderabad, TS', 'Pune, MH'
];

const SKILLS_MAP: Record<string, string[]> = {
    'frontend': ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Redux'],
    'backend': ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
    'design': ['Figma', 'UI/UX', 'Adobe XD', 'Prototyping', 'User Research'],
    'marketing': ['SEO', 'Content Marketing', 'Google Analytics', 'Social Media', 'Copywriting'],
    'data': ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Tableau']
};

export const simulateScraping = async (
    platform: string,
    keyword: string
): Promise<ScrapedJob[]> => {
    // Simulate network delay (1.5s to 3s)
    const delay = Math.random() * 1500 + 1500;
    await new Promise(resolve => setTimeout(resolve, delay));

    const count = Math.floor(Math.random() * 4) + 2; // 2 to 5 jobs
    const jobs: ScrapedJob[] = [];

    const lowerKeyword = keyword.toLowerCase();
    let relevantSkills = ['General Skills'];

    // Find relevant skills based on keyword
    for (const [key, skills] of Object.entries(SKILLS_MAP)) {
        if (lowerKeyword.includes(key)) {
            relevantSkills = skills;
            break;
        }
    }

    for (let i = 0; i < count; i++) {
        const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
        const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

        jobs.push({
            title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${platform === 'Naukri' ? 'Developer' : 'Specialist'}`,
            company: company,
            location: location,
            salary_range: platform === 'Naukri' ? '₹12L - ₹25L PA' : '$80k - $120k',
            employment_type: 'Full-time',
            description: `Exciting opportunity for a ${keyword} at ${company}. We are looking for talented individuals to join our team. This position is sourced from ${platform}.`,
            required_skills: relevantSkills.slice(0, 3), // Take first 3 relevant skills
            requirements: `Proven experience as a ${keyword}. Strong knowledge of ${relevantSkills.join(', ')}.`,
            source: platform as any,
            external_link: `https://www.${platform.toLowerCase()}.com/jobs?q=${encodeURIComponent(keyword)}`
        });
    }

    return jobs;
};
