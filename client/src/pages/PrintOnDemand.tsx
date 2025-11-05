import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrintQuoteForm from "@/components/PrintQuoteForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, CheckCircle2 } from "lucide-react";

export default function PrintOnDemand() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-24 bg-gradient-to-b from-background to-card/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Printer className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Print on Demand
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your 3D model and get an instant quote. Fast turnaround, premium materials, and professional finishing.
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="flex gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Quick Quotes</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant pricing based on your model
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Multiple Materials</h3>
                  <p className="text-sm text-muted-foreground">
                    PLA, PETG, ABS, and SLA resin options
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Fast Turnaround</h3>
                  <p className="text-sm text-muted-foreground">
                    Orders processed within 24-48 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Form Section */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">Get Your Quote</CardTitle>
                  <CardDescription className="text-base">
                    Upload your 3D model file, select your preferred material, and generate an instant quote with detailed specifications.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PrintQuoteForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 bg-card/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                How It Works
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Upload Your Model</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose your 3D file (.stl, .obj, or .3mf format)
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Select Material</h3>
                    <p className="text-sm text-muted-foreground">
                      Pick from PLA, PETG, ABS, or SLA resin
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Get Instant Quote</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive detailed pricing, dimensions, and material requirements
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

