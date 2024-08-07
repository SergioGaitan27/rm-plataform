declare module 'browser-image-compression' {
    function imageCompression(file: File, options?: {
      maxSizeMB?: number,
      maxWidthOrHeight?: number,
      useWebWorker?: boolean,
      [key: string]: any
    }): Promise<File>;
    
    export = imageCompression;
  }