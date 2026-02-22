'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider'; // You might need to check if this exists or use native
import { Plus, Trash2, Move, RotateCw, Type, Image as ImageIcon, Save, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InvoiceSettings } from '@/lib/actions/invoice-settings-actions';

// Standard A4 Ratio (approx)
const PAGE_WIDTH = 794; // pixels (at 96 DPI for A4)
const PAGE_HEIGHT = 1123; 

// Interface for Elements
export interface DesignElement {
  id: string;
  type: 'logo' | 'text' | 'company_details' | 'image';
  content?: string;
  x: number;
  y: number;
  width: number; // can be 'auto'
  height: number; // can be 'auto'
  fontSize?: number;
  fontWeight?: string;
  rotation?: number;
  color?: string;
  zIndex?: number;
}

interface InvoiceDesignerProps {
  settings: InvoiceSettings;
  onSave: (layout: string) => void;
}

export function InvoiceDesigner({ settings, onSave }: InvoiceDesignerProps) {
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Initialize from settings or load defaults
  useEffect(() => {
    try {
      if (settings.invoiceLayout && settings.invoiceLayout !== '[]') {
        const parsedLayout = JSON.parse(settings.invoiceLayout);
        if(parsedLayout.length > 0) {
           setElements(parsedLayout);
           return;
        }
      }
      
      // Default Layout if empty
      const defaults: DesignElement[] = [];
      if (settings.showLogo && settings.invoiceLogo) {
        defaults.push({
          id: 'logo',
          type: 'logo',
          content: settings.invoiceLogo,
          x: 50,
          y: 50,
          width: 150,
          height: 80,
          rotation: 0,
          zIndex: 10
        });
      }
      if(settings.invoiceCompanyName || settings.invoiceCompanyAddress) {
          const companyInfo = [
            settings.invoiceCompanyName,
            settings.invoiceCompanyAddress,
            settings.invoiceCompanyPhone,
            settings.invoiceCompanyEmail
          ].filter(Boolean).join('\n');
          
          defaults.push({
            id: 'company_details',
            type: 'company_details',
            content: companyInfo,
            x: 50,
            y: 150,
            width: 400,
            height: 100,
            fontSize: 14,
            rotation: 0,
            zIndex: 10
          });
      }
      setElements(defaults);
      
    } catch (e) {
      console.error('Failed to parse layout', e);
    }
  }, [settings]);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // crucial for preventing text selection
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
    
    // Find Element Position
    const el = elements.find(el => el.id === id);
    if (!el) return;
    if(!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    setDragOffset({
      x: mouseX - el.x,
      y: mouseY - el.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;

    updateElement(selectedId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addTextElement = () => {
    const newEl: DesignElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      content: 'New Text Block',
      x: 100,
      y: 300,
      width: 200,
      height: 50,
      fontSize: 16,
      rotation: 0,
      zIndex: 20
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };
  
  const handleSave = () => {
      onSave(JSON.stringify(elements));
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex gap-6 h-full min-h-[600px] mt-8 border-t pt-8">
      {/* Controls Panel (Left Side fixed width) */}
      <Card className="w-[300px] p-4 flex flex-col gap-4 h-fit sticky top-4">
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Designer Tools
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
             Drag elements on the canvas. Use controls below to edit.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={addTextElement} variant="outline" size="sm" className="w-full justify-start">
              <Type className="w-4 h-4 mr-2" /> Add Text
            </Button>
            {/* Future: Add Image */}
          </div>
        </div>

        {selectedElement ? (
          <div className="space-y-4 border-t pt-4 animate-in fade-in slide-in-from-left-4">
            <div className="flex justify-between items-center">
               <h4 className="font-medium text-sm text-blue-600">Editing Selected Element</h4>
               <Button variant="ghost" size="icon" onClick={() => deleteElement(selectedElement.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8">
                 <Trash2 className="w-4 h-4" />
               </Button>
            </div>

            {(selectedElement.type === 'text' || selectedElement.type === 'company_details') && (
              <div className="space-y-1">
                <Label className="text-xs">Content</Label>
                <textarea 
                   className="w-full min-h-[60px] p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   value={selectedElement.content} 
                   onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })} 
                />
              </div>
            )}

            <div className="space-y-2">
               <div className="flex justify-between">
                   <Label className="text-xs">Rotation</Label>
                   <span className="text-xs text-muted-foreground">{selectedElement.rotation || 0}°</span>
               </div>
               <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={selectedElement.rotation || 0}
                  onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
               />
            </div>
            
            <div className="space-y-2">
               <div className="flex justify-between">
                   <Label className="text-xs">Font Size</Label>
                   <span className="text-xs text-muted-foreground">{selectedElement.fontSize || 14}px</span>
               </div>
               <input 
                  type="range" 
                  min="8" 
                  max="72" 
                  value={selectedElement.fontSize || 16}
                  onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
               />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                   <Label className="text-xs">Width (px)</Label>
                   <Input 
                        type="number"
                        className="h-8 text-xs"
                        value={typeof selectedElement.width === 'number' ? selectedElement.width : ''} 
                        onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 0 })} 
                        placeholder="Auto"
                    />
                </div>
                 <div className="space-y-1">
                   <Label className="text-xs">Z-Index</Label>
                   <Input 
                        type="number"
                        className="h-8 text-xs"
                        value={selectedElement.zIndex || 10} 
                        onChange={(e) => updateElement(selectedElement.id, { zIndex: parseInt(e.target.value) })} 
                    />
                </div>
            </div>
          </div>
        ) : (
            <div className="h-40 flex items-center justify-center border-t border-dashed text-gray-400 text-sm italic">
                Select an element to edit
            </div>
        )}

        <div className="mt-auto pt-4 border-t">
            <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all h-12 text-base font-bold">
            <Save className="w-5 h-5 mr-2" /> Save Design
            </Button>
            <p className="text-[10px] text-gray-400 mt-2 text-center">
                Click "Save Design" to persist layout changes.
            </p>
        </div>
      </Card>

      {/* Canvas Area (Scrollable) */}
      <div className="flex-1 bg-gray-100 rounded-xl overflow-auto border shadow-inner relative flex justify-center p-8 select-none"
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
      >
        <div 
           ref={containerRef}
           className="bg-white shadow-2xl relative transition-all origin-top transform"
           style={{ 
               width: PAGE_WIDTH, 
               minHeight: PAGE_HEIGHT,
               height: PAGE_HEIGHT,
               backgroundImage: settings.showBackground && settings.invoiceBackground ? `url(${settings.invoiceBackground})` : 'none',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
           }}
        >
            {/* Grid Overlay for alignment help */}
            <div className="absolute inset-0 pointer-events-none opacity-5" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                     backgroundSize: '20px 20px' 
                 }}>
            </div>

            {/* Elements */}
            {elements.map((el) => {
               const style: React.CSSProperties = {
                   position: 'absolute',
                   left: el.x,
                   top: el.y,
                   width: typeof el.width === 'number' && el.width > 0 ? el.width : 'auto',
                   transform: `rotate(${el.rotation || 0}deg)`,
                   zIndex: el.zIndex || 10,
                   cursor: 'grab',
                   border: selectedId === el.id ? '2px dashed #2563eb' : '1px dashed transparent', // Blue border when selected
                   padding: '4px',
                   fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                   whiteSpace: 'pre-wrap',
                   fontWeight: el.fontWeight || 'normal',
                   userSelect: 'none',
               };
               
               if(isDragging && selectedId === el.id) {
                   style.cursor = 'grabbing';
                   style.opacity = 0.8;
                   style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
               }

               return (
                   <div
                      key={el.id}
                      style={style}
                      onMouseDown={(e) => handleMouseDown(e, el.id)}
                      className="hover:bg-blue-50/20 transition-colors"
                   >
                      {el.type === 'logo' && el.content ? (
                          <img src={el.content} alt="Logo" className="w-full h-full object-contain pointer-events-none select-none" draggable={false} />
                      ) : (el.type === 'text' || el.type === 'company_details') ? (
                          <div className="pointer-events-none select-none w-full h-full text-zinc-900 leading-normal">{el.content}</div>
                      ) : null}
                   </div>
               );
            })}
            
            {/* Static Indication of Table Area (Cannot move yet) */}
            <div className="absolute left-[40px] right-[40px] top-[400px] h-[300px] border-2 border-dashed border-gray-200 bg-gray-50/30 rounded-lg flex items-center justify-center text-gray-400 pointer-events-none z-0">
                <div className="text-center">
                    <p className="text-sm font-semibold mb-1">Items Table Area</p>
                    <p className="text-xs">This section is dynamically generated</p>
                </div>
            </div>
            
            {/* Footer Area Indication if generic footer handled by template */}
            {settings.invoiceFooterText && (
                <div className="absolute bottom-10 left-0 right-0 text-center text-xs text-gray-500 pointer-events-none">
                    {settings.invoiceFooterText}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
