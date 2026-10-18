'use client';

import { toast } from 'sonner';

interface PrintGRNLabelsOptions {
  grn: any;
  posConfig: any;
  origin: string;
}

// TechHat cipher: I=1, Z=2, E=3, A=4, S=5, G=6, T=7, B=8, P=9, O=0
const cipherMap: Record<string, string> = {
  '1': 'I', '2': 'Z', '3': 'E', '4': 'A', '5': 'S',
  '6': 'G', '7': 'T', '8': 'B', '9': 'P', '0': 'O'
};

const toCipher = (price: number) =>
  Math.round(price).toString().split('').map(d => cipherMap[d] || d).join('');

export function printGRNLabels({ grn, posConfig, origin }: PrintGRNLabelsOptions) {
  if (!grn) return;
  const defaultLabelWidth = posConfig?.pos_label_width || '50';
  const defaultLabelHeight = posConfig?.pos_label_height || '25';

  const supplierCode = grn.supplier?.supplierCode ||
    (grn.supplier?.name || '').toUpperCase().replace(/\s+/g, '').substring(0, 4);

  const logoUrl = posConfig?.pos_logo
    ? `${posConfig.pos_logo}?t=${Date.now()}`
    : `${origin}/images/techhat.png`;

  // Build all label HTML
  const labelsHtml = grn.items.flatMap((item: any) => {
    const qty = (item.acceptedQty !== undefined && item.acceptedQty !== null && item.acceptedQty > 0)
      ? item.acceptedQty
      : (item.orderedQty || 1);

    const category = (item.product?.category?.name || '').toUpperCase();
    const modelName = (item.product?.model || item.product?.name || '').toUpperCase();
    const landedCost = item.unitCost || item.product?.costPrice || 0;
    const cipherPrice = toCipher(landedCost);
    const sku = item.variant?.sku || item.product?.sku || 'N/A';
    const barcodeVal = item.variant?.upc || item.product?.barcode || sku;
    
    // Extract Serial / Sequence Number from SKU (remove TH- and Model name so model doesn't duplicate)
    let snNumber = sku.replace(/^TH-?/i, '');
    if (modelName) {
      const cleanModel = modelName.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanModel) {
        snNumber = snNumber.replace(new RegExp(`^${cleanModel}-?`, 'i'), '');
      }
    }
    if (snNumber.includes('-')) {
      const parts = snNumber.split('-');
      snNumber = parts[parts.length - 1];
    }
    if (!snNumber || snNumber === 'N/A') {
      snNumber = barcodeVal.replace(/^TH-?/i, '');
    }

    const rawSerials = Array.isArray(item.serials) 
      ? item.serials 
      : (typeof item.serials === 'string' ? JSON.parse(item.serials || '[]') : []);
    const itemSerials = rawSerials.length > 0 ? rawSerials : (item.serialNumber ? [item.serialNumber] : []);

    const parts = [modelName, cipherPrice, supplierCode].filter(Boolean).join('-');
    const infoHtml = category 
      ? `<span class="cat-wrapper"><span class="cat-part" contenteditable="true" spellcheck="false" title="Click to edit category">${category}</span><span class="cat-sep">-</span></span><span contenteditable="true" spellcheck="false" title="Click to edit model">${parts}</span>`
      : `<span contenteditable="true" spellcheck="false" title="Click to edit model">${parts}</span>`;

    return Array.from({ length: qty }, (_, idx) => {
      const individualSN = itemSerials[idx] || snNumber;
      const displaySN = `SN: ${individualSN}`;

      return `
      <div class="label">
        <div class="label-inner">
          <div class="brand">
            <img src="${logoUrl}" alt="Logo" class="brand-logo" />
            <span class="brand-text">TECHHAT</span>
          </div>
          <div class="info">${infoHtml}</div>
          <div class="barcode-wrapper">
            <svg class="barcode" data-barcode="${barcodeVal}" data-sku="${sku}"></svg>
          </div>
          <div class="sku-text" data-sn="${individualSN}" data-full-sku="${sku}" data-barcode="${barcodeVal}" contenteditable="true" spellcheck="false" title="Click to edit SN">${displaySN}</div>
        </div>
      </div>
    `;
    });
  }).join('');

  const popup = window.open('', '_blank', `width=1120,height=820,toolbar=0,menubar=0,scrollbars=yes`);
  if (!popup) {
    toast.error('Popup blocked! Please allow popups for this site.');
    return;
  }

  popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Barcode Labels — 617-R58P Studio</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <style>
    :root {
      --page-width: 50mm;
      --page-height: 25mm;
      --pad-left: -6.5mm;
      --pad-right: 0mm;
      --pad-top: 1mm;
      --shift-x: 7.5mm;
      --shift-y: 0mm;
      --text-align: center;
      --flex-align: center;
      --logo-height: 24px;
      --logo-shift-x: -3.5mm;
      --logo-shift-y: 0mm;
      --info-size: 9.5px;
      --info-shift-x: -3.5mm;
      --info-shift-y: -0.5mm;
      --sku-size: 10.5px;
      --sku-shift-x: -3.5mm;
      --sku-shift-y: -1mm;
      --brand-size: 14.5px;
      --bar-scale: 68%;
      --bar-shift-x: -5mm;
      --bar-shift-y: -0.5mm;
    }
    @page { size: var(--page-width) var(--page-height); margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { background: #070b14; color: #f8fafc; overflow: hidden; height: 100vh; width: 100vw; }

    /* Ultra-Slim Professional Top Navigation Bar (50px) */
    .top-nav {
      height: 50px;
      background: #0d1424;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      gap: 12px;
      z-index: 200;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
    .nav-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.3px;
      padding-right: 8px;
      border-right: 1px solid #1e293b;
    }
    .brand-badge .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }

    /* Preset selector in Top Nav */
    .preset-selector-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #131d33;
      border: 1px solid #233352;
      border-radius: 6px;
      padding: 3px 6px;
    }
    .preset-selector-group span {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }
    .preset-select {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11.5px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
      max-width: 220px;
      transition: border-color 0.15s;
    }
    .preset-select:focus {
      border-color: #38bdf8;
    }
    .preset-select optgroup {
      background: #0f172a;
      color: #94a3b8;
      font-weight: 700;
    }
    .preset-select option {
      background: #1e293b;
      color: #f8fafc;
      padding: 4px;
    }
    .btn-quick-save {
      background: #0284c7;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .btn-quick-save:hover { background: #0369a1; }

    /* Center Section - Primary Print Button */
    .nav-center {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-print {
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #ffffff;
      border: none;
      padding: 7px 22px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 10px rgba(22, 163, 74, 0.45);
      transition: all 0.15s ease;
    }
    .btn-print:hover {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      box-shadow: 0 4px 14px rgba(22, 163, 74, 0.6);
      transform: translateY(-1px);
    }
    .btn-print:active {
      transform: translateY(0);
    }

    /* Right Section - Status, Fine-Tune Toggle & Reset */
    .nav-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .tip-pill {
      font-size: 10.5px;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.2);
      padding: 3px 8px;
      border-radius: 5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .printer-pill {
      font-size: 11px;
      color: #94a3b8;
      background: #131d33;
      border: 1px solid #1e293b;
      padding: 3px 8px;
      border-radius: 5px;
      font-weight: 600;
    }
    .printer-pill strong {
      color: #f1f5f9;
    }
    .btn-fine-tune {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      padding: 5px 11px;
      font-size: 11.5px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-fine-tune:hover {
      background: #334155;
      border-color: #475569;
    }
    .btn-fine-tune.active {
      background: #0284c7;
      color: #ffffff;
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.35);
    }
    .btn-reset {
      background: transparent;
      color: #f87171;
      border: 1px solid #7f1d1d;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-reset:hover {
      background: #dc2626;
      color: white;
      border-color: #ef4444;
    }

    /* Studio Workspace Layout */
    .workspace-layout {
      display: flex;
      height: calc(100vh - 50px);
      width: 100vw;
      overflow: hidden;
      position: relative;
    }

    /* Left/Center Canvas (Takes Full Space, Centered Label Preview) */
    .canvas-container {
      flex: 1;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      background: radial-gradient(circle at 50% 20%, #0e172a 0%, #070b14 80%);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 16px 60px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .canvas-container::-webkit-scrollbar {
      width: 8px;
    }
    .canvas-container::-webkit-scrollbar-track {
      background: #070b14;
    }
    .canvas-container::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 4px;
    }
    .canvas-container::-webkit-scrollbar-thumb:hover {
      background: #334155;
    }

    .canvas-helper-text {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 16px;
      text-align: center;
    }

    /* Label Print Area & Individual Label Card */
    .print-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      min-height: min-content;
    }
    .label {
      width: var(--page-width);
      height: var(--page-height);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--pad-top) var(--pad-right) 0.5mm var(--pad-left);
      page-break-after: always;
      overflow: hidden;
      background: #ffffff;
      color: #000000;
      border: 1px dashed #94a3b8;
      box-sizing: border-box;
      position: relative;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
      transition: transform 0.15s ease;
    }
    .label:hover {
      border-color: #38bdf8;
    }
    .label-inner {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: var(--flex-align);
      justify-content: center;
      text-align: var(--text-align);
      transform: translate(var(--shift-x), var(--shift-y));
      overflow: hidden;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: var(--flex-align);
      gap: 3px;
      font-size: var(--brand-size);
      font-weight: 900;
      text-align: var(--text-align);
      letter-spacing: 0.5px;
      margin-bottom: 1px;
      text-transform: uppercase;
      max-width: 100%;
      overflow: hidden;
      transform: translate(var(--logo-shift-x), var(--logo-shift-y));
    }
    .brand-logo {
      height: var(--logo-height);
      width: auto;
      max-width: 100%;
      object-fit: contain;
      flex-shrink: 0;
      display: inline-block;
    }
    .brand-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
    }
    .info {
      font-size: var(--info-size);
      font-weight: bold;
      text-align: var(--text-align);
      letter-spacing: 0.2px;
      margin-bottom: 1px;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.15;
      transform: translate(var(--info-shift-x), var(--info-shift-y));
    }
    .barcode-wrapper {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: var(--flex-align);
      overflow: hidden;
      margin: 0.5px 0;
      transform: translate(var(--bar-shift-x), var(--bar-shift-y));
    }
    svg.barcode {
      display: block;
      width: var(--bar-scale, 68%);
      max-width: 100%;
      height: auto;
    }
    .sku-text {
      font-size: var(--sku-size);
      font-weight: bold;
      text-align: var(--text-align);
      letter-spacing: 0.2px;
      margin-top: 1px;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.1;
      transform: translate(var(--sku-shift-x), var(--sku-shift-y));
    }

    /* Right Slide-out Inspector Sidebar */
    .inspector-sidebar {
      width: 350px;
      min-width: 350px;
      height: 100%;
      background: #0d1424;
      border-left: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.45);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), margin-right 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 100;
    }
    .inspector-sidebar.collapsed {
      margin-right: -350px;
      transform: translateX(350px);
      pointer-events: none;
    }
    .inspector-header {
      padding: 12px 14px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #111a30;
      flex-shrink: 0;
    }
    .inspector-title-area {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .inspector-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .inspector-subtitle {
      font-size: 10px;
      color: #64748b;
    }
    .inspector-close-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid #1e293b;
      color: #94a3b8;
      width: 26px;
      height: 26px;
      border-radius: 5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      transition: all 0.15s ease;
    }
    .inspector-close-btn:hover {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    /* Inspector Body & Section Cards */
    .inspector-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .inspector-body::-webkit-scrollbar {
      width: 6px;
    }
    .inspector-body::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 3px;
    }

    .config-card {
      background: #111a30;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .config-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1a2642;
      padding-bottom: 6px;
    }
    .config-card-title {
      font-size: 11px;
      font-weight: 700;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .config-card-tag {
      font-size: 9.5px;
      color: #64748b;
      background: #090e1a;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid #1e293b;
    }
    .config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 8px;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .input-group.full-width {
      grid-column: 1 / -1;
    }
    .input-label {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      white-space: nowrap;
    }
    .input-box-wrapper {
      display: flex;
      align-items: center;
      background: #090e1a;
      border: 1px solid #1e293b;
      border-radius: 5px;
      overflow: hidden;
      padding-right: 6px;
      transition: border-color 0.15s;
    }
    .input-box-wrapper:focus-within {
      border-color: #38bdf8;
    }
    .input-box-wrapper input[type="number"] {
      width: 100%;
      background: transparent;
      border: none;
      color: #ffffff;
      padding: 4px 6px;
      font-size: 11px;
      font-weight: 600;
      outline: none;
    }
    .input-box-wrapper .unit {
      font-size: 10px;
      color: #64748b;
      user-select: none;
      font-weight: 600;
    }
    .select-box {
      width: 100%;
      background: #090e1a;
      border: 1px solid #1e293b;
      color: #ffffff;
      padding: 4px 6px;
      font-size: 11px;
      border-radius: 5px;
      outline: none;
      cursor: pointer;
    }
    .select-box:focus {
      border-color: #38bdf8;
    }

    /* Checkboxes */
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding-top: 3px;
    }
    .checkbox-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #cbd5e1;
      cursor: pointer;
    }
    .checkbox-item input[type="checkbox"] {
      cursor: pointer;
      accent-color: #38bdf8;
      width: 13px;
      height: 13px;
    }

    /* Custom Presets List in Sidebar */
    .custom-presets-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 140px;
      overflow-y: auto;
    }
    .custom-preset-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #090e1a;
      border: 1px solid #1e293b;
      border-radius: 5px;
      padding: 4px 8px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .custom-preset-row:hover {
      background: #1e293b;
      border-color: #38bdf8;
    }
    .custom-preset-row.active {
      background: #1e1b4b;
      border-color: #6366f1;
      color: #fde047;
      font-weight: 700;
    }
    .custom-preset-row .del-btn {
      background: rgba(239, 68, 68, 0.2);
      border: none;
      color: #fca5a5;
      border-radius: 3px;
      padding: 1px 5px;
      font-size: 10px;
      cursor: pointer;
    }
    .custom-preset-row .del-btn:hover {
      background: #ef4444;
      color: white;
    }
    .btn-save-sidebar {
      background: #0284c7;
      color: white;
      border: 1px solid #38bdf8;
      border-radius: 5px;
      padding: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .btn-save-sidebar:hover {
      background: #0369a1;
    }

    /* Native Print Styles — Thermal Safe (Zero Margins, Zero Blank Pages) */
    @media print {
      @page {
        size: var(--page-width) var(--page-height);
        margin: 0 !important;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        color: black !important;
        width: var(--page-width) !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .top-nav, .inspector-sidebar, .canvas-helper-text {
        display: none !important;
      }
      .workspace-layout {
        display: block !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      .canvas-container {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        height: auto !important;
        min-height: 0 !important;
        background: white !important;
        overflow: visible !important;
      }
      .print-area {
        padding: 0 !important;
        margin: 0 !important;
        gap: 0 !important;
        background: white !important;
        display: block !important;
        min-height: 0 !important;
        height: auto !important;
        width: var(--page-width) !important;
      }
      .label {
        border: none !important;
        margin: 0 !important;
        box-shadow: none !important;
        width: var(--page-width) !important;
        height: calc(var(--page-height) - 0.4mm) !important;
        max-height: calc(var(--page-height) - 0.4mm) !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .label:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <!-- Ultra-Slim Top Bar -->
  <header class="top-nav">
    <div class="nav-left">
      <div class="brand-badge">
        <span class="live-dot"></span>
        <span>TechHat Studio</span>
      </div>

      <div class="preset-selector-group">
        <span>প্রিসেট:</span>
        <select id="presetSelect" class="preset-select" title="লেবেল প্রিসেট সিলেক্ট করুন">
          <optgroup label="⚡ বিল্ট-ইন প্রিসেট">
            <option value="50x25-perfect" selected>⭐ 50×25mm (টিউনিং পারফেক্ট)</option>
            <option value="50x25-std">🏷️ 50×25mm (ডিফল্ট)</option>
            <option value="35x25-center">🏷️ 35×25mm (মাঝে / Center)</option>
            <option value="35x25-left">🏷️ 35×25mm (এক পাশে / বামে)</option>
            <option value="35x25-tray-offset">🏷️ 35×25mm (58mm Tray +11.5mm)</option>
          </optgroup>
          <optgroup id="customPresetOptGroup" label="📂 আপনার সেভ করা প্রিসেট"></optgroup>
          <option value="custom-manual" disabled id="manualOption" style="display:none;">⚙️ কাস্টমাইজড (ম্যানুয়াল)</option>
        </select>
        <button type="button" class="btn-quick-save" id="btnQuickSave" title="বর্তমান সেটিংস নতুন প্রিসেট হিসেবে সেভ করুন">
          💾 সেভ
        </button>
      </div>
    </div>

    <div class="nav-center">
      <button class="btn-print" onclick="window.print()">
        <span>🖨️ প্রিন্ট করুন (<span id="lcount">0</span>)</span>
      </button>
    </div>

    <div class="nav-right">
      <span class="tip-pill" title="কাগজ ফাঁকা বের হওয়া ঠেকাতে সেটিংস">
        💡 Margins: None &bull; Headers: Off
      </span>
      <span class="printer-pill">
        🖨️ <strong>617-R58P</strong>
      </span>
      <button class="btn-fine-tune" id="toggleInspectorBtn" title="পজিশন ও সাইজ ফাইন টিউন করুন">
        <span>⚙️ ফাইন-টিউন</span>
      </button>
      <button class="btn-reset" id="resetBtn" title="রিসেট করে পারফেক্ট 50x25 এ ফেরত যান">↺ Reset</button>
    </div>
  </header>

  <!-- Studio Workspace -->
  <div class="workspace-layout">
    <!-- Center Label Preview Canvas -->
    <main class="canvas-container">
      <div class="canvas-helper-text">
        🔍 লাইভ লেবেল প্রিভিউ &bull; ডাবল-ক্লিক করে টেক্সট বা সিরিয়াল এডিট করতে পারবেন &bull; ফাইন-টিউন বাটনে ক্লিক করে পজিশন পরিবর্তন করুন
      </div>
      <div class="print-area">
        ${labelsHtml}
      </div>
    </main>

    <!-- Slide-out Calibration Inspector Sidebar -->
    <aside class="inspector-sidebar collapsed" id="inspectorSidebar">
      <div class="inspector-header">
        <div class="inspector-title-area">
          <div class="inspector-title">⚙️ ফাইন টিউন কন্ট্রোল</div>
          <div class="inspector-subtitle">617-R58P পজিশন ও সাইজ ক্যালিব্রেশন</div>
        </div>
        <button class="inspector-close-btn" id="closeInspectorBtn" title="প্যানেল বন্ধ করুন">✕</button>
      </div>

      <div class="inspector-body">
        <!-- 1. Page & Overall Alignment -->
        <div class="config-card">
          <div class="config-card-header">
            <span class="config-card-title">📐 পেপার ও সামগ্রিক পজিশন</span>
            <span class="config-card-tag">Page</span>
          </div>
          <div class="config-grid">
            <div class="input-group">
              <span class="input-label">Width (চওড়া)</span>
              <div class="input-box-wrapper">
                <input type="number" id="pageW" value="50" step="1">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">Height (উচ্চতা)</span>
              <div class="input-box-wrapper">
                <input type="number" id="pageH" value="25" step="1">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">Shift X (ডানে/বামে)</span>
              <div class="input-box-wrapper">
                <input type="number" id="shiftX" value="7.5" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">Shift Y (উপরে/নিচে)</span>
              <div class="input-box-wrapper">
                <input type="number" id="shiftY" value="0" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">Pad L (বামের গ্যাপ)</span>
              <div class="input-box-wrapper">
                <input type="number" id="padL" value="-6.5" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">Pad R (ডানের গ্যাপ)</span>
              <div class="input-box-wrapper">
                <input type="number" id="padR" value="0" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">Pad T (উপরের গ্যাপ)</span>
              <div class="input-box-wrapper">
                <input type="number" id="padT" value="1" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">Alignment</span>
              <select id="textAlign" class="select-box">
                <option value="center" selected>Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 2. Logo & Brand -->
        <div class="config-card">
          <div class="config-card-header">
            <span class="config-card-title">🏷️ লোগো ও ব্র্যান্ড টেক্সট</span>
            <span class="config-card-tag">Logo</span>
          </div>
          <div class="config-grid">
            <div class="input-group">
              <span class="input-label">লোগোর সাইজ</span>
              <div class="input-box-wrapper">
                <input type="number" id="logoH" value="24" min="6" max="60" step="1">
                <span class="unit">px</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">লোগো Shift X</span>
              <div class="input-box-wrapper">
                <input type="number" id="logoShiftX" value="-3.5" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">লোগো Shift Y</span>
              <div class="input-box-wrapper">
                <input type="number" id="logoShiftY" value="0" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">ব্র্যান্ড ফন্ট সাইজ</span>
              <div class="input-box-wrapper">
                <input type="number" id="brandSize" value="14.5" min="6" max="22" step="0.5">
                <span class="unit">px</span>
              </div>
            </div>
            <div class="input-group full-width">
              <div class="checkbox-row">
                <label class="checkbox-item">
                  <input type="checkbox" id="showLogo" checked> লোগো দেখান
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" id="showBrandText" checked> TECHHAT নাম
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Product Info Text -->
        <div class="config-card">
          <div class="config-card-header">
            <span class="config-card-title">📝 প্রোডাক্ট তথ্য / লেখা</span>
            <span class="config-card-tag">Text</span>
          </div>
          <div class="config-grid">
            <div class="input-group">
              <span class="input-label">লেখা সাইজ (Font)</span>
              <div class="input-box-wrapper">
                <input type="number" id="infoSize" value="9.5" min="4" max="18" step="0.5">
                <span class="unit">px</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">লেখা Shift X</span>
              <div class="input-box-wrapper">
                <input type="number" id="infoShiftX" value="-3.5" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">লেখা Shift Y</span>
              <div class="input-box-wrapper">
                <input type="number" id="infoShiftY" value="-0.5" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group" style="justify-content: flex-end; padding-bottom: 2px;">
              <label class="checkbox-item">
                <input type="checkbox" id="showCat"> ক্যাটাগরি দেখান
              </label>
            </div>
          </div>
        </div>

        <!-- 4. Barcode Controls -->
        <div class="config-card">
          <div class="config-card-header">
            <span class="config-card-title">📊 বারকোড সাইজ ও পজিশন</span>
            <span class="config-card-tag">Barcode</span>
          </div>
          <div class="config-grid">
            <div class="input-group">
              <span class="input-label">বারকোড উচ্চতা (H)</span>
              <div class="input-box-wrapper">
                <input type="number" id="barH" value="35" min="15" max="80" step="2">
                <span class="unit">px</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">চওড়া স্কেল (Width)</span>
              <div class="input-box-wrapper">
                <input type="number" id="barScale" value="68" min="30" max="100" step="1">
                <span class="unit">%</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">বারকোড Shift X</span>
              <div class="input-box-wrapper">
                <input type="number" id="barShiftX" value="-5" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">বারকোড Shift Y</span>
              <div class="input-box-wrapper">
                <input type="number" id="barShiftY" value="-0.5" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">লাইনের ঘনত্ব</span>
              <select id="barW" class="select-box">
                <option value="1">1.0 (Thin)</option>
                <option value="1.2" selected>1.2 (Clear)</option>
                <option value="1.5">1.5 (Standard)</option>
                <option value="2">2.0 (Bold)</option>
              </select>
            </div>
            <div class="input-group" style="justify-content: flex-end; padding-bottom: 2px;">
              <label class="checkbox-item" title="বারকোড থেকে TH- বাদ দিলে লাইন কম ঘন হয় ও স্ক্যান দ্রুত হয়">
                <input type="checkbox" id="stripTH" checked> <strong>TH- বাদ দিন</strong>
              </label>
            </div>
          </div>
        </div>

        <!-- 5. Serial / SN Text -->
        <div class="config-card">
          <div class="config-card-header">
            <span class="config-card-title">🔢 SN / সিরিয়াল টেক্সট</span>
            <span class="config-card-tag">Serial</span>
          </div>
          <div class="config-grid">
            <div class="input-group">
              <span class="input-label">SN ফন্ট সাইজ</span>
              <div class="input-box-wrapper">
                <input type="number" id="skuSize" value="10.5" min="4" max="18" step="0.5">
                <span class="unit">px</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">SN Shift X</span>
              <div class="input-box-wrapper">
                <input type="number" id="skuShiftX" value="-3.5" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">SN Shift Y</span>
              <div class="input-box-wrapper">
                <input type="number" id="skuShiftY" value="-1" step="0.5">
                <span class="unit">mm</span>
              </div>
            </div>
            <div class="input-group" style="justify-content: flex-end; padding-bottom: 2px;">
              <label class="checkbox-item" title="মডেল নাম বাদ দিয়ে শুধুমাত্র SN: কোড দেখান">
                <input type="checkbox" id="showOnlySN" checked> <strong>শুধু SN: কোড</strong>
              </label>
            </div>
          </div>
        </div>

        <!-- 6. Custom Presets Manager -->
        <div class="config-card">
          <div class="config-card-header">
            <span class="config-card-title">📂 সেভ করা কাস্টম প্রিসেট</span>
            <span class="config-card-tag">Presets</span>
          </div>
          <div id="customPresetsList" class="custom-presets-list"></div>
          <button type="button" class="btn-save-sidebar" id="btnSavePresetSidebar">
            ➕ বর্তমান টিউনিং প্রিসেট হিসেবে সেভ করুন
          </button>
        </div>
      </div>
    </aside>
  </div>

  <script>
    const STORAGE_KEY = 'techhat_grn_label_settings_v6';
    const CUSTOM_PRESETS_KEY = 'techhat_grn_user_presets_v1';
    const SIDEBAR_PREF_KEY = 'techhat_grn_sidebar_state_v1';

    // Built-in fine-tuned presets for 617-R58P thermal printer
    const PRESETS = {
      '50x25-perfect': {
        pageW: 50,
        pageH: 25,
        shiftX: 7.5,
        shiftY: 0,
        padL: -6.5,
        padR: 0,
        padT: 1,
        textAlign: 'center',
        logoH: 24,
        logoShiftX: -3.5,
        logoShiftY: 0,
        showLogo: true,
        showBrandText: true,
        infoSize: 9.5,
        infoShiftX: -3.5,
        infoShiftY: -0.5,
        showCat: false,
        barH: 35,
        barScale: 68,
        barShiftX: -5,
        barShiftY: -0.5,
        barW: '1.2',
        stripTH: true,
        showOnlySN: true,
        skuSize: 10.5,
        skuShiftX: -3.5,
        skuShiftY: -1,
        brandSize: 14.5
      },
      '50x25-std': {
        pageW: 50,
        pageH: 25,
        padL: 2,
        padR: 2,
        padT: 0.5,
        shiftX: 0,
        shiftY: 0,
        textAlign: 'center',
        logoH: 18,
        logoShiftX: 0,
        logoShiftY: 0,
        showLogo: true,
        showBrandText: false,
        infoSize: 8,
        infoShiftX: 0,
        infoShiftY: 0,
        skuSize: 6.5,
        skuShiftX: 0,
        skuShiftY: 0,
        brandSize: 10,
        barH: 34,
        barW: '1.5',
        barScale: 85,
        barShiftX: 0,
        barShiftY: 0,
        stripTH: true,
        showCat: true,
        showOnlySN: true
      },
      '35x25-center': {
        pageW: 35,
        pageH: 25,
        padL: 1.5,
        padR: 1.5,
        padT: 0.5,
        shiftX: 0,
        shiftY: 0,
        textAlign: 'center',
        logoH: 14,
        logoShiftX: 0,
        logoShiftY: 0,
        showLogo: true,
        showBrandText: false,
        infoSize: 6.5,
        infoShiftX: 0,
        infoShiftY: 0,
        skuSize: 5.5,
        skuShiftX: 0,
        skuShiftY: 0,
        brandSize: 8,
        barH: 26,
        barW: '1.2',
        barScale: 90,
        barShiftX: 0,
        barShiftY: 0,
        stripTH: true,
        showCat: false,
        showOnlySN: true
      },
      '35x25-left': {
        pageW: 35,
        pageH: 25,
        padL: 1,
        padR: 1,
        padT: 0.5,
        shiftX: -1,
        shiftY: 0,
        textAlign: 'center',
        logoH: 14,
        logoShiftX: 0,
        logoShiftY: 0,
        showLogo: true,
        showBrandText: false,
        infoSize: 6.5,
        infoShiftX: 0,
        infoShiftY: 0,
        skuSize: 5.5,
        skuShiftX: 0,
        skuShiftY: 0,
        brandSize: 8,
        barH: 26,
        barW: '1.2',
        barScale: 90,
        barShiftX: 0,
        barShiftY: 0,
        stripTH: true,
        showCat: false,
        showOnlySN: true
      },
      '35x25-tray-offset': {
        pageW: 35,
        pageH: 25,
        padL: 1,
        padR: 1,
        padT: 0.5,
        shiftX: 11.5,
        shiftY: 0,
        textAlign: 'center',
        logoH: 14,
        logoShiftX: 0,
        logoShiftY: 0,
        showLogo: true,
        showBrandText: false,
        infoSize: 6.5,
        infoShiftX: 0,
        infoShiftY: 0,
        skuSize: 5.5,
        skuShiftX: 0,
        skuShiftY: 0,
        brandSize: 8,
        barH: 26,
        barW: '1.2',
        barScale: 90,
        barShiftX: 0,
        barShiftY: 0,
        stripTH: true,
        showCat: false,
        showOnlySN: true
      }
    };

    const defaultSettings = PRESETS['50x25-perfect'];

    function getSettings() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return Object.assign({}, defaultSettings, JSON.parse(saved));
      } catch (e) {}
      return Object.assign({}, defaultSettings);
    }

    function getCurrentFormSettings() {
      return {
        pageW: parseFloat(document.getElementById('pageW').value) || 50,
        pageH: parseFloat(document.getElementById('pageH').value) || 25,
        padL: parseFloat(document.getElementById('padL').value) || 0,
        padR: parseFloat(document.getElementById('padR').value) || 0,
        padT: parseFloat(document.getElementById('padT').value) || 0,
        shiftX: parseFloat(document.getElementById('shiftX').value) || 0,
        shiftY: parseFloat(document.getElementById('shiftY').value) || 0,
        textAlign: document.getElementById('textAlign').value,
        logoH: parseFloat(document.getElementById('logoH').value) || 24,
        logoShiftX: parseFloat(document.getElementById('logoShiftX').value) || 0,
        logoShiftY: parseFloat(document.getElementById('logoShiftY').value) || 0,
        showLogo: document.getElementById('showLogo').checked,
        showBrandText: document.getElementById('showBrandText').checked,
        infoSize: parseFloat(document.getElementById('infoSize').value) || 9.5,
        infoShiftX: parseFloat(document.getElementById('infoShiftX').value) || 0,
        infoShiftY: parseFloat(document.getElementById('infoShiftY').value) || 0,
        skuSize: parseFloat(document.getElementById('skuSize').value) || 10.5,
        skuShiftX: parseFloat(document.getElementById('skuShiftX').value) || 0,
        skuShiftY: parseFloat(document.getElementById('skuShiftY').value) || 0,
        brandSize: parseFloat(document.getElementById('brandSize').value) || 14.5,
        barH: parseFloat(document.getElementById('barH').value) || 35,
        barW: document.getElementById('barW').value,
        barScale: parseFloat(document.getElementById('barScale').value) || 68,
        barShiftX: parseFloat(document.getElementById('barShiftX').value) || 0,
        barShiftY: parseFloat(document.getElementById('barShiftY').value) || 0,
        stripTH: document.getElementById('stripTH').checked,
        showCat: document.getElementById('showCat').checked,
        showOnlySN: document.getElementById('showOnlySN') ? document.getElementById('showOnlySN').checked : true
      };
    }

    function saveSettings() {
      const current = getCurrentFormSettings();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch (e) {}
    }

    function getCustomPresets() {
      try {
        const saved = localStorage.getItem(CUSTOM_PRESETS_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return [];
    }

    function saveCustomPresets(list) {
      try {
        localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(list));
      } catch (e) {}
    }

    function renderCustomPresets(activeId) {
      const listContainer = document.getElementById('customPresetsList');
      const optGroup = document.getElementById('customPresetOptGroup');
      const list = getCustomPresets();

      // Render dropdown optgroup
      optGroup.innerHTML = '';
      list.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = '📂 ' + item.name;
        optGroup.appendChild(opt);
      });

      // Render sidebar list
      listContainer.innerHTML = '';
      if (list.length === 0) {
        listContainer.innerHTML = '<span style="font-size:10.5px; color:#64748b; font-style:italic; padding:4px;">(কোন কাস্টম প্রিসেট সেভ করা নেই)</span>';
        return;
      }

      list.forEach(item => {
        const row = document.createElement('div');
        row.className = 'custom-preset-row' + (activeId === item.id ? ' active' : '');
        row.innerHTML = '<span>⭐ ' + item.name + '</span><button class="del-btn" title="ডিলিট করুন">✕</button>';
        
        row.addEventListener('click', function(e) {
          if (e.target.classList.contains('del-btn')) return;
          applySettings(item.settings);
          saveSettings();
          document.getElementById('presetSelect').value = item.id;
          renderCustomPresets(item.id);
        });

        const delBtn = row.querySelector('.del-btn');
        delBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (confirm('"' + item.name + '" প্রিসেটটি কি ডিলিট করতে চান?')) {
            const updated = getCustomPresets().filter(p => p.id !== item.id);
            saveCustomPresets(updated);
            renderCustomPresets();
            // Revert select to perfect if active was deleted
            if (document.getElementById('presetSelect').value === item.id) {
              document.getElementById('presetSelect').value = '50x25-perfect';
              applySettings(PRESETS['50x25-perfect']);
              saveSettings();
            }
          }
        });

        listContainer.appendChild(row);
      });
    }

    function applySettings(s) {
      const root = document.documentElement;
      document.getElementById('pageW').value = s.pageW;
      document.getElementById('pageH').value = s.pageH;
      document.getElementById('padL').value = s.padL;
      document.getElementById('padR').value = s.padR;
      document.getElementById('padT').value = s.padT;
      document.getElementById('shiftX').value = s.shiftX;
      document.getElementById('shiftY').value = s.shiftY;
      document.getElementById('textAlign').value = s.textAlign;
      document.getElementById('logoH').value = s.logoH;
      document.getElementById('logoShiftX').value = s.logoShiftX;
      document.getElementById('logoShiftY').value = s.logoShiftY;
      document.getElementById('showLogo').checked = s.showLogo;
      document.getElementById('showBrandText').checked = s.showBrandText;
      document.getElementById('infoSize').value = s.infoSize;
      document.getElementById('infoShiftX').value = s.infoShiftX;
      document.getElementById('infoShiftY').value = s.infoShiftY;
      document.getElementById('skuSize').value = s.skuSize;
      document.getElementById('skuShiftX').value = s.skuShiftX;
      document.getElementById('skuShiftY').value = s.skuShiftY;
      document.getElementById('brandSize').value = s.brandSize;
      document.getElementById('barH').value = s.barH;
      document.getElementById('barW').value = s.barW;
      document.getElementById('barScale').value = s.barScale;
      document.getElementById('barShiftX').value = s.barShiftX;
      document.getElementById('barShiftY').value = s.barShiftY;
      document.getElementById('stripTH').checked = s.stripTH;
      document.getElementById('showCat').checked = s.showCat;
      if (document.getElementById('showOnlySN')) {
        document.getElementById('showOnlySN').checked = (s.showOnlySN !== undefined ? s.showOnlySN : true);
      }

      // Update CSS Variables
      root.style.setProperty('--page-width', s.pageW + 'mm');
      root.style.setProperty('--page-height', s.pageH + 'mm');
      root.style.setProperty('--pad-left', s.padL + 'mm');
      root.style.setProperty('--pad-right', s.padR + 'mm');
      root.style.setProperty('--pad-top', s.padT + 'mm');
      root.style.setProperty('--shift-x', s.shiftX + 'mm');
      root.style.setProperty('--shift-y', s.shiftY + 'mm');
      root.style.setProperty('--text-align', s.textAlign);
      const flexAlign = s.textAlign === 'left' ? 'flex-start' : (s.textAlign === 'right' ? 'flex-end' : 'center');
      root.style.setProperty('--flex-align', flexAlign);

      root.style.setProperty('--logo-height', s.logoH + 'px');
      root.style.setProperty('--logo-shift-x', s.logoShiftX + 'mm');
      root.style.setProperty('--logo-shift-y', s.logoShiftY + 'mm');

      root.style.setProperty('--info-size', s.infoSize + 'px');
      root.style.setProperty('--info-shift-x', s.infoShiftX + 'mm');
      root.style.setProperty('--info-shift-y', s.infoShiftY + 'mm');

      root.style.setProperty('--sku-size', s.skuSize + 'px');
      root.style.setProperty('--sku-shift-x', s.skuShiftX + 'mm');
      root.style.setProperty('--sku-shift-y', s.skuShiftY + 'mm');

      root.style.setProperty('--brand-size', s.brandSize + 'px');
      root.style.setProperty('--bar-scale', s.barScale + '%');
      root.style.setProperty('--bar-shift-x', s.barShiftX + 'mm');
      root.style.setProperty('--bar-shift-y', s.barShiftY + 'mm');

      // Toggles
      document.querySelectorAll('.brand-logo').forEach(el => el.style.display = s.showLogo ? 'inline-block' : 'none');
      document.querySelectorAll('.brand-text').forEach(el => el.style.display = s.showBrandText ? 'inline-block' : 'none');
      document.querySelectorAll('.brand').forEach(el => el.style.display = (!s.showLogo && !s.showBrandText) ? 'none' : 'flex');
      document.querySelectorAll('.cat-wrapper').forEach(el => el.style.display = s.showCat ? 'inline' : 'none');

      // Update @page in DOM
      let pageStyle = document.getElementById('dynamicPageStyle');
      if (!pageStyle) {
        pageStyle = document.createElement('style');
        pageStyle.id = 'dynamicPageStyle';
        document.head.appendChild(pageStyle);
      }
      pageStyle.innerHTML = '@page { size: ' + s.pageW + 'mm ' + s.pageH + 'mm; margin: 0; }';

      // Barcode re-render
      renderBarcodes(s.barH, s.barW, s.stripTH, s.showOnlySN);
    }

    function renderBarcodes(heightVal, widthVal, stripVal, onlySNVal) {
      const h = parseInt(heightVal || document.getElementById('barH').value) || 35;
      const w = parseFloat(widthVal || document.getElementById('barW').value) || 1.2;
      const stripTH = (stripVal !== undefined) ? stripVal : document.getElementById('stripTH').checked;
      const showOnlySN = (onlySNVal !== undefined) 
        ? onlySNVal 
        : (document.getElementById('showOnlySN') ? document.getElementById('showOnlySN').checked : true);

      document.querySelectorAll('.barcode').forEach(function(el) {
        var rawBarcode = el.getAttribute('data-barcode') || el.getAttribute('data-sku') || '';
        var barcodeValue = stripTH ? rawBarcode.replace(/^TH-?/i, '') : rawBarcode;
        JsBarcode(el, barcodeValue, {
          format: 'CODE128',
          width: w,
          height: h,
          fontSize: 0,
          margin: 0,
          displayValue: false
        });
      });

      document.querySelectorAll('.sku-text').forEach(function(el) {
        if (showOnlySN) {
          var sn = el.getAttribute('data-sn') || '';
          if (sn) {
            el.textContent = 'SN: ' + sn;
          } else {
            var fullSku = el.getAttribute('data-full-sku') || el.textContent;
            el.textContent = 'SN: ' + (stripTH ? fullSku.replace(/^TH-?/i, '') : fullSku);
          }
        } else {
          var fullSku = el.getAttribute('data-full-sku') || el.textContent;
          el.textContent = stripTH ? fullSku.replace(/^TH-?/i, '') : fullSku;
        }
      });
    }

    function handleSaveNewPreset() {
      const currentPresets = getCustomPresets();
      const defaultName = 'আমার প্রিসেট ' + (currentPresets.length + 1);
      const name = prompt('বর্তমান সেটিংস সেভ করতে প্রিসেটের একটি নাম লিখুন (যেমন: 35x25 সাইড বা পারফেক্ট লেবেল):', defaultName);
      if (!name || !name.trim()) return;

      const newPreset = {
        id: 'preset_' + Date.now(),
        name: name.trim(),
        settings: getCurrentFormSettings()
      };

      currentPresets.push(newPreset);
      saveCustomPresets(currentPresets);
      renderCustomPresets(newPreset.id);
      document.getElementById('presetSelect').value = newPreset.id;
      alert('✅ প্রিসেট "' + newPreset.name + '" সফলভাবে সেভ হয়েছে!');
    }

    window.addEventListener('load', function() {
      const settings = getSettings();
      applySettings(settings);
      renderCustomPresets();
      document.getElementById('lcount').textContent = document.querySelectorAll('.label').length;

      // Sidebar Inspector Toggle Logic
      const sidebar = document.getElementById('inspectorSidebar');
      const toggleBtn = document.getElementById('toggleInspectorBtn');
      const closeBtn = document.getElementById('closeInspectorBtn');

      function toggleSidebar(open) {
        const isCollapsed = sidebar.classList.contains('collapsed');
        const shouldOpen = (open !== undefined) ? open : isCollapsed;
        if (shouldOpen) {
          sidebar.classList.remove('collapsed');
          toggleBtn.classList.add('active');
        } else {
          sidebar.classList.add('collapsed');
          toggleBtn.classList.remove('active');
        }
        try { localStorage.setItem(SIDEBAR_PREF_KEY, shouldOpen ? '1' : '0'); } catch(e) {}
      }

      toggleBtn.addEventListener('click', () => toggleSidebar());
      closeBtn.addEventListener('click', () => toggleSidebar(false));

      // Restore sidebar preference (default closed for clean mode)
      const savedPref = localStorage.getItem(SIDEBAR_PREF_KEY);
      if (savedPref === '1') {
        toggleSidebar(true);
      }

      // Dropdown preset selection
      const presetSelect = document.getElementById('presetSelect');
      presetSelect.addEventListener('change', function() {
        const val = this.value;
        if (PRESETS[val]) {
          applySettings(PRESETS[val]);
          saveSettings();
          renderCustomPresets();
        } else {
          const custom = getCustomPresets().find(p => p.id === val);
          if (custom) {
            applySettings(custom.settings);
            saveSettings();
            renderCustomPresets(custom.id);
          }
        }
      });

      // Quick save buttons
      document.getElementById('btnQuickSave').addEventListener('click', handleSaveNewPreset);
      document.getElementById('btnSavePresetSidebar').addEventListener('click', handleSaveNewPreset);

      // Inputs change listeners
      const inputIds = [
        'pageW', 'pageH', 'padL', 'padR', 'padT', 'shiftX', 'shiftY', 'textAlign',
        'logoH', 'logoShiftX', 'logoShiftY', 'showLogo', 'showBrandText',
        'infoSize', 'infoShiftX', 'infoShiftY', 'showCat',
        'barH', 'barW', 'barScale', 'barShiftX', 'barShiftY', 'stripTH',
        'skuSize', 'skuShiftX', 'skuShiftY', 'brandSize', 'showOnlySN'
      ];
      inputIds.forEach(function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const evt = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(evt, function() {
          saveSettings();
          applySettings(getCurrentFormSettings());
          // Mark as custom in select
          const manualOpt = document.getElementById('manualOption');
          if (manualOpt) {
            manualOpt.style.display = 'block';
            presetSelect.value = 'custom-manual';
          }
        });
      });

      // Reset button
      document.getElementById('resetBtn').addEventListener('click', function() {
        if (confirm('সব সেটিংস রিসেট করে পারফেক্ট 50x25 এ ফেরত যেতে চান?')) {
          try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
          applySettings(defaultSettings);
          saveSettings();
          presetSelect.value = '50x25-perfect';
          renderCustomPresets();
        }
      });
    });
  <\/script>
</body>
</html>`);
  popup.document.close();
}
