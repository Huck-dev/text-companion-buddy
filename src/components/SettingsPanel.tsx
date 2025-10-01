import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

interface SettingsPanelProps {
  model: string;
  temperature: number;
  maxTokens: number;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temperature: number) => void;
  onMaxTokensChange: (maxTokens: number) => void;
}

export const SettingsPanel = ({
  model,
  temperature,
  maxTokens,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
}: SettingsPanelProps) => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Model Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-foreground">Model</Label>
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (Free)</SelectItem>
              <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (Free)</SelectItem>
              <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Free)</SelectItem>
              <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
              <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Gemini models are free to use during the promotion period
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-foreground">Temperature</Label>
            <span className="text-sm text-muted-foreground">{temperature.toFixed(2)}</span>
          </div>
          <Slider
            value={[temperature]}
            onValueChange={(values) => onTemperatureChange(values[0])}
            max={1}
            step={0.01}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Higher values make output more random
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-foreground">Max Tokens</Label>
            <span className="text-sm text-muted-foreground">{maxTokens}</span>
          </div>
          <Slider
            value={[maxTokens]}
            onValueChange={(values) => onMaxTokensChange(values[0])}
            min={50}
            max={2000}
            step={50}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Maximum length of the response
          </p>
        </div>
      </div>
    </Card>
  );
};
