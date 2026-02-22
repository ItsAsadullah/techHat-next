'use client';

import { useState, useEffect } from 'react';
import { 
  getSavedTemplates, 
  createSavedTemplate, 
  deleteSavedTemplate 
} from '@/lib/actions/spec-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function SpecTemplatesSettingsPage() {
  const [templates, setTemplates] = useState<{id: string, name: string, keys: string[]}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateKeys, setNewTemplateKeys] = useState<string[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    setLoading(true);
    const data = await getSavedTemplates();
    setTemplates(data);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTemplateName.trim()) { alert('Template name is required'); return; }
    if (newTemplateKeys.length === 0) { alert('At least one key is required'); return; }
    const result = await createSavedTemplate(newTemplateName, newTemplateKeys);
    if (result.success) {
      setTemplates([...templates, result.template]);
      setNewTemplateName(''); setNewTemplateKeys([]); setIsDialogOpen(false);
    } else {
      alert('Failed: ' + (result.error || 'Unknown error'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return;
    const result = await deleteSavedTemplate(id);
    if (result.success) setTemplates(templates.filter(t => t.id !== id));
    else alert('Failed to delete');
  }

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.keys.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const allKeys = Array.from(new Set(templates.flatMap(t => t.keys))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <ListChecks className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Spec Templates</h2>
            <p className="text-sm text-gray-500">Reusable specification key sets for products</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>Define a reusable set of specification keys.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Template Name</label>
                <Input
                  placeholder="e.g. Gaming Laptop Specs"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Specification Keys</label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openCombobox}
                      className="w-full justify-between h-auto min-h-[42px] py-2 px-3 text-left rounded-xl">
                      <div className="flex flex-wrap gap-1.5">
                        {newTemplateKeys.length > 0 ? newTemplateKeys.map((key) => (
                          <Badge key={key} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0 gap-1">
                            {key}
                            <span onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewTemplateKeys(newTemplateKeys.filter(k => k !== key)); }}
                              className="cursor-pointer opacity-70 hover:opacity-100">
                              <X className="w-3 h-3" />
                            </span>
                          </Badge>
                        )) : <span className="text-gray-400 text-sm">Select keys...</span>}
                      </div>
                      <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px] p-0 rounded-xl" align="start">
                    <Command className="rounded-xl">
                      <CommandInput placeholder="Search or create key..." value={commandQuery} onValueChange={setCommandQuery} />
                      <CommandList>
                        <CommandEmpty>
                          {commandQuery && (
                            <div className="p-2 text-sm text-indigo-600 cursor-pointer hover:bg-indigo-50 flex items-center gap-2 m-1 rounded-lg border border-indigo-200"
                              onClick={() => { if (!newTemplateKeys.includes(commandQuery)) setNewTemplateKeys([...newTemplateKeys, commandQuery]); setCommandQuery(''); }}>
                              <Plus className="w-4 h-4" /> Create "{commandQuery}"
                            </div>
                          )}
                        </CommandEmpty>
                        <CommandGroup className="max-h-52 overflow-auto">
                          {allKeys.map((key) => (
                            <CommandItem key={key} value={key}
                              onSelect={() => {
                                setNewTemplateKeys(newTemplateKeys.includes(key)
                                  ? newTemplateKeys.filter(k => k !== key)
                                  : [...newTemplateKeys, key]);
                              }}>
                              <Check className={cn('mr-2 w-4 h-4', newTemplateKeys.includes(key) ? 'opacity-100' : 'opacity-0')} />
                              {key}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-400">Select existing keys or type to create new ones</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search templates..." className="pl-9 rounded-xl" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700 py-3">Template Name</TableHead>
              <TableHead className="font-semibold text-gray-700 py-3">Keys</TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-gray-400">
                  <ListChecks className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No templates found</p>
                  <Button variant="link" onClick={() => setIsDialogOpen(true)} className="text-indigo-600 text-sm mt-1">
                    Create your first template
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <ListChecks className="w-4 h-4 text-indigo-600" />
                      </div>
                      {t.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {t.keys.slice(0, 6).map((k, i) => (
                        <Badge key={i} className="bg-blue-50 text-blue-700 border-0 text-xs">{k}</Badge>
                      ))}
                      {t.keys.length > 6 && (
                        <Badge variant="outline" className="text-xs text-gray-500">+{t.keys.length - 6} more</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}
                      className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
