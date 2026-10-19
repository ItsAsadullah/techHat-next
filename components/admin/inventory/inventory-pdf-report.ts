'use client';

import { toast } from 'sonner';

export interface PDFReconciliationItem {
  key?: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  sku: string;
  categoryName?: string;
  warehouseCode: string;
  warehouseName: string;
  openingStock?: number;
  totalIn: number;
  totalOut: number;
  closingStock: number;
  catalogStock?: number;
  physicalCount?: number | null;
  unitCost: number;
  totalValue: number;
  txCount?: number;
}

export interface PDFLedgerEntry {
  id: string;
  createdAt: Date | string;
  referenceType: string;
  referenceId: string;
  warehouse: { id: string; name: string; code: string };
  product: { id: string; name: string; sku: string | null };
  variant?: { id: string; name: string; sku: string | null } | null;
  inQty: number;
  outQty: number;
  balanceQty: number;
  unitCost: number;
  totalValue: number;
  note?: string | null;
}

export interface InventoryPDFReportOptions {
  title?: string;
  subtitle?: string;
  defaultMode?: 'combined' | 'reconciliation' | 'ledger';
  defaultOrientation?: 'portrait' | 'landscape';
  filterSummary?: {
    dateFrom?: string;
    dateTo?: string;
    warehouse?: string;
    referenceType?: string;
    search?: string;
  };
  summary: {
    totalEntries?: number;
    totalIn: number;
    totalOut: number;
    totalValue: number;
    totalSkus?: number;
    totalPhysicalUnits?: number;
  };
  reconciliationItems: PDFReconciliationItem[];
  ledgerEntries?: PDFLedgerEntry[];
}

