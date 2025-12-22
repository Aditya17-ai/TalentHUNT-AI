import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { Briefcase } from "lucide-react";

interface NavbarProps {
  isAuthenticated?: boolean;
  onAuthClick?: () => void;
}

export const Navbar = ({ isAuthenticated = false, onAuthClick }: NavbarProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors">
            <Briefcase className="h-6 w-6 text-primary" />
            <span>TalentMatch AI</span>
          </NavLink>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <NavLink 
                  to="/dashboard" 
                  className="text-foreground hover:text-primary transition-colors"
                  activeClassName="text-primary font-semibold"
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/jobs" 
                  className="text-foreground hover:text-primary transition-colors"
                  activeClassName="text-primary font-semibold"
                >
                  Browse Jobs
                </NavLink>
              </>
            ) : (
              <>
                <NavLink 
                  to="/" 
                  className="text-foreground hover:text-primary transition-colors"
                  activeClassName="text-primary font-semibold"
                >
                  Home
                </NavLink>
                <Button variant="hero" onClick={onAuthClick}>
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
