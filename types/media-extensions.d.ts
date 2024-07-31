// media-extensions.d.ts

interface MediaTrackConstraints {
    focusMode?: ConstrainDOMString;
    focusDistance?: ConstrainDouble;
  }
  
  interface MediaTrackCapabilities {
    focusMode?: string[];
    focusDistance?: {
      max: number;
      min: number;
      step: number;
    };
  }