
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
import { Briefcase, LogOut, User as UserIcon, FileText, Sparkles, MapPin, DollarSign } from "lucide-react";
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
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) setProfile(profile);

      // Fetch Resumes
      const { data: resumesData } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id);

      if (resumesData) {
        setResumes(resumesData);

        // If we have resumes, fetch active jobs to calculate matches
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_active', true)
          .limit(50); // Limit for performance

        if (jobsData && resumesData.length > 0) {
          setActiveJobs(jobsData);

          // Run AI Matching locally
          // Run AI Matching locally considers ALL resumes for best match
          const calculatedMatches = calculateBestMatches(resumesData, jobsData);

          // Transform for display
          const displayMatches = calculatedMatches.map(m => {
            const job = jobsData.find(j => j.id === m.job_id);
            return {
              ...job,
              score: m.score,
              matched_skills: m.skill_match.matched
            };
          });

          setMatches(displayMatches.slice(0, 6)); // Top 6
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={true} />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome, {profile?.full_name || user.email}
              </h1>
              <p className="text-muted-foreground">Manage your job applications and resume</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/jobs")}>
              <CardHeader>
                <Briefcase className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Browse Jobs</CardTitle>
                <CardDescription>Explore opportunities with AI matching</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="hero" className="w-full">View Jobs</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-medium transition-shadow">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Your Resume</CardTitle>
                <CardDescription>
                  {resumes.length > 0
                    ? `${resumes.length} resume${resumes.length > 1 ? 's' : ''} uploaded`
                    : 'Upload your resume for AI analysis'
                  }
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-medium transition-shadow">
              <CardHeader>
                <UserIcon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your information</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>Edit Profile</Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ResumeUpload userId={user.id} onUploadComplete={fetchDashboardData} />

            {resumes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Resumes</CardTitle>
                  <CardDescription>Your uploaded resumes with AI-extracted data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resumes.slice(0, 3).map((resume) => (
                    <div key={resume.id} className="p-4 bg-secondary/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          {resume.file_name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {resume.experience_years} yrs
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {resume.skills?.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {resume.skills?.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{resume.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      {resume.education && (
                        <p className="text-xs text-muted-foreground">
                          {resume.education}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="col-span-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>AI Job Matches</CardTitle>
                </div>
                {resumes.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => navigate("/jobs")}>
                    View All Jobs
                  </Button>
                )}
              </div>
              <CardDescription>
                {resumes.length > 0
                  ? "Jobs ranked by compatibility with your resume"
                  : "Upload your resume to start receiving AI-matched job recommendations"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Upload your resume above to get started</p>
                </div>
              ) : matches.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches.slice(0, 3).map((match) => (
                    <Card key={match.id} className="border-l-4 border-l-primary hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">{match.title}</h3>
                            <p className="text-sm text-muted-foreground">{match.company}</p>
                          </div>
                          <Badge variant={match.score > 80 ? "default" : match.score > 60 ? "secondary" : "outline"}>
                            {match.score}% Match
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {match.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {match.salary_range}
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-semibold mb-1">Matched Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {match.matched_skills.slice(0, 3).map(skill => (
                              <Badge key={skill} variant="outline" className="text-[10px] bg-green-500/10 text-green-700 border-green-200">
                                {skill}
                              </Badge>
                            ))}
                            {match.matched_skills.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">+{match.matched_skills.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full text-xs" size="sm" onClick={() => navigate(`/jobs/${match.id}`)}>
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No matches found yet. Try importing more jobs!</p>
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
