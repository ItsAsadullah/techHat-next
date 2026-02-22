'use client';

import * as React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Table as TiptapTable, TableRow as TiptapTableRow, TableCell as TiptapTableCell, TableHeader as TiptapTableHeader } from '@tiptap/extension-table';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Toggle } from '@/components/ui/toggle';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Upload,
  Eraser,
  Table as TableIcon,
  Palette,
  Highlighter,
  Trash2,
  Plus,
  Minus,
  Copy,
  Clipboard,
  Maximize,
  Minimize,
} from 'lucide-react';
import { useCallback } from 'react';
import { Button } from './button';
import { LineHeight } from './extensions/line-height';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  MoreHorizontal,
  MoveVertical,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from './input';
import { uploadImage } from '@/lib/actions/upload-actions';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

import { MediaLibrary } from '@/components/admin/media-library';

const Toolbar = ({ editor, isFullScreen, toggleFullScreen }: { editor: Editor | null, isFullScreen: boolean, toggleFullScreen: () => void }) => {
  if (!editor) {
    return null;
  }

  const [linkUrl, setLinkUrl] = React.useState('');
  const [formatCopied, setFormatCopied] = React.useState<any>(null);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = React.useState(false);

  const copyFormat = () => {
    const marks = editor.getAttributes('textStyle');
    const highlight = editor.getAttributes('highlight');
    const bold = editor.isActive('bold');
    const italic = editor.isActive('italic');
    const underline = editor.isActive('underline');
    
    setFormatCopied({ ...marks, ...highlight, bold, italic, underline });
  };

  const pasteFormat = () => {
    if (formatCopied) {
      if (formatCopied.color) editor.chain().focus().setColor(formatCopied.color).run();
      if (formatCopied.color === undefined) editor.chain().focus().unsetColor().run();
      
      if (formatCopied.bold) editor.chain().focus().setBold().run();
      else editor.chain().focus().unsetBold().run();

      if (formatCopied.italic) editor.chain().focus().setItalic().run();
      else editor.chain().focus().unsetItalic().run();

      if (formatCopied.underline) editor.chain().focus().setUnderline().run();
      else editor.chain().focus().unsetUnderline().run();
    }
  };

  const handleImageSelect = (url: string) => {
      editor.chain().focus().setImage({ src: url }).run();
      setIsMediaLibraryOpen(false);
  };

  const setLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkUrl('');
  };

  const lineHeights = [
    { label: 'Single', value: '1.0' },
    { label: '1.15', value: '1.15' },
    { label: '1.5', value: '1.5' },
    { label: 'Double', value: '2.0' },
  ];

  const [tableRows, setTableRows] = React.useState(3);
  const [tableCols, setTableCols] = React.useState(3);
  const [tableHeader, setTableHeader] = React.useState(true);

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: tableHeader }).run();
  };

  return (
    <div className="border border-input bg-transparent rounded-t-lg p-2 flex flex-wrap gap-1 items-center bg-gray-50 border-b border-gray-200">
      
      {/* Group 1: Headings & Formatting */}
      <div className="flex items-center gap-1 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 font-normal" title="Text Style">
              <span className="text-sm">
                {editor.isActive('heading', { level: 1 }) ? 'Heading 1' :
                 editor.isActive('heading', { level: 2 }) ? 'Heading 2' :
                 editor.isActive('heading', { level: 3 }) ? 'Heading 3' :
                 'Normal'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              Normal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Clear Formatting */}
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
            <Eraser className="h-4 w-4" />
        </Button>

        {/* Format Painter */}
        <Button type="button" variant="ghost" size="sm" onClick={copyFormat} title="Copy Format" className={formatCopied ? "bg-blue-100 text-blue-600" : ""}>
            <Copy className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={pasteFormat} disabled={!formatCopied} title="Paste Format">
            <Clipboard className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Font Color */}
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="px-2" title="Text Color">
                    <Palette className="h-4 w-4" style={{ color: editor.getAttributes('textStyle').color || 'currentColor' }} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
                <div className="flex flex-col gap-2">
                    <input 
                        type="color" 
                        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        className="w-32 h-10 cursor-pointer rounded border border-gray-300"
                    />
                    <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={() => editor.chain().focus().unsetColor().run()}
                        className="h-7 text-xs"
                    >
                        Remove Color
                    </Button>
                </div>
            </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Toggle size="sm" pressed={editor.isActive('highlight')} onPressedChange={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
            <Highlighter className="h-4 w-4" />
        </Toggle>

      </div>

      {/* Group 2: Lists & Alignment */}
      <div className="flex items-center gap-1 mr-2">
         <div className="w-px h-6 bg-gray-300 mx-1" />
         
         <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert Table">
              <TableIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="p-2">
                <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-10">Rows:</span>
                        <Input 
                            type="number" 
                            min="1" 
                            max="10" 
                            value={tableRows} 
                            onChange={(e) => setTableRows(parseInt(e.target.value))} 
                            className="h-6 w-16"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-10">Cols:</span>
                        <Input 
                            type="number" 
                            min="1" 
                            max="10" 
                            value={tableCols} 
                            onChange={(e) => setTableCols(parseInt(e.target.value))} 
                            className="h-6 w-16"
                        />
                    </div>
                     <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="headerRow"
                            checked={tableHeader} 
                            onChange={(e) => setTableHeader(e.target.checked)} 
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="headerRow" className="text-xs cursor-pointer select-none">Header Row</label>
                    </div>
                    <Button type="button" size="sm" onClick={insertTable} className="w-full h-7 text-xs mt-1">
                        Insert Table
                    </Button>
                </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()}>
              <Plus className="mr-2 h-4 w-4" /> Add Column
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()}>
              <Minus className="mr-2 h-4 w-4" /> Delete Column
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}>
              <Plus className="mr-2 h-4 w-4" /> Add Row
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()}>
              <Minus className="mr-2 h-4 w-4" /> Delete Row
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Delete Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Alignment">
               {editor.isActive({ textAlign: 'center' }) ? <AlignCenter className="h-4 w-4" /> :
                editor.isActive({ textAlign: 'right' }) ? <AlignRight className="h-4 w-4" /> :
                editor.isActive({ textAlign: 'justify' }) ? <AlignJustify className="h-4 w-4" /> :
                <AlignLeft className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('left').run()}>
              <AlignLeft className="mr-2 h-4 w-4" /> Left
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('center').run()}>
              <AlignCenter className="mr-2 h-4 w-4" /> Center
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('right').run()}>
              <AlignRight className="mr-2 h-4 w-4" /> Right
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
              <AlignJustify className="mr-2 h-4 w-4" /> Justify
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Group 3: Line Height & Insert */}
      <div className="flex items-center gap-1">
        <div className="w-px h-6 bg-gray-300 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Line Height">
              <MoveVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {lineHeights.map((height) => (
              <DropdownMenuItem
                key={height.value}
                onClick={() => editor.chain().focus().setLineHeight(height.value).run()}
                className="justify-between"
              >
                {height.label}
                {editor.getAttributes('paragraph').lineHeight === height.value && <span className="text-blue-500 text-xs">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Toggle size="sm" pressed={editor.isActive('link')} onPressedChange={() => {
                const previousUrl = editor.getAttributes('link').href;
                setLinkUrl(previousUrl || '');
              }} title="Insert Link">
              <LinkIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="flex gap-2">
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="h-8" />
              <Button type="button" size="sm" onClick={setLink} className="h-8">Save</Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button type="button" variant="ghost" size="sm" className="px-2" title="Insert Image" onClick={() => setIsMediaLibraryOpen(true)}>
          <ImageIcon className="h-4 w-4" />
        </Button>

        <MediaLibrary 
          open={isMediaLibraryOpen} 
          onOpenChange={setIsMediaLibraryOpen} 
          onSelect={handleImageSelect}
        />
      </div>

      <div className="flex-1" />

      {/* Group 4: More Actions & Fullscreen */}
      <div className="flex items-center gap-1">
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        
        <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
          <Quote className="h-4 w-4" />
        </Toggle>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="h-8 w-8 p-0" title="Undo">
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="h-8 w-8 p-0" title="Redo">
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button type="button" variant="ghost" size="sm" onClick={toggleFullScreen} className="h-8 w-8 p-0" title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleImageUpload = async (file: File, view: any, x?: number, y?: number) => {
    const loadingToast = toast.loading('Uploading image...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadImage(formData);

      if (result.success && result.url) {
        const { schema } = view.state;
        const node = schema.nodes.image.create({ src: result.url });
        
        let pos = view.state.selection.from;
        if (x !== undefined && y !== undefined) {
            const coords = view.posAtCoords({ left: x, top: y });
            if (coords) pos = coords.pos;
        }
        
        const transaction = view.state.tr.insert(pos, node);
        view.dispatch(transaction);
        toast.success('Image uploaded successfully', { id: loadingToast });
      } else {
        toast.error('Failed to upload image', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Error uploading image', { id: loadingToast });
      console.error(error);
    }
  };

  // Lock body scroll when fullscreen
  React.useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFullScreen]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // history configuration removed due to type mismatch
        code: {
          HTMLAttributes: {
            class: 'bg-gray-100 px-1 rounded',
          },
        },
        link: false,
        underline: false,
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      ImageExtension,
      Underline,
      TiptapTable.configure({
        resizable: true,
      }),
      TiptapTableRow,
      TiptapTableHeader,
      TiptapTableCell,
      Highlight.configure({
        multicolor: true,
      }),
      LineHeight.configure({
        types: ['heading', 'paragraph'],
      }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'w-full px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
             handleImageUpload(file, view, event.clientX, event.clientY);
             return true; 
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        const item = items.find(item => item.type.indexOf('image') === 0);
        
        if (item) {
          const file = item.getAsFile();
          if (file) {
             handleImageUpload(file, view);
             return true; 
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className={`w-full rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all ${isFullScreen ? 'fixed inset-0 z-[9999] rounded-none border-0' : ''}`}>
      <Toolbar editor={editor} isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen} />
      <div 
        className={`cursor-text overflow-y-auto bg-white ${isFullScreen ? 'h-[calc(100vh-50px)] p-8 max-w-5xl mx-auto resize-none' : 'min-h-[350px] resize-y'}`}
        style={!isFullScreen ? { maxHeight: '800px' } : undefined}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
