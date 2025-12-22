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
        },
        {
          id: '2',
          title: 'Backend Engineer (Demo)',
          company: 'DataSystems',
          description: 'Join our backend team building scalable APIs. (This is demo data because the database is not connected).',
          location: 'New York, NY',
          salary_range: '$130k - $150k',
          employment_type: 'Full-time',
          required_skills: ['Node.js', 'PostgreSQL', 'Python']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const seedJobs = async () => {
    setLoading(true);

    // Schema A: Template schema (includes 'requirements')
    const jobsSchemaA = [
      {
        title: 'Frontend Developer',
        company: 'TechCorp',
        description: 'We are looking for a React expert to join our dynamic team.',
        location: 'Remote',
        salary_range: '$100k - $120k',
        employment_type: 'Full-time',
        required_skills: ['React', 'TypeScript', 'Tailwind CSS'],
        requirements: "Strong proficiency in React, TypeScript, and Tailwind CSS.",
        is_active: true
      },
      {
        title: 'Backend Engineer',
        company: 'DataSystems',
        description: 'Join our backend team building scalable APIs.',
        location: 'New York, NY',
        salary_range: '$130k - $150k',
        employment_type: 'Full-time',
        required_skills: ['Node.js', 'PostgreSQL', 'Python'],
        requirements: "Experience with Node.js, PostgreSQL, and Python.",
        is_active: true
      },
      {
        title: 'Product Designer',
        company: 'CreativeStudio',
        description: 'Design beautiful interfaces and user experiences.',
        location: 'San Francisco, CA',
        salary_range: '$90k - $110k',
        employment_type: 'Contract',
        required_skills: ['Figma', 'UI/UX', 'Prototyping'],
        requirements: "Proficiency in Figma and prototyping tools.",
        is_active: true
      }
    ];

    // Schema B: Custom/Standard schema (NO 'requirements')
    const jobsSchemaB = jobsSchemaA.map(({ requirements, ...job }) => job);

    console.log("Attempting seed...");
    const { error: errorA } = await supabase.from('jobs').insert(jobsSchemaA);

    if (errorA) {
      console.warn("Schema A failed:", errorA.message);
      const { error: errorB } = await supabase.from('jobs').insert(jobsSchemaB);

      if (errorB) {
        console.error("Schema B failed:", errorB);
        if (errorB.code === 'PGRST205' || errorB.message?.includes("does not exist")) {
          toast.warning("Database tables missing! Showing sample data locally.");

          // Fallback to local state so user feels it works
          const localSamples = jobsSchemaA.map((j, i) => ({
            id: `sample-${Date.now()}-${i}`,
            title: j.title,
            company: j.company,
            description: j.description,
            location: j.location,
            salary_range: j.salary_range,
            employment_type: j.employment_type,
            required_skills: j.required_skills
          }));
          setJobs(prev => [...localSamples, ...prev]);
        } else {
          toast.error(`Failed to add jobs. DB Error: ${errorB.message}`);
        }
      } else {
        toast.success("Sample jobs added (using correct schema)!");
        fetchJobs();
      }
    } else {
      toast.success("Sample jobs added!");
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
        // Even if DB fails, show them in UI locally for the demo effect
        toast.error(`Import saved to local view only (DB Error: ${errorB.message})`);
        // Add to local state with generated IDs
        const localJobs = newJobs.map((j, i) => ({ ...j, id: `local-${Date.now()}-${i}` }));
        setJobs(prev => [...localJobs, ...prev]);
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
    return null; // Or a spinner
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
              <Button onClick={seedJobs} variant="outline" size="sm" className="hidden sm:flex">
                Add Samples
              </Button>
              <JobImportModal onImport={handleImportJobs} />
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card shadow-sm">
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">The job board is currently empty.</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={seedJobs} variant="outline">
                  Add Sample Jobs
                </Button>
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

                    <Button variant="hero" onClick={() => navigate(`/jobs/${job.id}`)}>View Details & Apply</Button>
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
