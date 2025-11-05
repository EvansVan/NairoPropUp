import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Palette, Calendar, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import MeetingRequestForm from "./MeetingRequestForm";

export default function ServicesSection() {
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [, setLocation] = useLocation();

  const services = [
    {
      icon: Printer,
      title: "Print on Demand",
      description: "High-quality 3D printing services for your custom designs. Fast turnaround and premium materials.",
      action: "Get a Quote",
      onClick: () => setLocation("/print-on-demand"),
    },
    {
      icon: Palette,
      title: "Custom Works",
      description: "Bespoke prop creation and design services tailored to your exact specifications and vision.",
      action: "Get Started",
      onClick: () => console.log("Custom Works clicked"),
    },
    {
      icon: Calendar,
      title: "Request a Meeting",
      description: "Schedule a consultation to discuss your project requirements and get expert advice.",
      action: showMeetingForm ? "Hide Form" : "Book Now",
      onClick: () => setShowMeetingForm(!showMeetingForm),
      isForm: true,
    },
    {
      icon: ShoppingBag,
      title: "Shop",
      description: "Browse our marketplace for ready-made props, prints, and unique creative products.",
      action: "Visit Shop",
      onClick: () => window.location.href = "/shop",
    },
  ];

  return (
    <section id="services" className="py-20 md:py-24 bg-card/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-services-title">
            Our Services
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-services-subtitle">
            From concept to creation, we provide comprehensive prop making and 3D printing solutions
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="hover-elevate transition-all flex flex-col h-full"
                data-testid={`card-service-${index}`}
              >
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl mb-2">{service.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {service.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={service.onClick}
                    data-testid={`button-service-${index}`}
                  >
                    {service.action}
                    {service.isForm && (
                      showMeetingForm ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {showMeetingForm && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Consultation</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you to confirm your appointment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MeetingRequestForm onSuccess={() => setShowMeetingForm(false)} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
