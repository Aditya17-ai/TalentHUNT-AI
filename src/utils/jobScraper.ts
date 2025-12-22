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
        } else {
            targetUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}+jobs+${platform}`;
        }
    }

    // --- REAL SCRAPING ATTEMPT ---
    try {
        console.log(`[Scraper] Fetching via proxy: ${targetUrl}`);
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.contents) throw new Error("Empty proxy response");

        const html = data.contents;
        const realJobs: ScrapedJob[] = [];

        // Strategy 1: JSON-LD (Structured Data)
        // Most modern job sites (including jobcode.in potentially) use Schema.org/JobPosting
        const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
        let match;

        while ((match = jsonLdRegex.exec(html)) !== null) {
            try {
                const jsonContent = match[1];
                const cleanJson = jsonContent.replace(/\n/g, '');
                const parsed = JSON.parse(cleanJson);
                const items = Array.isArray(parsed) ? parsed : [parsed];

                items.forEach((item: any) => {
                    const type = item['@type'];
                    if (type === 'JobPosting' || (type === 'ListItem' && item.item?.['@type'] === 'JobPosting')) {
                        const job = type === 'ListItem' ? item.item : item;

                        if (job && job.title) {
                            realJobs.push({
                                title: job.title,
                                company: job.hiringOrganization?.name || 'Unknown Company',
                                location: job.jobLocation?.address?.addressLocality || job.jobLocation?.address || 'Remote',
                                salary_range: job.baseSalary?.value ?
                                    `${job.baseSalary.value.minValue || ''} - ${job.baseSalary.value.maxValue || ''} ${job.baseSalary.currency || ''}` :
                                    'Competitive',
                                employment_type: job.employmentType || 'Full-time',
                                description: job.description ? job.description.replace(/<[^>]*>/g, ' ').slice(0, 300) + '...' : 'Available on website.',
                                required_skills: [isUrl ? 'See Description' : keyword, 'Adaptability'],
                                requirements: 'See full job description on source website.',
                                source: 'External',
                                external_link: job.url || targetUrl
                            });
                        }
                    }
                });
            } catch (e) { /* continued */ }
        }

        // Strategy 2: Meta Tags (Open Graph) - Good for single job pages like jobcode.in specific links
        if (realJobs.length === 0 && isUrl) {
            const getMeta = (name: string) => {
                const regex = new RegExp(`<meta property="${name}" content="([^"]*)"`, 'i');
                const m = html.match(regex);
                return m ? m[1] : null;
            };

            const ogTitle = getMeta('og:title');
            const ogDesc = getMeta('og:description');

            if (ogTitle) {
                realJobs.push({
                    title: ogTitle,
                    company: 'External Company', // Often in title like "Role at Company"
                    location: 'Check Link',
                    salary_range: 'Not specified',
                    employment_type: 'Full-time',
                    description: ogDesc || 'No description found',
                    required_skills: ['General'],
                    requirements: 'See link',
                    source: 'External',
                    external_link: targetUrl
                });
            }
        }

        if (realJobs.length > 0) {
            console.log(`[Scraper] Successfully accepted ${realJobs.length} real jobs`);
            return realJobs.slice(0, 5);
        }

        console.log("[Scraper] No structured data found, reverting to simulation.");

    } catch (error) {
        console.warn("[Scraper] Real fetch failed:", error);
    }

    // --- FALLBACK SIMULATION ---
    // If real scraping was blocked or failed, we return high-quality mock data
    // so the user experience doesn't break.

    // Simulate network delay
    const delay = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const count = Math.floor(Math.random() * 4) + 2;
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
            external_link: isUrl ? keyword : `https://google.com/search?q=${searchTerm}`
        });
    }

    return jobs;
};
