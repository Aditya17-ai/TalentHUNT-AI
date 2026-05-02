import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import {
  Sparkles, Target, TrendingUp, Briefcase,
  ArrowRight, Users, Building2, CheckCircle2, Zap,
} from "lucide-react";

/* ── animated counter ─────────────────────────────────────── */
const stats = [
  { label: "Jobs Matched", value: "50K+", icon: Briefcase },
  { label: "Companies", value: "2,400+", icon: Building2 },
  { label: "Job Seekers", value: "120K+", icon: Users },
  { label: "Match Accuracy", value: "95%", icon: Target },
];

/* ── how it works steps ───────────────────────────────────── */
const steps = [
  {
    icon: Briefcase,
    title: "Upload Your Resume",
    desc: "Our AI extracts and analyzes your skills, experience, and qualifications in seconds.",
    color: "from-violet-500 to-indigo-500",
    delay: "delay-100",
  },
  {
    icon: Sparkles,
    title: "AI Analyzes & Matches",
    desc: "Advanced algorithms compare your profile with thousands of job openings instantly.",
    color: "from-indigo-500 to-cyan-500",
    delay: "delay-200",
  },
  {
    icon: Target,
    title: "Get Perfect Matches",
    desc: "Receive ranked job recommendations with detailed compatibility scores and insights.",
    color: "from-cyan-500 to-emerald-500",
    delay: "delay-300",
  },
];

/* ── trust badges ─────────────────────────────────────────── */
const features = [
  "Instant AI analysis",
  "Real-time job matching",
  "Indeed & LinkedIn integration",
  "Privacy first — your data stays secure",
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background mesh-gradient overflow-hidden">
      <Navbar onAuthClick={() => navigate("/auth")} />

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-primary/8 blur-3xl animate-pulse" />
          <div className="absolute top-0 -right-24 w-[400px] h-[400px] rounded-full bg-purple-500/8 blur-3xl animate-pulse delay-300" />
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-emerald-500/6 blur-3xl animate-pulse delay-500" />
        </div>

        <div className="relative container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* left — copy */}
            <div className="space-y-8">
              {/* pill badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium text-primary shadow-soft">
                <Zap className="h-4 w-4 animate-bounce-subtle" />
                AI-Powered Job Matching · Now Live
              </div>

              <h1 className="animate-fade-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.08] tracking-tight">
                Find Your{" "}
                <span className="gradient-text">
                  Perfect Job
                </span>
                <br />
                with AI Precision
              </h1>

              <p className="animate-fade-up delay-200 text-xl text-muted-foreground leading-relaxed max-w-lg">
                Stop wasting time on irrelevant applications. Our AI analyzes your
                skills and matches you with roles that truly fit your expertise
                — in seconds.
              </p>

              {/* trust list */}
              <ul className="animate-fade-up delay-300 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="animate-fade-up delay-400 flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="h-13 px-8 text-base font-semibold rounded-xl shadow-medium animate-pulse-glow group"
                  style={{ background: "var(--gradient-hero)" }}
                  onClick={() => navigate("/auth")}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-13 px-8 text-base font-semibold rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 card-hover"
                >
                  See How It Works
                </Button>
              </div>
            </div>

            {/* right — floating visual */}
            <div className="relative hidden lg:flex items-center justify-center animate-fade-up delay-300">
              {/* outer glow ring */}
              <div className="absolute w-96 h-96 rounded-full bg-primary/10 blur-2xl animate-pulse" />

              {/* main card */}
              <div className="relative glass rounded-3xl p-8 shadow-strong glow-border w-full max-w-sm card-hover animate-float">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">AI Match Found!</p>
                    <p className="text-xs text-muted-foreground">3 new matches today</p>
                  </div>
                </div>

                {/* mock match cards */}
                {[
                  { role: "Senior React Developer", co: "Infosys", score: 96, color: "bg-emerald-500" },
                  { role: "Frontend Engineer", co: "Wipro Technologies", score: 89, color: "bg-blue-500" },
                  { role: "Full-Stack Developer", co: "TCS Digital", score: 84, color: "bg-violet-500" },
                ].map((m, i) => (
                  <div
                    key={m.role}
                    className={`flex items-center justify-between p-3 rounded-xl bg-background/60 mb-2 last:mb-0 animate-slide-right`}
                    style={{ animationDelay: `${400 + i * 100}ms` }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.role}</p>
                      <p className="text-xs text-muted-foreground">{m.co}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${m.color}`} />
                      <span className="text-sm font-bold text-foreground">{m.score}%</span>
                    </div>
                  </div>
                ))}

                {/* floating badges */}
                <div className="absolute -top-4 -right-4 glass rounded-xl px-3 py-2 shadow-medium animate-bounce-subtle">
                  <p className="text-xs font-bold text-emerald-600">+47% salary</p>
                </div>
                <div className="absolute -bottom-4 -left-4 glass rounded-xl px-3 py-2 shadow-medium animate-bounce-subtle delay-300">
                  <p className="text-xs font-bold text-primary">95% accurate</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── STAT STRIP ───────────────────────────────────────── */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ label, value, icon: Icon }, i) => (
              <div
                key={label}
                className={`animate-fade-up delay-${(i + 2) * 100} text-center p-6 rounded-2xl glass border border-primary/10 shadow-soft card-hover`}
              >
                <div className="flex justify-center mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold gradient-text stat-number">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-up">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4">
              Three steps to your{" "}
              <span className="gradient-text">dream job</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From resume upload to perfect match in under a minute
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, title, desc, color, delay }, i) => (
              <div
                key={title}
                className={`animate-fade-up ${delay} group relative p-8 rounded-3xl bg-card border border-border shadow-card card-hover overflow-hidden`}
              >
                {/* number watermark */}
                <span className="absolute top-4 right-6 text-8xl font-black text-primary/5 select-none">
                  {i + 1}
                </span>

                {/* icon */}
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>

                {/* hover line */}
                <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r ${color} transition-all duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div
            className="relative rounded-3xl p-12 text-center overflow-hidden animate-fade-up"
            style={{ background: "var(--gradient-hero)", backgroundSize: "200% 200%" }}
          >
            {/* decorative circles */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/10 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-white/10 translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              <Sparkles className="h-10 w-10 text-white/80 mx-auto mb-4 animate-bounce-subtle" />
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                Ready to Find Your Perfect Job?
              </h2>
              <p className="text-white/80 text-xl mb-10 max-w-2xl mx-auto">
                Join 120,000+ job seekers who found their dream roles with AI matching
              </p>
              <Button
                size="lg"
                className="h-14 px-10 text-base font-bold rounded-xl bg-white text-primary hover:bg-white/90 shadow-strong card-hover"
                onClick={() => navigate("/auth")}
              >
                Start Matching Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* footer strip */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        <p>© 2026 TalentHUNT AI — Built with ❤️ for job seekers everywhere</p>
      </footer>
    </div>
  );
};

export default Index;
