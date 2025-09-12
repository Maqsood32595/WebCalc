import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    } else {
      window.location.href = "/api/login";
    }
  };

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="fixed top-0 w-full z-50 gradient-primary text-white shadow-lg">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div 
            className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent cursor-pointer"
            onClick={() => setLocation('/')}
            data-testid="logo-webcalc"
          >
            Webcalc
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => setLocation('/dashboard')}
                className="hover:text-blue-100 transition-colors"
                data-testid="link-dashboard"
              >
                Dashboard
              </button>
              <button 
                onClick={() => setLocation('/builder')}
                className="hover:text-blue-100 transition-colors"
                data-testid="link-builder"
              >
                Builder
              </button>
            </>
          ) : (
            <>
              <a href="#features" className="hover:text-blue-100 transition-colors">Features</a>
              <a href="#templates" className="hover:text-blue-100 transition-colors">Templates</a>
              <a href="#pricing" className="hover:text-blue-100 transition-colors">Pricing</a>
            </>
          )}
        </div>
        
        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-blue-100" data-testid="text-welcome">
                Welcome, {user?.firstName || 'User'}!
              </span>
              <Button 
                variant="outline" 
                className="text-white border-white/30 hover:bg-white/10"
                onClick={handleSignOut}
                data-testid="button-sign-out"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
              <Button 
                className="gradient-secondary text-white font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                onClick={handleGetStarted}
                data-testid="button-get-started"
              >
                Get Started Free
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/10 backdrop-blur-lg border-t border-white/20">
          <div className="container mx-auto px-6 py-4 space-y-4">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => {
                    setLocation('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 hover:text-blue-100 transition-colors"
                  data-testid="mobile-link-dashboard"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => {
                    setLocation('/builder');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 hover:text-blue-100 transition-colors"
                  data-testid="mobile-link-builder"
                >
                  Builder
                </button>
                <div className="pt-2 border-t border-white/20">
                  <div className="text-sm text-blue-100 mb-2">
                    Welcome, {user?.firstName || 'User'}!
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full text-white border-white/30 hover:bg-white/10"
                    onClick={handleSignOut}
                    data-testid="mobile-button-sign-out"
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <a 
                  href="#features" 
                  className="block py-2 hover:text-blue-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#templates" 
                  className="block py-2 hover:text-blue-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Templates
                </a>
                <a 
                  href="#pricing" 
                  className="block py-2 hover:text-blue-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <div className="pt-2 border-t border-white/20 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full text-white border-white/30 hover:bg-white/10"
                    onClick={() => window.location.href = "/api/login"}
                    data-testid="mobile-button-sign-in"
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="w-full gradient-secondary text-white font-semibold"
                    onClick={handleGetStarted}
                    data-testid="mobile-button-get-started"
                  >
                    Get Started Free
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
