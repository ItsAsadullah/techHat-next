'use client';

import React from 'react';
import Barcode from 'react-barcode';

export interface GRNLabelPrinterProps {
  grnItems: any[];
  width?: string;
  height?: string;
}

export const GRNLabelPrinter = React.forwardRef<HTMLDivElement, GRNLabelPrinterProps>(
  ({ grnItems, width = '50', height = '25' }, ref) => {
    // Generate an array of labels based on acceptedQty
    const labels: any[] = [];
    grnItems.forEach((item) => {
      const qty = item.acceptedQty || 0;
      for (let i = 0; i < qty; i++) {
        labels.push(item);
      }
    });

    return (
      <div ref={ref} className="bg-white text-black">
        <style type="text/css" media="print">
          {`
            @page {
              size: ${width}mm ${height}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
            }
            * {
              box-sizing: border-box;
            }
            @media print {
              html, body {
                width: ${width}mm;
                height: ${height}mm;
              }
            }
          `}
        </style>
        {labels.map((item, index) => {
          const name = item.product?.name || 'Unknown Product';
          const sku = item.variant?.sku || item.product?.sku || 'N/A';
          const price = item.variant?.price || item.product?.price || 0;

          return (
            <div
              key={index}
              style={{
                width: `${width}mm`,
                height: `${height}mm`,
                overflow: 'hidden',
                pageBreakAfter: 'always',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '1mm',
                backgroundColor: 'white',
              }}
            >
              <div 
                style={{ 
                  fontSize: '8px', 
                  fontWeight: 'bold', 
                  textAlign: 'center', 
                  lineHeight: '1.2', 
                  marginBottom: '1px', 
                  maxHeight: '18px', 
                  overflow: 'hidden', 
                  width: '100%',
                  wordBreak: 'break-all'
                }}
              >
                {name}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <Barcode
                  value={sku}
                  width={1}
                  height={20}
                  fontSize={8}
                  margin={0}
                  background="transparent"
                  displayValue={true}
                />
              </div>

              <div style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '2px' }}>
                Price: ৳{price}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

GRNLabelPrinter.displayName = 'GRNLabelPrinter';
