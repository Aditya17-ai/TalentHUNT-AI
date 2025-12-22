-- Create profiles table for candidate information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  parsed_content JSONB,
  skills TEXT[],
  experience_years INTEGER,
  education TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Resume policies
CREATE POLICY "Users can view own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  required_skills TEXT[],
  experience_required INTEGER,
  location TEXT,
  salary_range TEXT,
  employment_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs are viewable by all authenticated users
CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  USING (is_active = true);

-- Create job_matches table for AI matching results
CREATE TABLE public.job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  skill_match JSONB,
  experience_match JSONB,
  overall_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id, resume_id)
);

-- Enable RLS
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

-- Match policies
CREATE POLICY "Users can view own matches"
  ON public.job_matches FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample jobs
INSERT INTO public.jobs (title, company, description, requirements, required_skills, experience_required, location, salary_range, employment_type) VALUES
('Senior Full Stack Developer', 'TechCorp Inc', 'We are looking for an experienced Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies.', 'Bachelor''s degree in Computer Science or related field. 5+ years of experience in full stack development. Strong problem-solving skills and ability to work in a team.', ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'], 5, 'San Francisco, CA', '$120,000 - $160,000', 'Full-time'),
('AI/ML Engineer', 'InnovateAI', 'Join our AI team to build cutting-edge machine learning models. You will work on natural language processing, computer vision, and recommendation systems.', 'Master''s degree in Computer Science, AI, or related field. 3+ years of experience in ML/AI. Strong understanding of deep learning frameworks.', ARRAY['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Science'], 3, 'Remote', '$130,000 - $180,000', 'Full-time'),
('Frontend Developer', 'StartupXYZ', 'We need a talented Frontend Developer to create beautiful and responsive user interfaces. You will work closely with designers and backend developers.', '2+ years of frontend development experience. Strong knowledge of modern JavaScript frameworks. Eye for design and user experience.', ARRAY['React', 'JavaScript', 'CSS', 'HTML', 'Tailwind'], 2, 'New York, NY', '$80,000 - $110,000', 'Full-time'),
('DevOps Engineer', 'CloudSystems', 'Looking for a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You will ensure system reliability and scalability.', 'Bachelor''s degree in Computer Science or related field. 4+ years of DevOps experience. Strong knowledge of cloud platforms and containerization.', ARRAY['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform'], 4, 'Austin, TX', '$110,000 - $150,000', 'Full-time'),
('Data Scientist', 'DataDriven Corp', 'We are seeking a Data Scientist to analyze complex datasets and provide actionable insights. You will build predictive models and data visualizations.', 'PhD or Master''s in Statistics, Mathematics, or related field. 3+ years of data science experience. Strong statistical analysis skills.', ARRAY['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'], 3, 'Boston, MA', '$100,000 - $140,000', 'Full-time');