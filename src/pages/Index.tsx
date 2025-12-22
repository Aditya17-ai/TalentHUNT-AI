import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Sparkles, Target, TrendingUp, Briefcase } from "lucide-react";
import heroImage from "@/assets/hero-job-matching.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onAuthClick={() => navigate("/auth")} />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight">
                Find Your Perfect Job with{" "}
                <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  AI Matching
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Stop wasting time on irrelevant applications. Our AI analyzes your skills and matches you with jobs that truly fit your expertise.
              </p>
              <div className="flex gap-4">
                <Button variant="hero" size="lg" onClick={() => navigate("/auth")}>
                  Get Started Free
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>95% Match Accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>10x Faster</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="AI-powered job matching visualization" 
                className="rounded-2xl shadow-strong"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-secondary/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How TalentMatch AI Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to your dream job
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Upload Your Resume</CardTitle>
                <CardDescription>
                  Our AI extracts and analyzes your skills, experience, and qualifications
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Analyzes & Matches</CardTitle>
                <CardDescription>
                  Advanced algorithms compare your profile with thousands of job openings
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Get Perfect Matches</CardTitle>
                <CardDescription>
                  Receive ranked job recommendations with detailed match scores
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to Find Your Perfect Job?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of job seekers who found their dream roles with AI matching
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate("/auth")}>
            Start Matching Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
