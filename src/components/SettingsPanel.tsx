import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Model</Label>
        <Select value={model} onValueChange={onModelChange}>
          <SelectTrigger className="h-8 text-sm bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self-hosted">Self Hosted</SelectItem>
            <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
            <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
            <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
            <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
            <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          Advanced Settings
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Temperature</Label>
              <span className="text-xs text-muted-foreground">{temperature.toFixed(2)}</span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={(values) => onTemperatureChange(values[0])}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Max Tokens</Label>
              <span className="text-xs text-muted-foreground">{maxTokens}</span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={(values) => onMaxTokensChange(values[0])}
              min={50}
              max={2000}
              step={50}
              className="w-full"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
