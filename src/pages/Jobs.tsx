import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Briefcase, DollarSign, Sparkles } from "lucide-react";
import { JobImportModal } from "@/components/JobImportModal";
import { PostJobModal, JobFormData } from "@/components/PostJobModal";
import { ScrapedJob } from "@/utils/jobScraper";

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary_range: string;
  employment_type: string;
  required_skills: string[];
}

const Jobs = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setJobs(data);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.warn("Database connection failed, using demo data:", err);
      // Fallback to demo data
      setJobs([
        {
          id: '1',
          title: 'Frontend Developer (Demo)',
          company: 'TechCorp',
          description: 'We are looking for a React expert to join our dynamic team. (This is demo data because the database is not connected).',
          location: 'Remote',
          salary_range: '$100k - $120k',
          employment_type: 'Full-time',
          required_skills: ['React', 'TypeScript', 'Tailwind CSS']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (jobData: JobFormData) => {
    setLoading(true);

    const newJobPayload = {
      ...jobData,
      is_active: true
    };

    // Try Schema A (Template - with requirements)
    const { error: errorA } = await supabase.from('jobs').insert([newJobPayload]);

    if (errorA) {
      console.warn("Schema A failed:", errorA.message);

      // Try Schema B (Standard - no requirements)
      const { requirements, ...schemaBPayload } = newJobPayload;
      const { error: errorB } = await supabase.from('jobs').insert([schemaBPayload]);

      if (errorB) {
        console.error("Schema B failed:", errorB);
        toast.warning("Database unavailable. Posting job locally.");

        // Add to local state
        const localJob = {
          id: `local-${Date.now()}`,
          ...jobData
        };
        setJobs(prev => [localJob as unknown as Job, ...prev]);
      } else {
        toast.success("Job posted successfully!");
        fetchJobs();
      }
    } else {
      toast.success("Job posted successfully!");
      fetchJobs();
    }
    setLoading(false);
  };

  const handleImportJobs = async (importedJobs: ScrapedJob[]) => {
    setLoading(true);

    const newJobs = importedJobs.map(job => ({
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      salary_range: job.salary_range,
      employment_type: job.employment_type,
      required_skills: job.required_skills,
      requirements: job.requirements,
      is_active: true
    }));

    // Try Schema A first
    const { error: errorA } = await supabase.from('jobs').insert(newJobs);

    if (errorA) {
      console.error("Import Schema A failed:", errorA.message);
      // Try Schema B (no requirements)
      const newJobsB = newJobs.map(({ requirements, ...job }) => job);
      const { error: errorB } = await supabase.from('jobs').insert(newJobsB);

      if (errorB) {
        console.error("Import Schema B failed:", errorB);
        toast.error(`Import saved to local view only (DB Error: ${errorB.message})`);
        const localJobs = newJobs.map((j, i) => ({ ...j, id: `local-import-${Date.now()}-${i}` }));
        setJobs(prev => [...localJobs as unknown as Job[], ...prev]);
      } else {
        toast.success("Jobs imported successfully!");
        fetchJobs();
      }
    } else {
      toast.success("Jobs imported successfully!");
      fetchJobs();
    }
    setLoading(false);
  };

  if (!user || loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Browse Jobs</h1>
              <p className="text-muted-foreground">Discover opportunities matched to your skills</p>
            </div>
            <div className="flex gap-2">
              <PostJobModal onPost={handlePostJob} triggerLabel="Post Job" />
              <JobImportModal onImport={handleImportJobs} />
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card shadow-sm">
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">The job board is currently empty.</p>
              <div className="flex gap-4 justify-center">
                <PostJobModal onPost={handlePostJob} triggerLabel="Add Job Manually" />
                <JobImportModal onImport={handleImportJobs} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                        <CardDescription className="text-lg font-semibold text-foreground">
                          {job.company}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success">
                        <Sparkles className="h-3 w-3 mr-1" />
                        New
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {job.salary_range}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        {job.employment_type}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills?.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        )) || <span className="text-xs text-muted-foreground">No specific skills listed</span>}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="hero" onClick={() => navigate(`/jobs/${job.id}`)}>
                        View Details & Apply
                      </Button>

                      {job.external_link && (
                        <Button variant="outline" asChild>
                          <a href={job.external_link} target="_blank" rel="noopener noreferrer">
                            Apply on {job.company.includes('Indeed') ? 'Indeed' : 'Original Site'} ↗
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Jobs;
