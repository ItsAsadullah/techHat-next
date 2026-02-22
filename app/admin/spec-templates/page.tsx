'use client';

import { useState, useEffect } from 'react';
import { 
  getSavedTemplates, 
  createSavedTemplate, 
  deleteSavedTemplate 
} from '@/lib/actions/spec-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ListChecks, Search, Check, ChevronsUpDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function SpecTemplatesPage() {
  const [templates, setTemplates] = useState<{id: string, name: string, keys: string[]}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Template State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateKeys, setNewTemplateKeys] = useState<string[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const data = await getSavedTemplates();
    setTemplates(data);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTemplateName.trim()) {
      alert("Template name is required");
      return;
    }
    
    if (newTemplateKeys.length === 0) {
      alert("At least one specification key is required");
      return;
    }

    const result = await createSavedTemplate(newTemplateName, newTemplateKeys);
    if (result.success) {
      setTemplates([...templates, result.template]);
      setNewTemplateName('');
      setNewTemplateKeys([]);
      setIsDialogOpen(false);
    } else {
      alert("Failed to create template: " + (result.error || "Unknown error"));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    const result = await deleteSavedTemplate(id);
    if (result.success) {
      setTemplates(templates.filter(t => t.id !== id));
    } else {
      alert("Failed to delete template");
    }
  }

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keys.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const allUniqueKeys = Array.from(new Set(templates.flatMap(t => t.keys))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Specification Templates</h1>
            <p className="text-gray-600 mt-2 font-medium">Manage reusable technical specification sets for your products</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl font-bold px-8 py-6 text-base">
                <Plus className="h-5 w-5 mr-2" /> Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-xl border-2 border-white rounded-3xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Create New Template</DialogTitle>
                <DialogDescription className="text-gray-600 font-medium">
                  Define a set of standard specification keys (e.g., Processor, RAM) that can be reused.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Template Name</label>
                  <Input 
                    placeholder="e.g. Gaming Laptop Specs" 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="h-12 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Specification Keys</label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="w-full justify-between h-auto min-h-[48px] py-3 px-4 bg-gradient-to-br from-gray-50 to-white text-left font-medium hover:bg-gray-100 border-2 border-gray-200 rounded-xl"
                        >
                          <div className="flex flex-wrap gap-2">
                            {newTemplateKeys.length > 0 ? (
                              newTemplateKeys.map((key) => (
                                <Badge key={key} variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 border-0 px-3 py-1 rounded-lg font-bold shadow-md">
                                  {key}
                                  <span 
                                    className="ml-2 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer opacity-80 hover:opacity-100 hover:bg-white/20"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setNewTemplateKeys(newTemplateKeys.filter(k => k !== key));
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </span>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500 font-medium">Select specification keys...</span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 text-gray-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0 rounded-2xl border-2 border-gray-200 shadow-2xl" align="start">
                        <Command className="rounded-2xl">
                          <CommandInput 
                              placeholder="Search or add new key..." 
                              value={commandQuery}
                              onValueChange={setCommandQuery}
                              className="h-12 font-medium"
                          />
                          <CommandList>
                            <CommandEmpty>
                              {commandQuery && (
                                  <div 
                                      className="p-3 text-sm font-bold text-purple-600 cursor-pointer hover:bg-purple-50 flex items-center gap-2 m-2 rounded-xl border-2 border-purple-200"
                                      onClick={() => {
                                          if (!newTemplateKeys.includes(commandQuery)) {
                                              setNewTemplateKeys([...newTemplateKeys, commandQuery]);
                                          }
                                          setCommandQuery('');
                                      }}
                                  >
                                      <Plus className="h-4 w-4" /> Create "{commandQuery}"
                                  </div>
                              )}
                            </CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {allUniqueKeys.map((key) => (
                              <CommandItem
                                key={key}
                                value={key}
                                onSelect={(currentValue) => {
                                  // We use 'key' directly because currentValue might be normalized
                                  if (newTemplateKeys.includes(key)) {
                                    setNewTemplateKeys(newTemplateKeys.filter(k => k !== key));
                                  } else {
                                    setNewTemplateKeys([...newTemplateKeys, key]);
                                  }
                                  // setCommandQuery(''); // Optional: keep query or clear it
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newTemplateKeys.includes(key) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {key}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                <p className="text-xs text-gray-500">Select from existing keys or type to create new ones</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl border-2 font-bold">Cancel</Button>
              <Button onClick={handleCreate} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg">Create Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white overflow-hidden">
        <div className="border-b-2 border-gray-200 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
           <div className="flex items-center gap-3">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Search templates..." 
                  className="pl-12 h-12 bg-white border-2 border-gray-200 rounded-xl font-medium focus-visible:ring-2 focus-visible:ring-purple-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
           </div>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <TableRow className="border-b-2 border-gray-200">
                <TableHead className="pl-8 py-5 text-xs font-bold text-gray-700 uppercase tracking-wider">Template Name</TableHead>
                <TableHead className="py-5 text-xs font-bold text-gray-700 uppercase tracking-wider">Defined Keys</TableHead>
                <TableHead className="w-[100px] text-right pr-8 py-5 text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y-2 divide-gray-100">
              {loading ? (
                 <TableRow>
                    <TableCell colSpan={3} className="text-center py-16 text-gray-500 font-medium">
                        <div className="flex items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                          Loading templates...
                        </div>
                    </TableCell>
                 </TableRow>
              ) : filteredTemplates.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={3} className="text-center py-16 text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                            <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-4">
                              <ListChecks className="h-16 w-16 text-gray-400" />
                            </div>
                            <p className="text-lg font-bold text-gray-700 mb-2">No templates found</p>
                            <Button variant="link" onClick={() => setIsDialogOpen(true)} className="text-purple-600 font-bold text-base">
                                Create your first template
                            </Button>
                        </div>
                    </TableCell>
                 </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id} className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all">
                    <TableCell className="font-bold text-gray-900 pl-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                <ListChecks className="h-5 w-5" />
                            </div>
                            <span className="text-base">{template.name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-wrap gap-2">
                        {template.keys.slice(0, 5).map((key, i) => (
                          <Badge key={i} variant="secondary" className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-0 font-bold px-3 py-1 rounded-lg shadow-sm">
                            {key}
                          </Badge>
                        ))}
                        {template.keys.length > 5 && (
                          <Badge variant="outline" className="text-gray-600 border-2 border-gray-300 font-bold px-3 py-1 rounded-lg">
                            +{template.keys.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-xl h-10 w-10 shadow-sm transition-all"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>
    </div>
  );
}
