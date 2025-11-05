import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "#" },
    { label: "Services", href: "#services" },
  ];

  const handleNavClick = (href: string) => {
    if (href === "/") {
      // Navigate to home page
      setLocation("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMobileMenuOpen(false);
    } else if (href === "#") {
      // About button - scroll to top of carousel
      if (location !== "/") {
        setLocation("/");
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    } else if (href.startsWith("#")) {
      // Other sections
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
      } else if (location !== "/") {
        setLocation("/");
        setTimeout(() => {
          const el = document.querySelector(href);
          el?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <button
            onClick={() => handleNavClick("/")}
            className="flex items-center space-x-2 cursor-pointer"
            data-testid="button-logo"
          >
            <div className="flex items-center justify-center">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-primary">Nairo</span>
                <span className="text-foreground">PropUp</span>
              </span>
            </div>
          </button>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                onClick={() => handleNavClick(item.href)}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Button>
            ))}
            <Link href="/shop">
              <Button
                variant="default"
                size="sm"
                data-testid="button-shop"
              >
                Shop
              </Button>
            </Link>
          </nav>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border/40">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavClick(item.href)}
                data-testid={`link-mobile-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Button>
            ))}
            <Link href="/shop">
              <Button
                variant="default"
                className="w-full"
                data-testid="button-mobile-shop"
              >
                Shop
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
