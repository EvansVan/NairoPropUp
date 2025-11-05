import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";

export default function Shop() {
  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // todo: remove mock functionality
  const mockProducts: Product[] = [
    {
      id: "1",
      name: "Cyberpunk Helmet Prop",
      description: "High-quality 3D printed helmet with LED integration and weathering effects",
      price: "149.99",
      imageUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500&h=500&fit=crop",
      category: "Props"
    },
    {
      id: "2",
      name: "Fantasy Sword Replica",
      description: "Detailed replica with metallic finish and leather-wrapped handle",
      price: "89.99",
      imageUrl: "https://images.unsplash.com/photo-1609840114035-3c981c7fec2d?w=500&h=500&fit=crop",
      category: "Weapons"
    },
    {
      id: "3",
      name: "Sci-Fi Gauntlet",
      description: "Articulated armor piece with LED accents and premium paint job",
      price: "199.99",
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
      category: "Armor"
    },
    {
      id: "4",
      name: "Dragon Figurine",
      description: "Hand-painted miniature with intricate scale details and custom base",
      price: "45.99",
      imageUrl: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=500&h=500&fit=crop",
      category: "Miniatures"
    },
    {
      id: "5",
      name: "Steampunk Goggles",
      description: "Vintage-style goggles with brass detailing and adjustable straps",
      price: "64.99",
      imageUrl: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=500&h=500&fit=crop",
      category: "Accessories"
    },
    {
      id: "6",
      name: "Wizard Staff Prop",
      description: "6-foot tall staff with LED crystal orb and detailed carvings",
      price: "179.99",
      imageUrl: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=500&h=500&fit=crop",
      category: "Props"
    },
    {
      id: "7",
      name: "Space Marine Shoulder Pad",
      description: "Wearable armor piece with battle damage and custom insignia",
      price: "79.99",
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
      category: "Armor"
    },
    {
      id: "8",
      name: "Medieval Shield",
      description: "Detailed replica with family crest and authentic weathering",
      price: "129.99",
      imageUrl: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=500&h=500&fit=crop",
      category: "Props"
    },
  ];

  const displayProducts = (!isError && products && products.length > 0) ? products : mockProducts;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-shop-title">
                Our Marketplace
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl" data-testid="text-shop-subtitle">
                Browse our collection of premium props, 3D prints, and custom creations
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
