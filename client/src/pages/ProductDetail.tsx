import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Product } from "@shared/schema";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatTagLabel } from "@/lib/utils";

export default function ProductDetail() {
  const [, params] = useRoute<{ slug: string }>("/product/:slug");
  const slug = params?.slug ?? "";

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery<Product>({
    queryKey: ["/api/products/slug", slug],
    enabled: Boolean(slug),
  });

  const { addItem, isAdding } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      document.title = `${product.name} – BluePixelForge`;
    }
    return () => {
      document.title = "BluePixelForge";
    };
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () =>
          toast({
            title: "Added to cart",
            description: `${product.name} is ready in your cart.`,
          }),
        onError: () =>
          toast({
            title: "Unable to add item",
            description: "Please try again in a moment.",
            variant: "destructive",
          }),
      },
    );
  };

  const price = product ? Number.parseFloat(product.price) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/shop">Shop</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {product ? (
                    <BreadcrumbPage>{product.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbPage>Loading…</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
              <Link href="/shop">
                <ArrowLeft className="h-4 w-4" /> Back to marketplace
              </Link>
            </Button>

            {isLoading && <DetailSkeleton />}

            {!isLoading && (isError || !product) && (
              <div className="border border-dashed border-primary/30 rounded-3xl p-12 text-center">
                <p className="text-2xl font-semibold mb-2">Product unavailable</p>
                <p className="text-muted-foreground mb-6">
                  We could not find that listing. It may have been moved or archived.
                </p>
                <Button asChild>
                  <Link href="/shop">Browse other creations</Link>
                </Button>
              </div>
            )}

            {!isLoading && product && (
              <article className="grid gap-10 lg:grid-cols-[1.2fr_1fr] items-start">
                <div className="bg-muted/40 rounded-3xl overflow-hidden border border-primary/10 shadow-sm">
                  <img src={product.imageUrl} alt={product.name} className="w-full object-cover" />
                </div>

                <div>
                  <p className="text-sm uppercase text-primary tracking-wide mb-2">{product.category}</p>
                  <h1 className="text-4xl md:text-5xl font-semibold mb-4">{product.name}</h1>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                        {formatTagLabel(tag)}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-lg text-muted-foreground mb-8">{product.description}</p>

                  <div className="flex flex-wrap items-center gap-4 mb-8">
                    <span className="text-4xl font-bold">
                      {Number.isFinite(price) ? formatCurrency(price) : product.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Hand-finished in Nairobi. Worldwide shipping available.
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button className="gap-2" onClick={handleAddToCart} disabled={isAdding}>
                      <ShoppingCart className="h-4 w-4" />
                      Add to cart
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/cart">Go to cart</Link>
                    </Button>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <Skeleton className="rounded-3xl h-[420px]" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-12 w-1/3" />
        <div className="flex gap-3">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    </div>
  );
}
