import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MapPin, Briefcase, DollarSign, Sparkles,
  ArrowRight, ExternalLink, Search, Clock,
} from "lucide-react";
import { JobImportModal } from "@/components/JobImportModal";
import { PostJobModal, JobFormData } from "@/components/PostJobModal";
import { ScrapedJob } from "@/utils/jobScraper";

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary_range: string;
  employment_type: string;
  required_skills: string[];
  experience_required?: number;
  external_link?: string;
}

/* Source badge color map */
const sourceColor: Record<string, string> = {
  Indeed:   "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  LinkedIn: "bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-400 dark:border-sky-800",
  Naukri:   "bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-800",
  Glassdoor:"bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
};

const Jobs = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) navigate("/auth");
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs").select("*").eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setJobs(data && data.length > 0 ? data : []);
    } catch (err) {
      console.warn("DB failed, using demo data:", err);
      setJobs([{
        id: '1',
        title: 'Frontend Developer (Demo)',
        company: 'TechCorp',
        description: 'We are looking for a React expert to join our dynamic team. This is demo data because the database is not connected.',
        location: 'Remote',
        salary_range: '₹12L - ₹20L/yr',
        employment_type: 'Full-time',
        required_skills: ['React', 'TypeScript', 'Tailwind CSS'],
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (jobData: JobFormData) => {
    setLoading(true);
    const { error } = await supabase.from('jobs').insert([{ ...jobData, is_active: true }]);
    if (error) {
      toast.warning("Database unavailable. Posting job locally.");
      setJobs(prev => [{ id: `local-${Date.now()}`, ...jobData } as unknown as Job, ...prev]);
    } else {
      toast.success("Job posted successfully!");
      fetchJobs();
    }
    setLoading(false);
  };

  const handleImportJobs = async (importedJobs: ScrapedJob[]) => {
    setLoading(true);
    const unique = importedJobs.filter((job, idx, self) =>
      idx === self.findIndex(t => t.title === job.title && t.company === job.company)
    );
    const payload = unique
      .filter(job => !jobs.some(e => e.title === job.title && e.company === job.company))
      .map(job => ({
        title: job.title, company: job.company, description: job.description,
        location: job.location, salary_range: job.salary_range,
        employment_type: job.employment_type, required_skills: job.required_skills,
        requirements: job.requirements || "See full job description for requirements.",
        is_active: true, external_link: job.external_link,
      }));

    if (payload.length === 0) {
      toast.info("No new jobs to import (all duplicates).");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('jobs').insert(payload);
    if (error) {
      toast.error(`Import saved locally (DB Error: ${error.message})`);
      setJobs(prev => [...payload.map((j, i) => ({ ...j, id: `local-import-${Date.now()}-${i}` })) as unknown as Job[], ...prev]);
    } else {
      toast.success("Jobs imported successfully!");
      fetchJobs();
    }
    setLoading(false);
  };

  const filtered = jobs.filter(j =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase()) ||
    j.location.toLowerCase().includes(search.toLowerCase())
  );

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background mesh-gradient">
        <div className="text-center animate-fade-in">
          <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center mb-4 animate-pulse-glow" style={{ background: "var(--gradient-hero)" }}>
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading jobs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mesh-gradient">
      <Navbar isAuthenticated={true} />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">

          {/* ── PAGE HEADER ──────────────────────────────────── */}
          <div className="animate-fade-up mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">Opportunities</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                  Browse <span className="gradient-text">Jobs</span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  {jobs.length > 0 ? `${jobs.length} positions available` : "Discover opportunities matched to your skills"}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <PostJobModal onPost={handlePostJob} triggerLabel="Post Job" />
                <JobImportModal onImport={handleImportJobs} />
              </div>
            </div>

            {/* search bar */}
            {jobs.length > 0 && (
              <div className="relative mt-5 animate-fade-up delay-100">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by title, company, or location…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-soft"
                />
              </div>
            )}
          </div>

          {/* ── EMPTY STATE ──────────────────────────────────── */}
          {jobs.length === 0 ? (
            <div className="animate-fade-up text-center py-20 rounded-2xl border-2 border-dashed border-border bg-card/50">
              <div className="h-20 w-20 rounded-3xl mx-auto flex items-center justify-center mb-5 bg-primary/8 animate-float">
                <Briefcase className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No jobs yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                The job board is empty. Post a job manually or import from Indeed, LinkedIn, and Naukri.
              </p>
              <div className="flex gap-3 justify-center">
                <PostJobModal onPost={handlePostJob} triggerLabel="Post a Job" />
                <JobImportModal onImport={handleImportJobs} />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="animate-fade-up text-center py-16">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="font-semibold text-foreground">No results for "{search}"</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different keyword</p>
            </div>
          ) : (
            /* ── JOB CARDS ─────────────────────────────────── */
            <div className="space-y-4">
              {filtered.map((job, i) => {
                const src = (job as any).source as string | undefined;
                const srcKey = src?.split(' ')[0] ?? '';
                return (
                  <div
                    key={job.id}
                    className="animate-fade-up group relative bg-card rounded-2xl border border-border shadow-card overflow-hidden card-hover"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* hover gradient strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="p-6">
                      {/* header row */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {job.title}
                          </h2>
                          <p className="text-base font-semibold text-muted-foreground">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {src && (
                            <Badge variant="outline" className={`text-xs rounded-lg hidden sm:flex ${sourceColor[srcKey] ?? "bg-secondary text-secondary-foreground border-border"}`}>
                              {src}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs rounded-lg bg-emerald-500/8 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">
                            <Sparkles className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        </div>
                      </div>

                      {/* description */}
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">
                        {job.description}
                      </p>

                      {/* meta chips */}
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                          {job.salary_range}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          {job.employment_type}
                        </div>
                      </div>

                      {/* skills */}
                      {job.required_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {job.required_skills.slice(0, 6).map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs rounded-lg px-2.5 py-0.5 font-medium"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {job.required_skills.length > 6 && (
                            <Badge variant="secondary" className="text-xs rounded-lg px-2.5 py-0.5 text-muted-foreground">
                              +{job.required_skills.length - 6}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* action row */}
                      <div className="flex gap-3 pt-1">
                        <Button
                          className="rounded-xl text-sm font-semibold group/btn flex-1 sm:flex-none"
                          style={{ background: "var(--gradient-hero)" }}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          View Details & Apply
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Button>

                        {job.external_link && (
                          <Button
                            variant="outline"
                            className="rounded-xl text-sm gap-2 border-2 hover:border-primary/40"
                            asChild
                          >
                            <a href={job.external_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              <span className="hidden sm:inline">Apply on {srcKey || 'Site'}</span>
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Jobs;
