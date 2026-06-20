'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { syncCategoryAttributes } from '@/lib/actions/category-attribute-actions';
import { toast } from 'sonner';

export default function CategoryAttributeManager({
  category,
  initialCategoryAttributes,
  allAttributes,
}: {
  category: any;
  initialCategoryAttributes: any[];
  allAttributes: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Local state to manage the list of attributes for this category
  const [selectedAttributes, setSelectedAttributes] = useState(
    initialCategoryAttributes.map((ca) => ({
      attributeId: ca.attributeId,
      name: ca.attribute.name,
      isRequired: ca.isRequired,
      displayOrder: ca.displayOrder,
    }))
  );

  const handleAddAttribute = (attributeId: string) => {
    if (!attributeId) return;
    if (selectedAttributes.find(a => a.attributeId === attributeId)) {
      toast.error('Attribute is already added to this category.');
      return;
    }

    const attr = allAttributes.find(a => a.id === attributeId);
    if (!attr) return;

    setSelectedAttributes([
      ...selectedAttributes,
      {
        attributeId: attr.id,
        name: attr.name,
        isRequired: false,
        displayOrder: selectedAttributes.length,
      }
    ]);
  };

  const handleRemoveAttribute = (attributeId: string) => {
    setSelectedAttributes(selectedAttributes.filter(a => a.attributeId !== attributeId));
  };

  const handleToggleRequired = (attributeId: string, isRequired: boolean) => {
    setSelectedAttributes(
      selectedAttributes.map(a => a.attributeId === attributeId ? { ...a, isRequired } : a)
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newAttrs = [...selectedAttributes];
    const temp = newAttrs[index];
    newAttrs[index] = newAttrs[index - 1];
    newAttrs[index - 1] = temp;
    
    // Update display orders
    newAttrs.forEach((a, i) => a.displayOrder = i);
    setSelectedAttributes(newAttrs);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedAttributes.length - 1) return;
    const newAttrs = [...selectedAttributes];
    const temp = newAttrs[index];
    newAttrs[index] = newAttrs[index + 1];
    newAttrs[index + 1] = temp;

    // Update display orders
    newAttrs.forEach((a, i) => a.displayOrder = i);
    setSelectedAttributes(newAttrs);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = selectedAttributes.map((a, i) => ({
        attributeId: a.attributeId,
        isRequired: a.isRequired,
        displayOrder: i,
      }));

      const res = await syncCategoryAttributes(category.id, payload);
      if (res.success) {
        toast.success('Category attributes saved successfully!');
      } else {
        toast.error(res.error || 'Failed to save');
      }
    } catch (e) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter out already added attributes from the select dropdown
  const availableAttributes = allAttributes.filter(
    a => !selectedAttributes.find(sa => sa.attributeId === a.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <Button variant="ghost" onClick={() => router.push('/admin/settings/categories')} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Categories
        </Button>
        <Button onClick={handleSave} disabled={loading} className="rounded-xl">
          <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save Template'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Add Attribute */}
        <div className="bg-white border rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-lg font-semibold mb-4">Add Global Attribute</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select an attribute from the Global Library to attach to this category.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Attribute</Label>
              <Select onValueChange={handleAddAttribute}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="-- Choose an Attribute --" />
                </SelectTrigger>
                <SelectContent>
                  {availableAttributes.length === 0 ? (
                    <SelectItem value="none" disabled>All attributes added</SelectItem>
                  ) : (
                    availableAttributes.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              className="w-full rounded-xl"
              onClick={() => router.push('/admin/settings/attributes')}
            >
              <Plus className="w-4 h-4 mr-2" /> Create New Global Attribute
            </Button>
          </div>
        </div>

        {/* Right Column: Template List */}
        <div className="md:col-span-2 bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Selected Attributes</h3>
          
          {selectedAttributes.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500">No attributes assigned to this category yet.</p>
              <p className="text-xs text-gray-400 mt-2">Products in this category will not have auto-suggested attributes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedAttributes.map((attr, index) => (
                <div 
                  key={attr.attributeId} 
                  className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 group hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1 text-gray-400">
                      <button 
                        onClick={() => handleMoveUp(index)} 
                        disabled={index === 0}
                        className="hover:text-gray-900 disabled:opacity-30"
                      >
                        <GripVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{attr.name}</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={attr.isRequired} 
                        onCheckedChange={(c) => handleToggleRequired(attr.attributeId, c)}
                        id={`req-${attr.attributeId}`}
                      />
                      <Label htmlFor={`req-${attr.attributeId}`} className="text-sm text-gray-600 cursor-pointer">
                        Required
                      </Label>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveAttribute(attr.attributeId)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
