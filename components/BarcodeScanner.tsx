// components/BarcodeScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Box {
  x: number;
  y: number;
}

interface CodeResult {
  code: string;
}

interface ProcessedResult {
  boxes: Point[][] | undefined;
  box: Point[] | undefined;
  codeResult: CodeResult | undefined;
  line: Point[] | undefined;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [torch, setTorch] = useState(false);

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
              facingMode: 'environment',
              advanced: [{ torch: torch }]
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: navigator.hardwareConcurrency,
          decoder: {
            readers: [
              'ean_reader', 
              'ean_8_reader', 
              // 'code_128_reader', 
              // 'code_39_reader', 
              // 'code_39_vin_reader', 
              // 'codabar_reader', 
              // 'upc_reader', 
              // 'upc_e_reader', 
              // 'i2of5_reader'
            ],
          },
          locate: true,
          frequency: 10,
          area: {
            top: "20%",
            right: "20%",
            left: "20%",
            bottom: "20%"
          }
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

      Quagga.onProcessed((result: ProcessedResult) => {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            result.boxes.filter((box) => box !== result.box).forEach((box: Point[]) => {
              Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: 'green', lineWidth: 2 });
            });
          }

          if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: 'blue', lineWidth: 2 });
          }

          if (result.codeResult && result.codeResult.code) {
            if (result.line) {
              Quagga.ImageDebug.drawPath(result.line, { x: 0, y: 1 }, drawingCtx, { color: 'red', lineWidth: 3 });
            }
          }
        }
      });
    }

    return () => {
      Quagga.stop();
    };
  }, [onScan, torch]);

  const toggleTorch = async () => {
    const stream = scannerRef.current?.querySelector('video')?.srcObject as MediaStream;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torch }]
          });
          setTorch(!torch);
        } catch (err) {
          console.error('Error toggling torch:', err);
        }
      } else {
        console.log('Torch is not supported on this device');
      }
    }
  };

  const handleClick = async () => {
    const stream = scannerRef.current?.querySelector('video')?.srcObject as MediaStream;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      const constraints: MediaTrackConstraints = {};
      
      if ('focusMode' in capabilities) {
        constraints.focusMode = 'manual';
      }
      
      if ('focusDistance' in capabilities && capabilities.focusDistance) {
        constraints.focusDistance = capabilities.focusDistance.min;
      }

      if (Object.keys(constraints).length > 0) {
        try {
          await track.applyConstraints(constraints);
        } catch (error) {
          console.error('Error applying focus constraints:', error);
        }
      } else {
        console.log('Focus capabilities are not available on this device.');
      }
    }
  };

  return (
    <div className="scanner-container" onClick={handleClick}>
      <div ref={scannerRef} className="scanner" />
      <div className="overlay">
        <div className="overlay-inner" />
      </div>
      <button
        onClick={toggleTorch}
        className="torch-button"
      >
        {torch ? 'Apagar Linterna' : 'Encender Linterna'}
      </button>
    </div>
  );
};