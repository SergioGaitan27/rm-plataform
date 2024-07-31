import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from 'quagga';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

interface Point {
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
  const torchRef = useRef(false);

  const applyTorchState = useCallback(async () => {
    const stream = scannerRef.current?.querySelector('video')?.srcObject as MediaStream;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: torchRef.current }]
          });
        } catch (err) {
          console.error('Error applying torch state:', err);
        }
      }
    }
  }, []);

  const initializeScanner = useCallback(() => {
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
              'code_128_reader', 
              'code_39_reader', 
              'code_39_vin_reader', 
              'codabar_reader', 
              'upc_reader', 
              'upc_e_reader', 
              'i2of5_reader'
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
          applyTorchState();
        }
      );

      Quagga.onDetected(async (result) => {
        if (result.codeResult.code) {
          await onScan(result.codeResult.code);
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
  }, [onScan, applyTorchState]);

  useEffect(() => {
    let isMounted = true;

    const setupScanner = async () => {
      await initializeScanner();
    };

    if (isMounted) {
      setupScanner();
    }

    return () => {
      isMounted = false;
      Quagga.stop();
    };
  }, [initializeScanner]);

  const toggleTorch = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    torchRef.current = !torchRef.current;
    setTorch(torchRef.current);
    await applyTorchState();
  };

  const focusCamera = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const stream = scannerRef.current?.querySelector('video')?.srcObject as MediaStream;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      const constraints: MediaTrackConstraints = {};
      
      if ('focusMode' in capabilities) {
        constraints.focusMode = 'auto';
      }
      
      if (Object.keys(constraints).length > 0) {
        try {
          await track.applyConstraints(constraints);
          console.log('Enfoque automático aplicado');
          
          // Volver a modo manual después de un corto delay
          setTimeout(async () => {
            try {
              await track.applyConstraints({ focusMode: 'manual' });
              console.log('Volviendo a modo de enfoque manual');
            } catch (error) {
              console.error('Error al volver a modo de enfoque manual:', error);
            }
          }, 1000); // Espera 1 segundo antes de volver a modo manual
        } catch (error) {
          console.error('Error al aplicar enfoque automático:', error);
        }
      } else {
        console.log('Las capacidades de enfoque no están disponibles en este dispositivo.');
      }
    }
  };

  return (
    <div className="scanner-container">
      <div ref={scannerRef} className="scanner" />
      <div className="overlay">
        <div className="overlay-inner" />
      </div>
      <div className="button-container">
        <button
          onClick={toggleTorch}
          className="scanner-button torch-button"
        >
          {torch ? 'Apagar Linterna' : 'Encender Linterna'}
        </button>
        <button
          onClick={focusCamera}
          className="scanner-button focus-button"
        >
          Enfocar
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;