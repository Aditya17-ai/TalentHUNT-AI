import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Job } from "./Jobs";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Briefcase, LogOut, User as UserIcon, FileText,
  Sparkles, MapPin, DollarSign, TrendingUp, ArrowRight,
  Clock, CheckCircle2,
} from "lucide-react";
import { calculateBestMatches } from "@/utils/aiMatchingService";

interface Resume {
  id: string;
  file_name: string;
  skills: string[];
  experience_years: number;
  education: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      if (profile) setProfile(profile);

      const { data: resumesData } = await supabase
        .from('resumes').select('*').eq('user_id', user.id);
      if (resumesData) {
        setResumes(resumesData);
        const { data: jobsData } = await supabase
          .from('jobs').select('*').eq('is_active', true).limit(50);
        if (jobsData && resumesData.length > 0) {
          setActiveJobs(jobsData);
          const calculatedMatches = calculateBestMatches(resumesData, jobsData);
          const displayMatches = calculatedMatches.map(m => {
            const job = jobsData.find(j => j.id === m.job_id);
            return { ...job, score: m.score, matched_skills: m.skill_match.matched };
          });
          setMatches(displayMatches.slice(0, 6));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background mesh-gradient">
      <Navbar isAuthenticated={true} />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl space-y-8">

          {/* ── WELCOME HEADER ──────────────────────────────── */}
          <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{greeting} 👋</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground capitalize">
                Welcome back, <span className="gradient-text">{displayName}</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                {matches.length > 0
                  ? `You have ${matches.length} AI-matched jobs waiting`
                  : "Upload your resume to start your AI-powered job search"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="self-start sm:self-center gap-2 rounded-xl border-2 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* ── QUICK ACTION CARDS ───────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-5">
            {/* Browse Jobs */}
            <div
              className="animate-fade-up delay-100 group relative p-6 rounded-2xl overflow-hidden cursor-pointer card-hover border border-border bg-card shadow-card"
              onClick={() => navigate("/jobs")}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, hsl(231 76% 58% / 0.06), hsl(270 76% 58% / 0.04))" }} />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 shadow-soft" style={{ background: "var(--gradient-hero)" }}>
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1">Browse Jobs</h3>
                <p className="text-sm text-muted-foreground mb-4">Explore opportunities with AI matching</p>
                <Button size="sm" className="rounded-lg w-full group/btn" style={{ background: "var(--gradient-hero)" }}>
                  View Jobs
                  <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Resume */}
            <div className="animate-fade-up delay-200 group relative p-6 rounded-2xl overflow-hidden border border-border bg-card shadow-card card-hover">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, hsl(160 80% 38% / 0.06), hsl(190 80% 40% / 0.04))" }} />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 shadow-soft" style={{ background: "var(--gradient-accent)" }}>
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1">Your Resume</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {resumes.length > 0
                    ? `${resumes.length} resume${resumes.length > 1 ? 's' : ''} uploaded & analyzed`
                    : 'Upload your resume for AI analysis'}
                </p>
                <div className="flex items-center gap-2">
                  {resumes.length > 0
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <Clock className="h-4 w-4 text-muted-foreground" />
                  }
                  <span className="text-xs text-muted-foreground">
                    {resumes.length > 0 ? "Resume ready" : "Pending upload"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className="animate-fade-up delay-300 group relative p-6 rounded-2xl overflow-hidden border border-border bg-card shadow-card card-hover">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, hsl(22 90% 60% / 0.06), hsl(340 80% 58% / 0.04))" }} />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 shadow-soft" style={{ background: "var(--gradient-warm)" }}>
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1">Profile</h3>
                <p className="text-sm text-muted-foreground mb-4">Update your information & preferences</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg w-full border-2 hover:border-primary/40"
                  onClick={() => navigate("/profile")}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* ── RESUME UPLOAD + RECENT RESUMES ──────────────── */}
          <div className="grid lg:grid-cols-2 gap-6 animate-fade-up delay-400">
            <ResumeUpload userId={user.id} onUploadComplete={fetchDashboardData} />

            {resumes.length > 0 && (
              <Card className="shadow-card border-border rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Recent Resumes</CardTitle>
                      <CardDescription className="text-xs">AI-extracted skills & experience</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {resumes.slice(0, 3).map((resume, i) => (
                    <div
                      key={resume.id}
                      className="group p-4 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors border border-border/50 space-y-2 animate-slide-right"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm flex items-center gap-2 text-foreground">
                          <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{resume.file_name}</span>
                        </p>
                        <Badge variant="outline" className="text-xs rounded-lg flex-shrink-0">
                          {resume.experience_years} yrs exp
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resume.skills?.slice(0, 5).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[11px] rounded-md px-2 py-0">
                            {skill}
                          </Badge>
                        ))}
                        {resume.skills?.length > 5 && (
                          <Badge variant="secondary" className="text-[11px] rounded-md px-2 py-0 text-muted-foreground">
                            +{resume.skills.length - 5} more
                          </Badge>
                        )}
                      </div>
                      {resume.education && (
                        <p className="text-xs text-muted-foreground truncate">{resume.education}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── AI JOB MATCHES ──────────────────────────────── */}
          <Card className="animate-fade-up delay-500 shadow-card border-border rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border bg-secondary/30 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Job Matches</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {resumes.length > 0 ? "Ranked by compatibility with your resume" : "Upload your resume to see matches"}
                    </CardDescription>
                  </div>
                </div>
                {resumes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs gap-1.5"
                    onClick={() => navigate("/jobs")}
                  >
                    View All
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {resumes.length === 0 ? (
                <div className="text-center py-14">
                  <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center bg-primary/8 mb-4 animate-float">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground mb-1">No resume yet</p>
                  <p className="text-sm text-muted-foreground">Upload your resume above to start receiving AI-matched job recommendations</p>
                </div>
              ) : matches.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches.slice(0, 3).map((match, i) => {
                    const scoreColor =
                      match.score > 80 ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                      match.score > 60 ? "text-blue-600 bg-blue-50 border-blue-200" :
                                         "text-muted-foreground bg-secondary border-border";
                    return (
                      <div
                        key={match.id}
                        className="animate-fade-up group relative rounded-xl border border-border bg-card shadow-soft overflow-hidden card-hover"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {/* score accent bar */}
                        <div
                          className="h-1 w-full"
                          style={{
                            background: match.score > 80
                              ? "var(--gradient-accent)"
                              : match.score > 60
                              ? "var(--gradient-hero)"
                              : "hsl(var(--muted))",
                          }}
                        />
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-semibold text-base text-foreground line-clamp-1">{match.title}</h3>
                              <p className="text-sm text-muted-foreground">{match.company}</p>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex-shrink-0 ${scoreColor}`}>
                              {match.score}%
                            </span>
                          </div>

                          <div className="space-y-1.5 mb-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" /> {match.location}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3 w-3 flex-shrink-0" /> {match.salary_range}
                            </div>
                          </div>

                          {/* match score bar */}
                          <div className="mb-3">
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${match.score}%`,
                                  background: match.score > 80 ? "var(--gradient-accent)" : "var(--gradient-hero)",
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-4">
                            {match.matched_skills.slice(0, 3).map((skill: string) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="text-[10px] px-2 py-0 rounded-md bg-emerald-500/8 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
                              >
                                ✓ {skill}
                              </Badge>
                            ))}
                            {match.matched_skills.length > 3 && (
                              <span className="text-[10px] text-muted-foreground self-center">
                                +{match.matched_skills.length - 3} more
                              </span>
                            )}
                          </div>

                          <Button
                            size="sm"
                            className="w-full rounded-lg text-xs group/btn"
                            style={{ background: "var(--gradient-hero)" }}
                            onClick={() => navigate(`/jobs/${match.id}`)}
                          >
                            View Details
                            <ArrowRight className="ml-1.5 h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-14">
                  <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center bg-secondary mb-4 animate-float">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground mb-1">No matches yet</p>
                  <p className="text-sm text-muted-foreground">
                    Try importing more jobs to find your perfect match!
                  </p>
                  <Button className="mt-4 rounded-lg" size="sm" onClick={() => navigate("/jobs")}>
                    Browse Jobs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
