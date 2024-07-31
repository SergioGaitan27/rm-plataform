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
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'environment', // Use the rear camera
              focusMode: 'continuous', // Continuous focus
              advanced: [{
                focusMode: 'continuous',
                focusDistance: { ideal: 0.1 } // Try to set focus distance for close objects
              }]
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: navigator.hardwareConcurrency,
          decoder: {
            readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'code_39_vin_reader', 'codabar_reader', 'upc_reader', 'upc_e_reader', 'i2of5_reader'],
          },
          locate: true,
          frequency: 10, // Increase scan frequency for faster scanning
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

  return (
    <div className="scanner-container">
      <div ref={scannerRef} className="scanner" />
      <div className="overlay">
        <div className="overlay-inner" />
      </div>
    </div>
  );
};