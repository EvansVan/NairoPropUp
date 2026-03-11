import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShoppingCart, LogIn, UserPlus, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast({ title: "Logged out", description: "See you soon!" });
      setLocation("/");
    } catch {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

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

            {isAuthenticated ? (
              <>
                <Link href="/account">
                  <Button variant="ghost" size="sm" data-testid="button-account">
                    <Settings className="h-4 w-4 mr-1" />
                    Account
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {user?.username}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="button-login">
                    <LogIn className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="ghost" size="sm" data-testid="button-register">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Register
                  </Button>
                </Link>
              </>
            )}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                data-testid="button-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
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
            <Link href="/cart">
              <Button
                variant="ghost"
                className="w-full justify-start relative"
                data-testid="button-mobile-cart"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {itemCount > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/account">
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-mobile-account">
                    <Settings className="h-4 w-4 mr-2" />
                    My Account
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  data-testid="button-mobile-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout ({user?.username})
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-mobile-login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-mobile-register">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
