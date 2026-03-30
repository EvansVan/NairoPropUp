import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@shared/schema";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { formatCurrency, formatTagLabel } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, isAdding } = useCart();
  const { toast } = useToast();
  const priceValue = Number.parseFloat(product.price);

  const handleAddToCart = () => {
    addItem(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to add item to cart. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Card className="overflow-hidden hover-elevate transition-all group" data-testid={`card-product-${product.id}`}>
      <Link
        href={`/product/${product.slug}`}
        className="aspect-square relative overflow-hidden bg-muted block"
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
      <CardContent className="p-4">
        <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">
          {product.category}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="font-semibold text-lg mb-2 inline-flex items-center hover:text-primary transition-colors"
          data-testid={`text-product-name-${product.id}`}
        >
          {product.name}
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[11px] font-medium">
                {formatTagLabel(tag)}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-2xl font-bold" data-testid={`text-product-price-${product.id}`}>
          {Number.isFinite(priceValue) ? formatCurrency(priceValue) : product.price}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          variant="outline"
          onClick={handleAddToCart}
          disabled={isAdding}
          data-testid={`button-add-to-cart-${product.id}`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
