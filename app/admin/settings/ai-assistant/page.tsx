'use client';

import { useState, useEffect } from 'react';
import { getDynamicAiModels, saveDynamicAiModels, DynamicAiModel } from '@/lib/actions/setting-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, KeyRound, Eye, EyeOff, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AiAssistantSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState<DynamicAiModel[]>([]);
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchModels() {
      const data = await getDynamicAiModels();
      setModels(data);
      if (data.length > 0) {
        setExpandedModelId(data[0].id);
      }
      setLoading(false);
    }
    fetchModels();
  }, []);

  const handleSave = async () => {
    // Validate models
    for (const m of models) {
      if (!m.displayName || !m.modelName || !m.provider || !m.apiKey) {
        toast.error('Please fill all fields for all models before saving.');
        setExpandedModelId(m.id);
        return;
      }
    }

    setSaving(true);
    const result = await saveDynamicAiModels(models);
    setSaving(false);
    
    if (result.success) {
      toast.success('Dynamic AI Models saved successfully.');
    } else {
      toast.error(result.error || 'Failed to save models.');
    }
  };

  const handleAddModel = () => {
    const newId = crypto.randomUUID();
    const newModel: DynamicAiModel = {
      id: newId,
      displayName: 'New Model',
      modelName: '',
      provider: 'google',
      apiKey: '',
    };
    setModels([...models, newModel]);
    setExpandedModelId(newId);
  };

  const handleRemoveModel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModels(models.filter(m => m.id !== id));
    if (expandedModelId === id) setExpandedModelId(null);
  };

  const handleChange = (id: string, field: keyof DynamicAiModel, value: string) => {
    setModels(models.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const toggleShowPassword = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyApiKey = (apiKey: string) => {
    if (!apiKey) {
      toast.error('No API Key to copy.');
      return;
    }
    navigator.clipboard.writeText(apiKey);
    toast.success('API Key copied to clipboard!');
  };

  const toggleExpand = (id: string) => {
    setExpandedModelId(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dynamic AI Models</h1>
          <p className="text-muted-foreground">Configure multiple AI models, set display names, model IDs, and API keys.</p>
        </div>
        <Button onClick={handleAddModel} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> Add New Model
        </Button>
      </div>

      {models.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
          <KeyRound className="w-12 h-12 mb-4 text-slate-300" />
          <p>No models configured.</p>
          <p className="text-sm">Click "Add New Model" to configure your first AI model.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {models.map((model, index) => {
            const isExpanded = expandedModelId === model.id;
            return (
              <Card key={model.id} className="relative overflow-hidden transition-all duration-200">
                <div className={`absolute top-0 left-0 w-1 h-full ${isExpanded ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                
                <CardHeader 
                  className="pb-3 flex flex-row items-center justify-between space-y-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => toggleExpand(model.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <CardTitle className="text-lg">{model.displayName || `Model #${index + 1}`}</CardTitle>
                      <CardDescription>{model.provider.toUpperCase()} • {model.modelName || 'Unconfigured'}</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 z-10"
                    onClick={(e) => handleRemoveModel(model.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <Label>Display Name (Shown in UI)</Label>
                      <Input 
                        placeholder="e.g. Llama 4 Scout" 
                        value={model.displayName} 
                        onChange={(e) => handleChange(model.id, 'displayName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Internal Model Name</Label>
                      <Input 
                        placeholder="e.g. llama-4-scout" 
                        value={model.modelName} 
                        onChange={(e) => handleChange(model.id, 'modelName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select 
                        value={model.provider} 
                        onValueChange={(value) => handleChange(model.id, 'provider', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google">Google Gemini</SelectItem>
                          <SelectItem value="groq">Groq</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input 
                            type={showPassword[model.id] ? "text" : "password"} 
                            placeholder="Enter API Key" 
                            value={model.apiKey} 
                            onChange={(e) => handleChange(model.id, 'apiKey', e.target.value)}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(model.id)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword[model.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => copyApiKey(model.apiKey)}
                          title="Copy API Key"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
