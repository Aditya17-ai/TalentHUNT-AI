import scrapy
import json
import os

class JobSpider(scrapy.Spider):
    name = "job_spider"
    
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 5,
        'COOKIES_ENABLED': True,
        'HTTPERROR_ALLOW_ALL': True, # Allow all error codes to be passed to parse
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        }
    }
    
    def __init__(self, url=None, *args, **kwargs):
        super(JobSpider, self).__init__(*args, **kwargs)
        if url:
            self.start_urls = [url]
        else:
            self.start_urls = []

    def parse(self, response):
        # DEBUG: Save HTML to inspect seeing what we get
        with open('debug.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
            
        found = False
        
        # Strategy 1: JSON-LD (Structured Data)
        ld_json_scripts = response.xpath('//script[@type="application/ld+json"]/text()').getall()
        for script in ld_json_scripts:
            try:
                data = json.loads(script)
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if item.get('@type') == 'JobPosting':
                        found = True
                        yield self.parse_job_posting(item, response.url)
                    elif item.get('@type') == 'ListItem' and item.get('item', {}).get('@type') == 'JobPosting':
                        found = True
                        yield self.parse_job_posting(item['item'], response.url)
            except: continue

        # Strategy 2: Indeed Specific Selectors (Fallback)
        if not found:
            # Indeed 2024/2025 Layout Selectors (Updated)
            # Try multiple container types
            indeed_cards = response.css('div.job_seen_beacon, td.resultContent, div.cardOutline, div.slider_container')
            
            for card in indeed_cards:
                # Title selectors
                title = (
                    card.css('h2.jobTitle span::text').get() or 
                    card.css('a[id^="job_"] span::text').get() or
                    card.css('.jobTitle a span::text').get() or
                    card.css('a.jcs-JobTitle span::text').get()
                )
                
                if not title: continue
                
                # Company selectors
                company = (
                    card.css('span[data-testid="company-name"]::text').get() or 
                    card.css('span.companyName::text').get() or
                    card.css('.company_location [data-testid="company-name"]::text').get()
                )
                
                # Location selectors
                location = (
                    card.css('div[data-testid="text-location"]::text').get() or 
                    card.css('div.companyLocation::text').get() or
                    card.css('.company_location [data-testid="text-location"]::text').get()
                )
                
                # Try to clean up URL
                link_href = card.xpath('.//a[contains(@class, "jcs-JobTitle")]/@href').get()
                if link_href and not link_href.startswith('http'):
                    link_href = "https://in.indeed.com" + link_href

                if title:
                    found = True
                    yield {
                        'title': title,
                        'company': company or 'Unknown',
                        'location': location or 'Remote',
                        'salary_range': 'Competitive',
                        'employment_type': 'Full-time',
                        'description': 'See full details on Indeed.',
                        'required_skills': ['Check Description'],
                        'requirements': 'See listing.',
                        'source': 'Indeed (Scraped)',
                        'external_link': link_href or response.url
                    }

        # Strategy 3: Open Graph (Last Resort)
        if not found:
            # ... (Open Graph logic)
            og_title = response.xpath('//meta[@property="og:title"]/@content').get()
            og_desc = response.xpath('//meta[@property="og:description"]/@content').get()
            og_site = response.xpath('//meta[@property="og:site_name"]/@content').get() or 'External Site'
            
            if og_title:
                yield {
                    'title': og_title,
                    'company': og_site,
                    'location': 'See Link',
                    'salary_range': 'Competitive',
                    'employment_type': 'Full-time',
                    'description': og_desc or "No description available.",
                    'required_skills': ['General'],
                    'requirements': 'See job link for details.',
                    'source': 'External',
                    'external_link': response.url
                }

    def parse_job_posting(self, item, url):
        return {
            'title': item.get('title', 'Unknown Title'),
            'company': item.get('hiringOrganization', {}).get('name', 'Unknown Company'),
            'location': self.get_location(item),
            'salary_range': self.get_salary(item),
            'employment_type': item.get('employmentType', 'Full-time'),
            'description': self.clean_html(item.get('description', '')),
            'required_skills': ['See Description'], # Skills often not explicit in Schema
            'requirements': 'See full description.',
            'source': 'External',
            'external_link': item.get('url', url)
        }

    def get_location(self, item):
        loc = item.get('jobLocation', {})
        if isinstance(loc, list): loc = loc[0] if loc else {}
        if isinstance(loc.get('address'), dict):
            return loc.get('address', {}).get('addressLocality', 'Remote')
        return 'Remote'

    def get_salary(self, item):
        sal = item.get('baseSalary', {})
        if isinstance(sal, dict) and 'value' in sal:
            val = sal['value']
            if isinstance(val, dict):
                return f"{val.get('minValue', '')} - {val.get('maxValue', '')} {val.get('currency', 'USD')}"
        return 'Competitive'

    def clean_html(self, raw_html):
        # Very basic tag stripper
        return scrapy.Selector(text=raw_html).xpath('string(/)').get() or "No description."
