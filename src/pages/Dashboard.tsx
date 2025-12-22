import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Briefcase, LogOut, User as UserIcon, FileText, Sparkles } from "lucide-react";

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
      fetchProfile();
      fetchResumes();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
  };

  const fetchResumes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching resumes:", error);
    } else {
      setResumes(data || []);
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
            <ResumeUpload userId={user.id} onUploadComplete={fetchResumes} />

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

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Job Matches</CardTitle>
              </div>
              <CardDescription>
                {resumes.length > 0
                  ? "Your AI-powered job matches will appear here"
                  : "Upload your resume to start receiving AI-matched job recommendations"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {resumes.length > 0 ? (
                  <div className="space-y-4">
                    <p>Browse jobs to see your match scores</p>
                    <Button variant="hero" onClick={() => navigate("/jobs")}>
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <p>Upload your resume above to get started</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
