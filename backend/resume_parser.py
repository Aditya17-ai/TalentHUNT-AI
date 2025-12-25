import re
import os
from pdfminer.high_level import extract_text
import docx

def parse_resume(file_path, file_ext):
    text = ""
    try:
        if file_ext == '.pdf':
            text = extract_text(file_path)
        elif file_ext == '.docx':
            doc = docx.Document(file_path)
            text = " ".join([para.text for para in doc.paragraphs])
        elif file_ext == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return None

    if not text:
        return None

    # Cleaning text
    clean_text = re.sub(r'\s+', ' ', text).strip()
    
    return extract_info(clean_text)

def extract_info(text):
    lower_text = text.lower()
    
    # 1. Email Extraction
    email = None
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        email = email_match.group(0)

    # 2. Phone Extraction (Generic)
    phone = None
    # Matches common formats like +1-123-456-7890, (123) 456-7890, etc.
    phone_match = re.search(r'(\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}', text)
    if phone_match:
        phone = phone_match.group(0)

    # 3. Skills Extraction
    COMMON_SKILLS = [
        "javascript", "typescript", "react", "node.js", "python", "java", "c++", "c#", "go", "rust",
        "html", "css", "sql", "postgresql", "mongodb", "aws", "docker", "kubernetes", "git", "graphql",
        "next.js", "vue", "angular", "express", "django", "flask", "springboot", "redux", "tailwind",
        "agile", "scrum", "jira", "figma", "machine learning", "ai", "nlp", "tensorflow", "pytorch",
        "pandas", "numpy", "scikit-learn", "keras", "opencv", "azure", "gcp", "linux", "bash"
    ]
    
    found_skills = list(set([skill for skill in COMMON_SKILLS if skill in lower_text]))

    # 4. Experience Years (Heuristic)
    experience_years = 0
    # Look for "5 years experience", "5+ years", etc.
    exp_regex = re.search(r'(\d+)\+?\s*(?:year|yr)s?', lower_text)
    if exp_regex:
        try:
            val = int(exp_regex.group(1))
            if val < 50: # Sanity check
                experience_years = val
        except:
            pass

    # 5. Education (Heuristic)
    education = "Not specified"
    if "phd" in lower_text or "doctorate" in lower_text:
        education = "PhD"
    elif "master" in lower_text or "mba" in lower_text or "m.s." in lower_text or "m.tech" in lower_text:
        education = "Master's Degree"
    elif "bachelor" in lower_text or "b.s." in lower_text or "b.a." in lower_text or "b.tech" in lower_text:
        education = "Bachelor's Degree"

    return {
        "email": email,
        "phone": phone,
        "skills": found_skills,
        "experience_years": experience_years,
        "education": education,
        "text_snippet": text[:2000] # Return first 2000 chars for preview
    }
