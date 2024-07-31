// components/BarcodeScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    const initializeScanner = async () => {
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        setDevices(videoInputDevices);

        if (videoInputDevices.length === 0) {
          setError('No se encontraron cámaras disponibles.');
          return;
        }

        // Seleccionar la cámara trasera por defecto si está disponible
        const backCamera = videoInputDevices.find(device => /(back|rear)/i.test(device.label));
        setSelectedDeviceId(backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId);

      } catch (err) {
        console.error('Error al inicializar el escáner:', err);
        setError('Error al inicializar el escáner. Por favor, intente de nuevo.');
      }
    };

    initializeScanner();

    return () => {
      codeReader.reset();
    };
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;

    const codeReader = new BrowserMultiFormatReader();
    
    codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current!, (result, err) => {
      if (result) {
        onScan(result.getText());
        codeReader.reset();
      }
      if (err && !(err instanceof TypeError)) { // Ignorar errores de tipo que ocurren normalmente
        console.error('Error de escaneo:', err);
      }
    });

    return () => {
      codeReader.reset();
    };
  }, [selectedDeviceId, onScan]);

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(event.target.value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-lg w-full">
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <>
            <video ref={videoRef} className="w-full aspect-video" />
            <select onChange={handleDeviceChange} value={selectedDeviceId} className="mt-2 w-full p-2 border rounded">
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="mt-4 flex justify-between">
          <button 
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};