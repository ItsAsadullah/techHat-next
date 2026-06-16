const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/admin/products/new/product-preview-modal.tsx',
  'app/admin/pos/pos-client.tsx',
  'app/admin/settings/branding/branding-client.tsx',
  'app/admin/settings/homepage/page.tsx',
  'app/admin/settings/invoice/invoice-designer.tsx',
  'app/admin/admin-layout-client.tsx',
  'components/admin/settings/category-manager.tsx'
];

function addImportIfMissing(content) {
  if (!content.includes('import Image from')) {
    // Add right after the first import
    return content.replace(/^(import.*?;)/m, `$1\nimport Image from 'next/image';`);
  }
  return content;
}

for (const file of filesToFix) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file}, not found`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  content = addImportIfMissing(content);

  if (file.includes('product-preview-modal.tsx')) {
    content = content.replace(
      /<img src={displayImage} alt={data\.name \|\| 'Product'} className="w-full h-full object-contain pointer-events-none select-none" \/>/g,
      `<Image src={displayImage} alt={data.name || 'Product'} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain pointer-events-none select-none" />`
    );
    content = content.replace(
      /<img src={img\.url} alt="" className="w-full h-full object-cover" \/>/g,
      `<Image src={img.url} alt="" width={80} height={80} className="w-full h-full object-cover" />`
    );
  } else if (file.includes('pos-client.tsx')) {
    content = content.replace(
      /<img src="\/images\/techhat\.png" alt="TechHat Logo" className="h-5 sm:h-6 w-auto object-contain drop-shadow-sm" \/>/g,
      `<Image src="/images/techhat.png" alt="TechHat Logo" width={120} height={24} className="h-5 sm:h-6 w-auto object-contain drop-shadow-sm" />`
    );
  } else if (file.includes('branding-client.tsx')) {
    content = content.replace(
      /<img src={form\.siteLogo} alt="Logo preview" style={{ maxHeight: '3\.5rem', width: 'auto' }} className="object-contain" \/>/g,
      `<Image src={form.siteLogo} alt="Logo preview" width={160} height={56} style={{ maxHeight: '3.5rem', width: 'auto' }} className="object-contain" />`
    );
    content = content.replace(
      /<img src={form\.siteFavicon} alt="Favicon preview" style={{ maxHeight: '2rem', width: 'auto' }} className="object-contain" \/>/g,
      `<Image src={form.siteFavicon} alt="Favicon preview" width={32} height={32} style={{ maxHeight: '2rem', width: 'auto' }} className="object-contain" />`
    );
  } else if (file.includes('settings/homepage/page.tsx')) {
    content = content.replace(
      /<img src={value} alt="preview" className="w-full max-h-36 object-contain" \/>/g,
      `<div className="relative w-full h-36"><Image src={value} alt="preview" fill className="object-contain" /></div>`
    );
  } else if (file.includes('invoice-designer.tsx')) {
    content = content.replace(
      /<img src={el\.content} alt="Logo" className="w-full h-full object-contain pointer-events-none select-none" draggable={false} \/>/g,
      `<Image src={el.content} alt="Logo" fill className="object-contain pointer-events-none select-none" draggable={false} />`
    );
  } else if (file.includes('admin-layout-client.tsx')) {
    content = content.replace(
      /<img src={`https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?size=160x160&data=\${encodeURIComponent\(scannerUrl\)}`} \n? +className="w-40 h-40" alt="Scanner QR" \/>/g,
      `<Image src={\`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=\${encodeURIComponent(scannerUrl)}\`} width={160} height={160} className="w-40 h-40" alt="Scanner QR" />`
    );
    content = content.replace(
      /<img src={siteLogo} alt="Logo" style={{ maxHeight: '1\.75rem', width: 'auto' }} className="object-contain" \/>/g,
      `<Image src={siteLogo} alt="Logo" width={140} height={28} style={{ maxHeight: '1.75rem', width: 'auto' }} className="object-contain" />`
    );
  } else if (file.includes('category-manager.tsx')) {
    content = content.replace(
      /<img src={cat\.image} className="w-full h-full object-cover" alt={cat\.name} \/>/g,
      `<Image src={cat.image} fill sizes="48px" className="object-cover" alt={cat.name} />`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
