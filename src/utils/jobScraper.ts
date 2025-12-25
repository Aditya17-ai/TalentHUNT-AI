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

    // --- REAL SCRAPING STRATEGY ---
    // 1. Try Local Python Backend (Scrapy) - User Requested
    try {
        console.log(`[Scraper] Attempting Python Backend: http://localhost:5000/scrape`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const response = await fetch('http://localhost:5000/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: targetUrl }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.jobs.length > 0) {
                console.log(`[Scraper] Python Backend Success: Found ${data.jobs.length} jobs`);
                // Add source tag
                return data.jobs.map((j: any) => ({ ...j, source: 'Scrapy' }));
            }
        }
    } catch (err) {
        console.log("[Scraper] Python Backend offline or failed. Falling back to Browser Proxy.");
    }

    // 2. Browser Proxy Strategy (Existing Fallback)
    try {
        console.log(`[Scraper] Fetching via AllOrigins proxy: ${targetUrl}`);
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (!data.contents) throw new Error("Empty proxy response");

        const html = data.contents;
        const realJobs: ScrapedJob[] = [];

        // Strategy 2a: JSON-LD (Structured Data) - Best for Indeed/Google Jobs
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

        // Strategy 2b: DOM Parsing (Fallback)
        if (realJobs.length === 0) {
            console.log("[Scraper] JSON-LD failed, attempting DOM parsing...");
            const parser = new DOMParser();

            // We need to decode the HTML entities if it's coming from a JSON string sometimes, 
            // but here 'html' is likely the raw string. 
            // Note: DOMParser works best in browser context.
            const doc = parser.parseFromString(html, 'text/html');

            // Generic selectors for common job sites (heuristics)
            // Indeed uses lots of dynamic classes, but structure is somewhat stable.
            // We try to find cards.

            // Try OGP first (Open Graph) - Very reliable for single pages
            const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
            const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
            const ogSite = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');

            if (isUrl && ogTitle) {
                realJobs.push({
                    title: ogTitle,
                    company: ogSite || 'External Company',
                    location: 'See Link',
                    salary_range: 'Not specified',
                    employment_type: 'Full-time',
                    description: ogDesc || 'No description found',
                    required_skills: ['General'],
                    requirements: 'See link',
                    source: 'External',
                    external_link: targetUrl
                });
            } else {
                // Try List Parsing (e.g. searching for list items)
                // This is hard to do generically without specific site adapters, 
                // but let's try to find common "job card" patterns
                const jobCards = doc.querySelectorAll('div[class*="job"], div[class*="Job"], li[class*="result"]');

                jobCards.forEach((card, index) => {
                    if (index > 4) return; // Limit to 5

                    const title = card.querySelector('h2, h3, a[class*="title"]')?.textContent?.trim();
                    const company = card.querySelector('[class*="company"], [class*="Company"]')?.textContent?.trim();

                    if (title && title.length < 100) { // basic sanity check
                        realJobs.push({
                            title: title,
                            company: company || 'Unknown',
                            location: 'Remote/Hybrid',
                            salary_range: 'Competitive',
                            employment_type: 'Full-time',
                            description: 'Collected via web scraper.',
                            required_skills: [keyword],
                            requirements: 'Check listing',
                            source: 'External',
                            external_link: targetUrl
                        });
                    }
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
