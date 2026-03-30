import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Filter, RefreshCcw, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { cn, formatTagLabel } from "@/lib/utils";

type CatalogFacets = {
  categories: { name: string; slug: string; count: number }[];
  tags: { value: string; count: number }[];
};

export default function Shop() {
  const { data: facets, isLoading: facetsLoading } = useQuery<CatalogFacets>({
    queryKey: ["/api/catalog/facets"],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 400);

  const tagsKey = useMemo(() => selectedTags.slice().sort().join(","), [selectedTags]);
  const productsQueryKey = useMemo(
    () => ["/api/products", selectedCategory ?? "all", tagsKey || "none", debouncedSearch || "none"],
    [selectedCategory, tagsKey, debouncedSearch],
  );

  const {
    data: products,
    isLoading,
    isError,
  } = useQuery<Product[]>({
    queryKey: productsQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedTags.length) params.set("tags", selectedTags.join(","));
      if (debouncedSearch) params.set("q", debouncedSearch);
      const queryString = params.toString();
      const response = await fetch(`/api/products${queryString ? `?${queryString}` : ""}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load products");
      }
      return response.json();
    },
  });

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const showGuestBanner = !authLoading && !isAuthenticated && !bannerDismissed;

  const activeFilters = (selectedCategory ? 1 : 0) + selectedTags.length + (debouncedSearch ? 1 : 0);

  const topTags = useMemo(() => facets?.tags.slice(0, 12) ?? [], [facets]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setSearchTerm("");
  };

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

            <div className="bg-card/40 border border-primary/10 rounded-2xl p-6 md:p-8 shadow-sm mb-12">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-base font-semibold">Refine the marketplace</p>
                    <p className="text-sm text-muted-foreground">
                      Search by franchise, finish, or collection to find the perfect prop.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeFilters > 0 && (
                    <Badge variant="outline" className="text-xs uppercase tracking-wide">
                      {activeFilters} active
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={clearFilters}
                    disabled={activeFilters === 0}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 mt-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Search catalog</p>
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search props, finishes, or franchises"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Categories</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setSelectedCategory(null)}
                    >
                      All
                    </Button>
                    {facetsLoading && <Skeleton className="h-10 w-32" />}
                    {!facetsLoading &&
                      facets?.categories.map((category) => (
                        <Button
                          key={category.slug}
                          variant={selectedCategory === category.slug ? "default" : "outline"}
                          className={cn(
                            "rounded-full border-primary/30",
                            selectedCategory === category.slug ? "" : "border-dashed",
                          )}
                          onClick={() =>
                            setSelectedCategory((current) =>
                              current === category.slug ? null : category.slug,
                            )
                          }
                        >
                          {category.name}
                          <span className="ml-2 text-xs text-muted-foreground">{category.count}</span>
                        </Button>
                      ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Popular tags</p>
                  <div className="flex flex-wrap gap-2">
                    {facetsLoading && (
                      <>
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-20" />
                      </>
                    )}
                    {!facetsLoading && topTags.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Tag upcoming releases to unlock quick filters.
                      </p>
                    )}
                    {topTags.map((tag) => {
                      const isActive = selectedTags.includes(tag.value);
                      return (
                        <Badge
                          key={tag.value}
                          variant={isActive ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer select-none rounded-full px-3 py-1",
                            isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                          )}
                          onClick={() => toggleTag(tag.value)}
                        >
                          {formatTagLabel(tag.value)}
                          <span className="ml-2 text-xs text-muted-foreground">{tag.count}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
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
              <div className="text-center py-16 border border-dashed border-primary/30 rounded-2xl">
                <p className="text-lg font-semibold mb-2">No products matched those filters.</p>
                <p className="text-muted-foreground mb-6">Try removing a filter or searching a different phrase.</p>
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
