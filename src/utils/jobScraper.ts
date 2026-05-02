import { v4 as uuidv4 } from 'uuid';

export interface ScrapedJob {
    title: string;
    company: string;
    location: string;
    salary_range: string;
    employment_type: string;
    description: string;
    required_skills: string[];
    requirements: string;
    source: 'Indeed' | 'Naukri' | 'LinkedIn' | 'Glassdoor' | 'External';
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
    console.log(`[Scraper] Starting for ${platform} - ${keyword}`);

    // Check if keyword is actually a URL
    const isUrl = keyword.startsWith('http');
    let targetUrl = '';

    if (isUrl) {
        targetUrl = keyword;
    } else {
        if (platform === 'Indeed') {
            targetUrl = `https://in.indeed.com/jobs?q=${encodeURIComponent(keyword)}`;
        } else if (platform === 'Naukri') {
            targetUrl = `https://www.naukri.com/${encodeURIComponent(keyword)}-jobs`;
        } else if (platform === 'LinkedIn') {
            targetUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}`;
        } else if (platform === 'Glassdoor') {
            targetUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(keyword)}`;
        } else {
            targetUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}+jobs+${platform}`;
        }
    }

    // --- REAL SCRAPING STRATEGY ---
    // Major job boards (Indeed, LinkedIn, Naukri, Glassdoor) actively block CORS proxies
    // with 403 errors, so we rely exclusively on the Python backend which handles scraping
    // server-side (and provides intelligent simulated data as a fallback).

    // In development the backend runs on localhost:5000; in production it's /api.
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ||
        (import.meta.env.DEV ? 'http://localhost:5000' : '/api');

    try {
        console.log(`[Scraper] Attempting Python Backend: ${BACKEND_URL}/scrape`);
        const controller = new AbortController();
        // 15s is plenty – backend returns simulated data quickly if scraping fails
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${BACKEND_URL}/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
                console.log(`[Scraper] Python Backend returned ${data.jobs.length} jobs`);
                return data.jobs.map((j: any) => ({
                    ...j,
                    source: j.source || platform,
                })) as ScrapedJob[];
            }
        }
        console.log('[Scraper] Backend returned empty or failed – using local simulation.');
    } catch (err) {
        console.log('[Scraper] Python Backend offline or timed out – using local simulation.', err);
    }

    // NOTE: CORS-proxy fallback removed.
    // Indeed, LinkedIn, Naukri, and Glassdoor all return HTTP 403 on every public
    // CORS proxy (corsproxy.io, allorigins, etc.). Fall straight through to simulation.


    // --- FALLBACK SIMULATION ---
    // If real scraping was blocked or failed, we return high-quality mock data
    // so the user experience doesn't break.

    // Simulate network delay
    const delay = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const count = Math.floor(Math.random() * 6) + 10;
    const jobs: ScrapedJob[] = [];

    // If it was a URL, try to guess context
    let searchTerm = keyword;
    if (isUrl) {
        searchTerm = 'Software Engineer'; // Default if scraping failed
        if (keyword.toLowerCase().includes('react')) searchTerm = 'React Developer';
        if (keyword.toLowerCase().includes('python')) searchTerm = 'Python Developer';
        if (keyword.toLowerCase().includes('design')) searchTerm = 'Product Designer';
    }

    const lowerKeyword = searchTerm.toLowerCase();
    let relevantSkills = ['General Skills'];
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
            title: `${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)}`,
            company: company,
            location: location,
            salary_range: '$80k - $120k',
            employment_type: 'Full-time',
            description: `(Simulated from ${platform}) We are looking for talented individuals. This data serves as a placeholder because the external site blocked the scraper.`,
            required_skills: relevantSkills.slice(0, 3),
            requirements: `Proven experience required.`,
            source: platform as any,
            external_link: targetUrl
        });
    }

    return jobs;
};
