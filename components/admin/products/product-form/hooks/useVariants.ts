import { useState } from 'react';

export interface Attribute {
  id: string; // temporary id for the row
  attributeId?: number; // db id
  name: string;
  values: string[]; // array of values
}

export interface Variation {
  id: string;
  name: string;
  sku: string;
  upc: string;
  cost: number;
  expense: number;
  price: number;
  offerPrice: number;
  stock: number;
  hasSerial: boolean;
  serials: string[];
  image?: string; // Preview URL
  productImageId?: string; // Link to gallery image
  attributes?: Record<string, string>;
}

export function useVariants(initialAttributes: Attribute[] = [], initialVariations: Variation[] = []) {
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes);
  const [variations, setVariations] = useState<Variation[]>(initialVariations);

  const addAttribute = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setAttributes([...attributes, { id, name: '', values: [] }]);
  };

  const removeAttribute = (index: number) => {
    const newAttrs = [...attributes];
    newAttrs.splice(index, 1);
    setAttributes(newAttrs);
  };

  const updateAttribute = (index: number, attr: Partial<Attribute>) => {
    const newAttrs = [...attributes];
    newAttrs[index] = { ...newAttrs[index], ...attr };
    setAttributes(newAttrs);
  };

  const handleValueSelect = (index: number, value: string) => {
    setAttributes(prev => {
      const newAttrs = [...prev];
      newAttrs[index] = { ...newAttrs[index] };
      const currentValues = newAttrs[index].values || [];
      if (currentValues.includes(value)) {
        newAttrs[index].values = currentValues.filter(v => v !== value);
      } else {
        newAttrs[index].values = [...currentValues, value];
      }
      return newAttrs;
    });
  };

  const generateVariations = (baseSku: string = '', basePrice: number = 0, baseCost: number = 0) => {
    if (attributes.length === 0) return;
    
    // Cartesian product of attribute values
    const cartesian = (args: string[][]) => args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]] as string[][]);
    
    const attrValues = attributes.filter(a => a.values.length > 0).map(a => a.values);
    if (attrValues.length === 0) return;

    const combinations = cartesian(attrValues);
    const activeAttributes = attributes.filter(a => a.values.length > 0);
    
    const newVariations = combinations.map(combo => {
      const isArray = Array.isArray(combo);
      const values = isArray ? combo : [combo];
      
      const variantName = values.join(' - ');
      const attrMap: Record<string, string> = {};
      
      activeAttributes.forEach((attr, idx) => {
        attrMap[attr.name] = values[idx];
      });

      // Simple SKU generation logic: Append initials of values
      const skuSuffix = values.map(v => v.substring(0, 3).toUpperCase()).join('-');
      const generatedSku = baseSku ? `${baseSku}-${skuSuffix}` : skuSuffix;

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: variantName,
        sku: generatedSku,
        upc: '',
        cost: baseCost,
        expense: 0,
        price: basePrice,
        offerPrice: 0,
        stock: 0,
        hasSerial: false,
        serials: [],
        attributes: attrMap
      };
    });

    setVariations(newVariations);
  };

  const updateVariation = (id: string, field: keyof Variation, value: any) => {
    setVariations(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariation = (id: string) => {
    setVariations(prev => prev.filter(v => v.id !== id));
  };

  return {
    attributes,
    variations,
    setVariations,
    addAttribute,
    removeAttribute,
    updateAttribute,
    handleValueSelect,
    generateVariations,
    updateVariation,
    removeVariation
  };
}
