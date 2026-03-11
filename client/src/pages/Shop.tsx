import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Shop() {
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const showGuestBanner = !authLoading && !isAuthenticated && !bannerDismissed;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            {/* Guest nudge banner */}
            {showGuestBanner && (
              <div className="flex items-center justify-between gap-4 mb-8 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">Browsing as guest.</span>{" "}
                  You can add items to cart and checkout without an account.{" "}
                  <Link href="/register" className="text-primary underline underline-offset-2 font-medium">
                    Create an account
                  </Link>{" "}
                  or{" "}
                  <Link href="/login" className="text-primary underline underline-offset-2 font-medium">
                    log in
                  </Link>{" "}
                  to save order history.
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="mb-12">
              <h1
                className="text-4xl md:text-5xl font-bold mb-4"
                data-testid="text-shop-title"
              >
                Our Marketplace
              </h1>
              <p
                className="text-muted-foreground text-lg max-w-2xl"
                data-testid="text-shop-subtitle"
              >
                Browse our collection of premium props, 3D prints, and custom
                creations
              </p>
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && isError && (
              <p className="text-destructive">
                Failed to load products. Please try again later.
              </p>
            )}

            {!isLoading && !isError && products && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!isLoading && !isError && (!products || products.length === 0) && (
              <p className="text-muted-foreground">No products available yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
