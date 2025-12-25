from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os
from zenrows import ZenRowsClient
from scrapy.selector import Selector

app = Flask(__name__)
CORS(app)

# Replace with your actual key if you have one, or set via nice UI later
ZENROWS_API_KEY = "04f46eac5dda12dcfe8afdad4c168599f6262438" 

from resume_parser import parse_resume
import tempfile

@app.route('/parse-resume', methods=['POST'])
def parser_resume_endpoint():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Save temp
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file.filename)
    file.save(temp_path)

    try:
        ext = os.path.splitext(file.filename)[1].lower()
        result = parse_resume(temp_path, ext)
        
        if result:
            return jsonify({"success": True, "data": result})
        else:
            return jsonify({"success": False, "error": "Could not parse file"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({"error": "URL is required"}), 400

    print(f"Scraping URL: {url}")

    # --- STRATEGY 1: ZENROWS (If Key Provided) ---
    if ZENROWS_API_KEY and ZENROWS_API_KEY != "YOUR_ZENROWS_KEY_HERE":
        try:
            print("Using ZenRows...")
            client = ZenRowsClient(ZENROWS_API_KEY)
            response = client.get(url, params={"js_render": "true", "premium_proxy": "true"})
            
            # Simple parsing using Scrapy Selector (so we re-use XPath knowledge)
            sel = Selector(text=response.text)
            jobs = []
            
            # Re-using the logic from our spider slightly simplified
            # Indeed Selectors
            cards = sel.css('div.job_seen_beacon')
            for card in cards:
                title = card.css('a span[id^="jobTitle"]::text').get() or card.css('.jobTitle span::text').get()
                if title:
                    jobs.append({
                        'title': title,
                        'company': card.css('span[data-testid="company-name"]::text').get() or 'Unknown',
                        'location': card.css('div[data-testid="text-location"]::text').get() or 'Remote',
                        'external_link': "https://in.indeed.com" + (card.css('a.jcs-JobTitle::attr(href)').get() or ""),
                        'source': 'Indeed (ZenRows)'
                    })
            
            return jsonify({"success": True, "jobs": jobs})
        except Exception as e:
            print(f"ZenRows failed: {e}")
            # Fallback to local spider

    # --- STRATEGY 2: LOCAL SCRAPY SPIDER ---
    
    # Remove previous results
    if os.path.exists('scraped_results.json'):
        os.remove('scraped_results.json')

    try:
        # Use python -m scrapy to ensure we use the same environment
        command = [
            'python', '-m', 'scrapy', 'runspider', 'job_spider.py',
            '-a', f'url={url}',
            '-O', 'scraped_results.json' 
        ]
        
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        if result.returncode != 0:
            print("Scrapy Error Output:", result.stderr)
            # Don't fail immediately, check if file exists (maybe warnings)
        
        # Read results
        if os.path.exists('scraped_results.json'):
            with open('scraped_results.json', 'r', encoding='utf-8') as f:
                try:
                    results = json.load(f)
                    return jsonify({"success": True, "jobs": results})
                except json.JSONDecodeError:
                    return jsonify({"success": True, "jobs": []}) # Empty file = 0 jobs
        else:
            # File wasn't created -> 0 jobs found (or hard fail)
            # Return empty list instead of 404 to satisfy frontend
            return jsonify({"success": True, "jobs": []})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
