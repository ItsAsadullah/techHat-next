import MobileScanner from './mobile-scanner';

export const metadata = {
  title: 'TechHat Barcode Scanner',
  description: 'Scan barcodes using your mobile camera',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default async function ScannerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  
  return <MobileScanner sessionId={sessionId} />;
}
