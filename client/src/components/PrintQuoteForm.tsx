import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Package, Ruler, DollarSign } from "lucide-react";

interface QuoteResult {
  modelPreview: string;
  height: number;
  grams: number;
  price: number;
}

export default function PrintQuoteForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [material, setMaterial] = useState<string>("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const materialOptions = [
    { value: "PLA", label: "PLA (Budget-Friendly)" },
    { value: "PETG", label: "PETG (Durable)" },
    { value: "ABS", label: "ABS (Strong)" },
    { value: "SLA", label: "SLA (Resin - High Detail)" },
  ];

  const materialMultipliers: Record<string, number> = {
    PLA: 1.0,
    PETG: 1.2,
    ABS: 1.1,
    SLA: 2.5,
  };

  const baseRate = 0.05; // Base rate per gram

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith(".stl") || file.name.endsWith(".obj") || file.name.endsWith(".3mf"))) {
      setSelectedFile(file);
      // For now, we'll generate a placeholder preview
      setQuote(null);
    } else {
      alert("Please upload a valid 3D model file (.stl, .obj, or .3mf)");
    }
  };

  const generateQuote = async () => {
    if (!selectedFile || !material) {
      alert("Please select both a file and material type");
      return;
    }

    setIsGenerating(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock calculation based on file size
    const fileSizeKB = selectedFile.size / 1024;
    const multiplier = materialMultipliers[material];

    // Generate mock dimensions
    const height = Math.round((5 + Math.random() * 15) * 10) / 10; // 5-20 cm
    const grams = Math.round(50 + Math.random() * 450); // 50-500g
    const price = Math.round((fileSizeKB / 1024) * multiplier * baseRate * grams * 100) / 100;

    // Create mock model preview (using a placeholder image for now)
    const modelPreview = "https://via.placeholder.com/400x300/6366f1/ffffff?text=3D+Model+Preview";

    // TODO: Integrate with Bambu Slicer API
    // When Bambu API is available, replace this mock logic with:
    // 1. Upload file to Bambu API
    // 2. Get slice data (height, filament usage, print time)
    // 3. Calculate price based on real data and material cost
    // Example: const result = await bambuSlicerAPI.slice(file, material);

    setQuote({
      modelPreview,
      height,
      grams,
      price,
    });

    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <form className="space-y-6">
        <div>
          <Label htmlFor="model-upload">Upload 3D Model</Label>
          <Input
            id="model-upload"
            type="file"
            accept=".stl,.obj,.3mf"
            onChange={handleFileChange}
            className="mt-2"
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="material">Material Type</Label>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger id="material" className="mt-2">
              <SelectValue placeholder="Select a material" />
            </SelectTrigger>
            <SelectContent>
              {materialOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          onClick={generateQuote}
          disabled={!selectedFile || !material || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? "Generating Quote..." : "Generate Quote"}
        </Button>
      </form>

      {quote && (
        <Card className="mt-8 border-2 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold mb-6">Your Quote</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Model Preview */}
              <div className="space-y-4">
                <Label>Model Preview</Label>
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={quote.modelPreview}
                    alt="3D Model Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Quote Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Ruler className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Height</p>
                    <p className="text-lg font-semibold">{quote.height} cm</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Filament Required</p>
                    <p className="text-lg font-semibold">{quote.grams} grams</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Price</p>
                    <p className="text-2xl font-bold text-primary">${quote.price.toFixed(2)}</p>
                  </div>
                </div>

                <Button className="w-full mt-4">
                  <Download className="mr-2 h-4 w-4" />
                  Download Quote
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

