import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import helmetImage from "@assets/generated_images/3D_printed_sci-fi_helmet_prop_8dfc7e10.png";
import miniaturesImage from "@assets/generated_images/Custom_painted_miniature_props_d4d89a00.png";
import printerImage from "@assets/generated_images/3D_printer_creating_custom_prop_944c16a5.png";
import armorImage from "@assets/generated_images/Custom_cosplay_armor_prop_collection_45455984.png";

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollToServices = () => {
    const element = document.querySelector("#services");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const slides = [
    {
      type: "intro",
      content: null,
    },
    { type: "showcase", image: helmetImage, title: "3D Printed Helmets", category: "Custom Props" },
    { type: "showcase", image: miniaturesImage, title: "Painted Miniatures", category: "Detail Work" },
    { type: "showcase", image: printerImage, title: "Print On Demand", category: "Technology" },
    { type: "showcase", image: armorImage, title: "Cosplay Armor", category: "Costume Props" },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-screen">
      <div className="w-full h-full">
        <div className="relative h-full w-full">
          {/* Slides container fills the viewport */}
          {currentSlide === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center" data-testid="slide-intro">
              <div className="text-center space-y-8 px-4">
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight" data-testid="text-hero-title">
                    Crafting Custom
                    <span className="block text-primary">Props & 3D Prints</span>
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-subtitle">
                    Africas Newest Home for Custom Prop Design & 3D Printing services for creatives and artists. Elevate your storytelling and bring your concepts from the 3d space to life with our services.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={scrollToServices}
                    data-testid="button-explore-services"
                  >
                    Explore Services
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.location.href = "/shop"}
                    data-testid="button-visit-shop"
                  >
                    Visit Shop
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="absolute inset-0"
              data-testid={`card-showcase-${currentSlide}`}
            >
              <img
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-8 md:p-12">
                <div>
                  <p className="text-base md:text-lg text-primary font-semibold mb-2">
                    {slides[currentSlide].category}
                  </p>
                  <p className="text-3xl md:text-5xl font-bold text-white">
                    {slides[currentSlide].title}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons at screen edges */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 md:pl-6 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/60 hover:bg-background/80"
              onClick={prevSlide}
              data-testid="button-carousel-prev"
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-3 md:pr-6 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/60 hover:bg-background/80"
              onClick={nextSlide}
              data-testid="button-carousel-next"
            >
              <ChevronRight className="h-7 w-7" />
            </Button>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-30">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlide === index ? "bg-primary w-8" : "bg-muted-foreground/30"
                }`}
                data-testid={`button-carousel-dot-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
