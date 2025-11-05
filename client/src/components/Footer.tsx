import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { SiEtsy } from "react-icons/si";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const scrollToSection = (href: string) => {
    if (href === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (href.startsWith("#")) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              <span className="text-primary">Nairo</span>
              <span>PropUp</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Professional prop making and 3D printing studio for creatives and artists in Nairobi, Kenya.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <nav className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                onClick={() => scrollToSection("/")}
                data-testid="link-footer-home"
              >
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                onClick={() => scrollToSection("#about")}
                data-testid="link-footer-about"
              >
                About
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                onClick={() => scrollToSection("#services")}
                data-testid="link-footer-services"
              >
                Services
              </Button>
              <Link href="/shop">
                <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                onClick={() => scrollToSection("#services")}
                data-testid="link-footer-services"
              >
                Shop
              </Button>
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span data-testid="text-contact-email">imbo@nairopropup.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span data-testid="text-contact-phone">+254 7167 676767</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span data-testid="text-contact-location">Nairobi Kenya</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                className="hover-elevate"
                data-testid="button-social-instagram"
              >
                <Instagram className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hover-elevate"
                data-testid="button-social-facebook"
              >
                <Facebook className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hover-elevate"
                data-testid="button-social-twitter"
              >
                <Twitter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hover-elevate"
                data-testid="button-social-etsy"
              >
                <SiEtsy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            © {new Date().getFullYear()} NairoPropUp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