function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBDT(amount: number): string {
  return '৳' + Number(amount || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(dt: Date | string): string {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function openInventoryPDFReport(options: InventoryPDFReportOptions) {
  const {
    defaultMode = 'combined',
    defaultOrientation = 'portrait',
    filterSummary,
    summary,
    reconciliationItems = [],
    ledgerEntries = [],
  } = options;

  const popup = window.open('', '_blank', 'width=1200,height=860,toolbar=0,menubar=0,scrollbars=yes');
  if (!popup) {
    toast.error('পপ-আপ ব্লক করা হয়েছে! দয়া করে এই সাইটের জন্য পপ-আপ (Popup) অ্যালাউ করুন।');
    return;
  }

  const nowStr = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateSlug = new Date().toISOString().split('T')[0];

  const totalClosingUnits = reconciliationItems.reduce((acc, item) => acc + (item.closingStock || 0), 0);
  const totalClosingAssetValue = reconciliationItems.reduce((acc, item) => acc + (item.totalValue || 0), 0);
  const totalReconIn = reconciliationItems.reduce((acc, item) => acc + (item.totalIn || 0), 0);
  const totalReconOut = reconciliationItems.reduce((acc, item) => acc + (item.totalOut || 0), 0);

  const filterChips: string[] = [];
  if (filterSummary?.dateFrom || filterSummary?.dateTo) {
    filterChips.push(`তারিখ: ${escapeHtml(filterSummary.dateFrom || 'শুরু')} থেকে ${escapeHtml(filterSummary.dateTo || 'আজ')}`);
  } else {
    filterChips.push('তারিখ: সকল সময় (All Time)');
  }
  if (filterSummary?.warehouse) {
    filterChips.push(`ওয়্যারহাউস: ${escapeHtml(filterSummary.warehouse)}`);
  } else {
    filterChips.push('ওয়্যারহাউস: সকল ওয়্যারহাউস');
  }
  if (filterSummary?.referenceType) {
    filterChips.push(`ট্রানজেকশন ধরন: ${escapeHtml(filterSummary.referenceType)}`);
  }
  if (filterSummary?.search) {
    filterChips.push(`সার্চ: "${escapeHtml(filterSummary.search)}"`);
  }

  const reconciliationRowsHtml =
    reconciliationItems.length === 0
      ? `<tr><td colspan="12" class="empty-cell">কোনো প্রোডাক্ট রেকর্ড পাওয়া যায়নি।</td></tr>`
      : reconciliationItems
          .map((item, idx) => {
            const fullName = item.variantName
              ? `${escapeHtml(item.productName)} <span class="variant-tag">(${escapeHtml(item.variantName)})</span>`
              : escapeHtml(item.productName);
            const hasPhysical = item.physicalCount !== undefined && item.physicalCount !== null;
            const variance = hasPhysical ? Number(item.physicalCount) - item.closingStock : null;
            const varianceStr =
              variance === null
                ? ''
                : variance === 0
                ? '<span class="badge-ok">✓ মিলেছে (0)</span>'
                : variance > 0
                ? `<span class="badge-in">+${variance} বেশি</span>`
                : `<span class="badge-out">${variance} কম</span>`;

            return `
              <tr>
                <td class="text-center mono">${idx + 1}</td>
                <td>
                  <div class="prod-name">${fullName}</div>
                  ${item.categoryName ? `<div class="prod-sub">${escapeHtml(item.categoryName)}</div>` : ''}
                </td>
                <td class="mono">${escapeHtml(item.sku || 'N/A')}</td>
                <td class="text-center mono"><span class="wh-badge">${escapeHtml(item.warehouseCode || 'MAIN')}</span></td>
                <td class="text-right mono">${item.openingStock ?? 0}</td>
                <td class="text-right mono text-in">+${item.totalIn}</td>
                <td class="text-right mono text-out">-${item.totalOut}</td>
                <td class="text-right mono font-bold bg-soft">${item.closingStock}</td>
                <td class="text-right mono col-cost">${formatBDT(item.unitCost)}</td>
                <td class="text-right mono font-bold col-cost">${formatBDT(item.totalValue)}</td>
                <td class="text-center mono col-physical">${
                  hasPhysical ? `<strong>${item.physicalCount}</strong>` : '<div class="write-box"></div>'
                }</td>
                <td class="text-center mono col-physical">${
                  variance !== null ? varianceStr : '<div class="write-box"></div>'
                }</td>
              </tr>
            `;
          })
          .join('');

  const ledgerRowsHtml =
    ledgerEntries.length === 0
      ? `<tr><td colspan="9" class="empty-cell">কোনো স্টক লেজার ট্রানজেকশন পাওয়া যায়নি।</td></tr>`
      : ledgerEntries
          .map((entry, idx) => {
            const fullName = entry.variant
              ? `${escapeHtml(entry.product.name)} <span class="variant-tag">(${escapeHtml(entry.variant.name)})</span>`
              : escapeHtml(entry.product.name);
            const sku = entry.variant?.sku || entry.product.sku || '';
            return `
              <tr>
                <td class="text-center mono">${idx + 1}</td>
                <td class="mono nowrap">${escapeHtml(formatDateTime(entry.createdAt))}</td>
                <td class="text-center mono"><span class="wh-badge">${escapeHtml(entry.warehouse.code)}</span></td>
                <td>
                  <span class="type-badge">${escapeHtml(entry.referenceType.replace(/_/g, ' '))}</span>
                  ${entry.note ? `<div class="note-text">${escapeHtml(entry.note)}</div>` : ''}
                </td>
                <td>
                  <div class="prod-name">${fullName}</div>
                  ${sku ? `<div class="prod-sub mono">SKU: ${escapeHtml(sku)}</div>` : ''}
                </td>
                <td class="text-right mono text-in">${entry.inQty > 0 ? `+${entry.inQty}` : '—'}</td>
                <td class="text-right mono text-out">${entry.outQty > 0 ? `-${entry.outQty}` : '—'}</td>
                <td class="text-right mono font-bold bg-soft">${entry.balanceQty}</td>
                <td class="text-right mono col-cost">${formatBDT(entry.unitCost)}</td>
                <td class="text-right mono font-bold col-cost">${formatBDT(entry.totalValue)}</td>
              </tr>
            `;
          })
          .join('');

  popup.document.write(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <title>TechHat-Inventory-Report-${dateSlug}</title>
  <style id="page-orientation-style">
    @page {
      size: A4 ${defaultOrientation};
      margin: 10mm 10mm 12mm 10mm;
    }
  </style>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Noto Sans Bengali', sans-serif;
    }
    body {
      background: #0f172a;
      color: #0f172a;
      min-height: 100vh;
    }

    /* ── Top Studio Control Bar (Hidden in Print/PDF) ── */
    .studio-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 10px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: #f8fafc;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    }
    .studio-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .studio-brand {
      font-size: 14px;
      font-weight: 800;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 7px;
      padding-right: 12px;
      border-right: 1px solid #334155;
    }
    .studio-brand .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }
    .control-group {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #0f172a;
      border: 1px solid #334155;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
    }
    .control-group label {
      color: #94a3b8;
      font-weight: 600;
      font-size: 11px;
    }
    .control-select {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #475569;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      outline: none;
    }
    .toggle-label {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      color: #e2e8f0;
      cursor: pointer;
      user-select: none;
      padding: 4px 8px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
    }
    .toggle-label input {
      accent-color: #38bdf8;
      width: 14px;
      height: 14px;
      cursor: pointer;
    }
    .studio-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-pdf {
      background: linear-gradient(135deg, #4f46e5, #4338ca);
      color: #ffffff;
      border: none;
      padding: 8px 20px;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45);
      transition: all 0.15s ease;
    }
    .btn-pdf:hover {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      transform: translateY(-1px);
    }
    .btn-close {
      background: #334155;
      color: #e2e8f0;
      border: 1px solid #475569;
      padding: 8px 14px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-close:hover {
      background: #ef4444;
      border-color: #ef4444;
      color: #fff;
    }

    /* ── Paper Sheet Container ── */
    .paper-viewport {
      padding: 24px 16px 60px;
      display: flex;
      justify-content: center;
    }
    .paper-sheet {
      background: #ffffff;
      color: #0f172a;
      width: 210mm;
      min-height: 297mm;
      padding: 12mm;
      border-radius: 6px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      transition: width 0.2s ease;
    }
    body.landscape-mode .paper-sheet {
      width: 297mm;
      min-height: 210mm;
    }

    /* ── Report Header ── */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .company-block h1 {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .company-block .tagline {
      font-size: 11px;
      color: #475569;
      font-weight: 600;
      margin-top: 2px;
    }
    .report-meta {
      text-align: right;
    }
    .report-title-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 4px;
      letter-spacing: 0.3px;
    }
    .report-meta .meta-line {
      font-size: 10.5px;
      color: #475569;
      margin-top: 4px;
    }

    /* ── Filter Bar ── */
    .filter-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 10px;
      margin-bottom: 14px;
      font-size: 10.5px;
      color: #334155;
    }
    .filter-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* ── Summary KPI Grid ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .kpi-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .kpi-box .kpi-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.3px;
    }
    .kpi-box .kpi-val {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 3px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .kpi-box.in .kpi-val { color: #059669; }
    .kpi-box.out .kpi-val { color: #e11d48; }
    .kpi-box.val .kpi-val { color: #4f46e5; }

    /* ── Section Headings ── */
    .section-block {
      margin-bottom: 20px;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f1f5f9;
      border-left: 4px solid #4f46e5;
      padding: 6px 10px;
      margin-bottom: 8px;
    }
    .section-header h2 {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .section-header span {
      font-size: 10.5px;
      color: #475569;
      font-weight: 600;
    }

    /* ── Data Tables ── */
    table.report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    table.report-table thead {
      display: table-header-group;
    }
    table.report-table tr {
      page-break-inside: avoid;
    }
    table.report-table th {
      background: #1e293b;
      color: #ffffff;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.3px;
      padding: 6px 6px;
      border: 1px solid #1e293b;
      text-align: left;
    }
    table.report-table td {
      padding: 5.5px 6px;
      border: 1px solid #cbd5e1;
      vertical-align: middle;
      color: #0f172a;
    }
    table.report-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    table.report-table tfoot td {
      background: #f1f5f9;
      font-weight: 800;
      border-top: 2px solid #0f172a;
      padding: 7px 6px;
    }

    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .nowrap { white-space: nowrap; }
    .font-bold { font-weight: 700; }
    .bg-soft { background: #f1f5f9; }
    .text-in { color: #059669; font-weight: 700; }
    .text-out { color: #e11d48; font-weight: 700; }

    .prod-name {
      font-weight: 700;
      font-size: 10.5px;
      line-height: 1.25;
    }
    .variant-tag {
      color: #4f46e5;
      font-weight: 600;
    }
    .prod-sub {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 1px;
    }
    .wh-badge {
      display: inline-block;
      background: #e2e8f0;
      color: #0f172a;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9.5px;
    }
    .type-badge {
      display: inline-block;
      border: 1px solid #94a3b8;
      background: #f8fafc;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 700;
    }
    .note-text {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    .write-box {
      width: 54px;
      height: 18px;
      border: 1px dashed #94a3b8;
      border-radius: 3px;
      margin: 0 auto;
      background: #ffffff;
    }
    .badge-ok { color: #059669; font-weight: 700; font-size: 9.5px; }
    .badge-in { color: #0284c7; font-weight: 700; font-size: 9.5px; }
    .badge-out { color: #e11d48; font-weight: 700; font-size: 9.5px; }
    .empty-cell {
      text-align: center;
      padding: 20px !important;
      color: #64748b;
      font-style: italic;
    }

    /* Visibility Toggles */
    body.hide-cost .col-cost { display: none !important; }
    body.hide-physical .col-physical { display: none !important; }
    body.mode-reconciliation #ledger-section { display: none !important; }
    body.mode-ledger #reconciliation-section { display: none !important; }

    /* ── Signature Block for Audit & Reconciliation ── */
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      margin-top: 38px;
      padding-top: 16px;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #334155;
      padding-top: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }

    .report-footer {
      margin-top: 18px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
    }

    /* ── Native Print / Save as PDF Rules ── */
    @media print {
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .studio-bar {
        display: none !important;
      }
      .paper-viewport {
        padding: 0 !important;
        display: block !important;
      }
      .paper-sheet {
        width: 100% !important;
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    }
  </style>
</head>
<body class="mode-${defaultMode} ${defaultOrientation === 'landscape' ? 'landscape-mode' : ''}">
  <!-- Top Interactive Control Bar -->
  <div class="studio-bar">
    <div class="studio-left">
      <div class="studio-brand">
        <span class="dot"></span>
        <span>TechHat PDF Report Studio</span>
      </div>

      <div class="control-group">
        <label for="mode-select">রিপোর্ট ধরন:</label>
        <select id="mode-select" class="control-select" onchange="setReportMode(this.value)">
          <option value="combined" ${defaultMode === 'combined' ? 'selected' : ''}>📊 স্টক মিলকরণ + লেজার (Combined)</option>
          <option value="reconciliation" ${defaultMode === 'reconciliation' ? 'selected' : ''}>📋 শুধু স্টক হিসাব মিলকরণ শিট (Reconciliation Sheet)</option>
          <option value="ledger" ${defaultMode === 'ledger' ? 'selected' : ''}>📖 শুধু স্টক লেজার ট্রানজেকশন (Stock Ledger Only)</option>
        </select>
      </div>

      <div class="control-group">
        <label for="orient-select">পেজ সাইজ:</label>
        <select id="orient-select" class="control-select" onchange="setOrientation(this.value)">
          <option value="portrait" ${defaultOrientation === 'portrait' ? 'selected' : ''}>A4 Portrait (লম্বালম্বি)</option>
          <option value="landscape" ${defaultOrientation === 'landscape' ? 'selected' : ''}>A4 Landscape (আড়াআড়ি)</option>
        </select>
      </div>

      <label class="toggle-label">
        <input type="checkbox" checked onchange="togglePhysicalCols(this.checked)" />
        <span>বাস্তব স্টক গননার ঘর (Physical Count)</span>
      </label>

      <label class="toggle-label">
        <input type="checkbox" checked onchange="toggleCostCols(this.checked)" />
        <span>ক্রয়মূল্য ও ভ্যালু দেখান (Cost & Value)</span>
      </label>
    </div>

    <div class="studio-actions">
      <button type="button" class="btn-pdf" onclick="window.print()">
        🖨️ প্রিন্ট / Save as PDF
      </button>
      <button type="button" class="btn-close" onclick="window.close()">
        ✕ বন্ধ করুন
      </button>
    </div>
  </div>

  <!-- A4 Printable Sheet -->
  <div class="paper-viewport">
    <div class="paper-sheet">
      <!-- Report Header -->
      <div class="report-header">
        <div class="company-block">
          <h1>TECHHAT</h1>
          <div class="tagline">Enterprise Inventory & Stock Audit Management System</div>
        </div>
        <div class="report-meta">
          <div id="dynamic-report-title" class="report-title-badge">
            ${
              defaultMode === 'reconciliation'
                ? 'STOCK RECONCILIATION & AUDIT SHEET'
                : defaultMode === 'ledger'
                ? 'IMMUTABLE STOCK LEDGER REPORT'
                : 'INVENTORY RECONCILIATION & LEDGER REPORT'
            }
          </div>
          <div class="meta-line">তৈরির সময়: <strong>${escapeHtml(nowStr)}</strong></div>
        </div>
      </div>

      <!-- Filter Strip -->
      <div class="filter-strip">
        ${filterChips.map((chip) => `<span class="filter-chip">${chip}</span>`).join('')}
      </div>

      <!-- Executive Summary KPIs -->
      <div class="kpi-grid">
        <div class="kpi-box">
          <div class="kpi-label">মোট প্রোডাক্ট / SKU</div>
          <div class="kpi-val">${reconciliationItems.length.toLocaleString()}</div>
        </div>
        <div class="kpi-box in">
          <div class="kpi-label">মোট স্টক ইন (+)</div>
          <div class="kpi-val">+${(summary.totalIn || totalReconIn).toLocaleString()}</div>
        </div>
        <div class="kpi-box out">
          <div class="kpi-label">মোট স্টক আউট (-)</div>
          <div class="kpi-val">-${(summary.totalOut || totalReconOut).toLocaleString()}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">বর্তমান সিস্টেম স্টক</div>
          <div class="kpi-val">${totalClosingUnits.toLocaleString()} টি</div>
        </div>
        <div class="kpi-box val col-cost">
          <div class="kpi-label">বর্তমান স্টকের মোট মূল্য</div>
          <div class="kpi-val">${formatBDT(totalClosingAssetValue)}</div>
        </div>
      </div>

      <!-- Section 1: Product-wise Stock Reconciliation & Physical Audit Sheet -->
      <div id="reconciliation-section" class="section-block">
        <div class="section-header">
          <h2>১. প্রোডাক্ট ভিত্তিক স্টক হিসাব মিলকরণ শিট (Product-wise Stock Reconciliation Sheet)</h2>
          <span>মোট ${reconciliationItems.length} টি আইটেম</span>
        </div>
        <table class="report-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 30px;">#</th>
              <th>প্রোডাক্ট / ভেরিয়েন্ট (Product / Variant)</th>
              <th>SKU</th>
              <th class="text-center">লোকেশন</th>
              <th class="text-right">শুরুর স্টক</th>
              <th class="text-right">মোট ইন (+)</th>
              <th class="text-right">মোট আউট (-)</th>
              <th class="text-right">সিস্টেম স্টক</th>
              <th class="text-right col-cost">একক মূল্য (MAC)</th>
              <th class="text-right col-cost">মোট স্টক মূল্য</th>
              <th class="text-center col-physical" style="width: 72px;">বাস্তব স্টক</th>
              <th class="text-center col-physical" style="width: 72px;">কম / বেশি</th>
            </tr>
          </thead>
          <tbody>
            ${reconciliationRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-right">সর্বমোট (Grand Total):</td>
              <td class="text-right mono">—</td>
              <td class="text-right mono text-in">+${totalReconIn.toLocaleString()}</td>
              <td class="text-right mono text-out">-${totalReconOut.toLocaleString()}</td>
              <td class="text-right mono">${totalClosingUnits.toLocaleString()}</td>
              <td class="text-right mono col-cost">—</td>
              <td class="text-right mono col-cost">${formatBDT(totalClosingAssetValue)}</td>
              <td class="col-physical"></td>
              <td class="col-physical"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Section 2: Detailed Chronological Stock Ledger -->
      <div id="ledger-section" class="section-block">
        <div class="section-header">
          <h2>২. বিস্তারিত স্টক লেজার ট্রানজেকশন হিস্টোরি (Detailed Stock Ledger Movements)</h2>
          <span>মোট ${ledgerEntries.length} টি ট্রানজেকশন</span>
        </div>
        <table class="report-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 30px;">#</th>
              <th>তারিখ ও সময়</th>
              <th class="text-center">লোকেশন</th>
              <th>টাইপ ও রেফারেন্স</th>
              <th>প্রোডাক্ট ও SKU</th>
              <th class="text-right">স্টক ইন</th>
              <th class="text-right">স্টক আউট</th>
              <th class="text-right">রানিং ব্যালেন্স</th>
              <th class="text-right col-cost">একক মূল্য</th>
              <th class="text-right col-cost">মোট মূল্য</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="text-right">লেজার ট্রানজেকশন যোগফল (Ledger Totals):</td>
              <td class="text-right mono text-in">+${summary.totalIn.toLocaleString()}</td>
              <td class="text-right mono text-out">-${summary.totalOut.toLocaleString()}</td>
              <td class="text-right mono">—</td>
              <td class="text-right mono col-cost">—</td>
              <td class="text-right mono col-cost">${formatBDT(summary.totalValue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Signature Block for Physical Verification & Audit -->
      <div class="signature-grid">
        <div class="sig-box">
          <div class="sig-line">প্রস্তুতকারী (Prepared By)</div>
          <div class="sig-sub">নাম, পদবী ও তারিখ</div>
        </div>
        <div class="sig-box">
          <div class="sig-line">স্টক গননা ও যাচাইকারী (Verified By)</div>
          <div class="sig-sub">ফিজিক্যাল অডিট ও ইনভেন্টরি অফিসার</div>
        </div>
        <div class="sig-box">
          <div class="sig-line">অনুমোদনকারী (Approved By)</div>
          <div class="sig-sub">ম্যানেজমেন্ট / কর্তৃপক্ষ</div>
        </div>
      </div>

      <div class="report-footer">
        <span>Generated by TechHat ERP — Immutable Stock Audit & Reconciliation System</span>
        <span>Print / Save as PDF (A4)</span>
      </div>
    </div>
  </div>

  <script>
    function setReportMode(mode) {
      document.body.classList.remove('mode-combined', 'mode-reconciliation', 'mode-ledger');
      document.body.classList.add('mode-' + mode);
      var badge = document.getElementById('dynamic-report-title');
      if (mode === 'reconciliation') {
        badge.textContent = 'STOCK RECONCILIATION & PHYSICAL AUDIT SHEET';
        document.title = 'TechHat-Stock-Reconciliation-${dateSlug}';
      } else if (mode === 'ledger') {
        badge.textContent = 'IMMUTABLE STOCK LEDGER REPORT';
        document.title = 'TechHat-Stock-Ledger-${dateSlug}';
      } else {
        badge.textContent = 'INVENTORY RECONCILIATION & LEDGER REPORT';
        document.title = 'TechHat-Inventory-Report-${dateSlug}';
      }
    }

    function setOrientation(orient) {
      var styleEl = document.getElementById('page-orientation-style');
      styleEl.innerHTML = '@page { size: A4 ' + orient + '; margin: 10mm 10mm 12mm 10mm; }';
      if (orient === 'landscape') {
        document.body.classList.add('landscape-mode');
      } else {
        document.body.classList.remove('landscape-mode');
      }
    }

    function togglePhysicalCols(show) {
      if (show) {
        document.body.classList.remove('hide-physical');
      } else {
        document.body.classList.add('hide-physical');
      }
    }

    function toggleCostCols(show) {
      if (show) {
        document.body.classList.remove('hide-cost');
      } else {
        document.body.classList.add('hide-cost');
      }
    }
  </script>
</body>
</html>`);

  popup.document.close();
}
