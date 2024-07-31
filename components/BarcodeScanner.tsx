// components/BarcodeScanner.tsx
import React, { useEffect, useRef } from 'react';
import Quagga from 'quagga';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scannerRef.current) {
      Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: scannerRef.current,
            constraints: {
              width: 640,
              height: 480,
              facingMode: 'environment', // use the rear camera
            },
          },
          decoder: {
            readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'code_39_vin_reader', 'codabar_reader', 'upc_reader', 'upc_e_reader', 'i2of5_reader'],
          },
        },
        (err) => {
          if (err) {
            console.error('Error initializing Quagga:', err);
            return;
          }
          Quagga.start();
        }
      );

      Quagga.onDetected((result) => {
        if (result.codeResult.code) {
          onScan(result.codeResult.code);
          Quagga.stop();
        }
      });
    }

    return () => {
      Quagga.stop();
    };
  }, [onScan]);

  return <div ref={scannerRef} className="w-full h-64 relative" />;
};