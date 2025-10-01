import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export const ImageGeneration = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editImage, setEditImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("image-generation", {
        body: { prompt, editImage },
      });

      if (error) throw error;

      setGeneratedImage(data.imageUrl);
      toast({
        title: "Image Generated",
        description: "Your image has been created successfully",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="min-h-[100px] bg-card border-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Optional: Upload image to edit
          </label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex-1 bg-card border-border"
            />
            {editImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditImage(null)}
              >
                Clear
              </Button>
            )}
          </div>
          {editImage && (
            <Card className="p-2">
              <img
                src={editImage}
                alt="Edit preview"
                className="w-32 h-32 object-cover rounded"
              />
            </Card>
          )}
        </div>

        <Button
          onClick={generateImage}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-primary to-accent"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>
      </div>

      {generatedImage && (
        <Card className="p-4 bg-card border-border">
          <img
            src={generatedImage}
            alt="Generated"
            className="w-full rounded-lg"
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => {
              const link = document.createElement("a");
              link.href = generatedImage;
              link.download = "generated-image.png";
              link.click();
            }}
          >
            Download Image
          </Button>
        </Card>
      )}
    </div>
  );
};
