import { useCart } from "@/hooks/useCart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { cart, isLoading, updateItem, removeItem } = useCart();
  const { toast } = useToast();

  const handleUpdateQuantity = (itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      updateItem({ itemId, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId, {
      onSuccess: () => {
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart.",
        });
      },
    });
  };

  const calculateTotal = () => {
    if (!cart) return 0;
    return cart.items.reduce(
      (sum, item) => sum + parseFloat(item.unitPriceSnapshot) * item.quantity,
      0
    );
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Shopping Cart</h1>
              <p className="text-muted-foreground text-lg">
                {isLoading ? "Loading..." : itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart` : "Your cart is empty"}
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="w-24 h-24" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Start adding items to your cart to see them here.
                </p>
                <Link href="/shop">
                  <Button>Continue Shopping</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {cart.items.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.product.category}
                          </p>
                          <p className="text-lg font-bold mb-4">
                            ${parseFloat(item.unitPriceSnapshot).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 border rounded">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {(parseFloat(item.unitPriceSnapshot) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="lg:col-span-1">
                  <Card className="p-6 sticky top-4">
                    <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">{calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-semibold">10.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-semibold">
                          {(calculateTotal() * 0.1).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-4">
                        <div className="flex justify-between text-xl font-bold">
                          <span>Total</span>
                          <span>KES {(calculateTotal() + 10 + calculateTotal() * 0.1).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <Link href="/checkout">
                      <Button className="w-full" size="lg">
                        Proceed to Checkout
                      </Button>
                    </Link>
                    <Link href="/shop">
                      <Button variant="outline" className="w-full mt-2">
                        Continue Shopping
                      </Button>
                    </Link>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
