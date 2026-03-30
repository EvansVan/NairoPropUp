import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Link } from "wouter";

interface OrderResponse {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  shippingFee: string;
  total: string;
  currency: string;
  paymentStatus: string;
  paymentProvider: string | null;
  shippingAddress?: string;
  customerEmail?: string;
  customerName?: string;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    nameSnapshot: string;
    priceSnapshot: string;
    quantity: number;
    total: string;
  }>;
}

export default function Orders() {
  const [match, params] = useRoute("/orders/:orderId");
  const orderId = params?.orderId as string | undefined;
  const [emailLookup, setEmailLookup] = useState("");

  const { data: order, isLoading, error } = useQuery<OrderResponse>({
    queryKey: ["/api/orders", orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("No order ID");
      const res = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Order not found");
      return res.json();
    },
    enabled: !!orderId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="py-20 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
              <Skeleton className="h-12 w-64 mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Skeleton className="h-96" />
                </div>
                <div>
                  <Skeleton className="h-96" />
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="py-20 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
              <Link href="/shop">
                <Button variant="ghost" className="mb-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Shop
                </Button>
              </Link>
              <Card className="p-12 text-center">
                <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
                <p className="text-muted-foreground">
                  We couldn't find the order you're looking for. Please check the order number and try again.
                </p>
              </Card>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "bg-green-500/10 text-green-700";
      case "PENDING":
      case "REQUIRES_ACTION":
        return "bg-yellow-500/10 text-yellow-700";
      case "FAILED":
      case "REFUNDED":
        return "bg-red-500/10 text-red-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return <CheckCircle2 className="w-5 h-5" />;
      case "PENDING":
      case "REQUIRES_ACTION":
        return <Clock className="w-5 h-5" />;
      case "FAILED":
      case "REFUNDED":
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <Link href="/shop">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Order Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Order {order.orderNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.paymentStatus)}
                        <Badge className={getStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                          <div>
                            <p className="font-medium">{item.nameSnapshot}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {order.currency} {parseFloat(item.total).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @ {order.currency} {parseFloat(item.priceSnapshot).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>
                        {order.currency} {parseFloat(order.subtotal).toFixed(2)}
                      </span>
                    </div>

                    {parseFloat(order.shippingFee) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>
                          {order.currency} {parseFloat(order.shippingFee).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {parseFloat(order.taxTotal) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>
                          {order.currency} {parseFloat(order.taxTotal).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>
                        {order.currency} {parseFloat(order.total).toFixed(2)}
                      </span>
                    </div>

                    <Separator />

                    {order.paymentStatus !== "PAID" && (
                      <Button className="w-full" variant="default">
                        Continue Payment
                      </Button>
                    )}

                    {order.paymentStatus === "PAID" && (
                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-sm text-green-700 font-medium">
                          Payment completed successfully
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Email</p>
                      <p className="font-medium">{order.customerEmail || "Not provided"}</p>
                    </div>

                    {order.shippingAddress && (
                      <div>
                        <p className="text-muted-foreground mb-1">Shipping Address</p>
                        <p className="font-medium">{order.shippingAddress}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-muted-foreground mb-1">Status</p>
                      <p className="font-medium capitalize">{order.status}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
