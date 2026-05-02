import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { Briefcase, Zap } from "lucide-react";

interface NavbarProps {
  isAuthenticated?: boolean;
  onAuthClick?: () => void;
}

export const Navbar = ({ isAuthenticated = false, onAuthClick }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl shadow-medium border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-2.5 font-extrabold text-xl text-foreground hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span>
              Talent<span className="gradient-text">HUNT</span>
              <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary align-middle">AI</span>
            </span>
          </NavLink>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {[
                  { to: "/dashboard", label: "Dashboard" },
                  { to: "/jobs", label: "Browse Jobs" },
                  { to: "/applications", label: "Applications" },
                ].map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                    activeClassName="text-primary bg-primary/8 font-semibold"
                  >
                    {label}
                  </NavLink>
                ))}
              </>
            ) : (
              <>
                <NavLink
                  to="/"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                  activeClassName="text-primary bg-primary/8 font-semibold"
                >
                  Home
                </NavLink>
                <Button
                  className="ml-2 h-9 px-5 text-sm font-semibold rounded-lg shadow-soft group"
                  style={{ background: "var(--gradient-hero)" }}
                  onClick={onAuthClick}
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5 group-hover:animate-bounce-subtle" />
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
