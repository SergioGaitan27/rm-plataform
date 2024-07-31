// media-extensions.d.ts

interface MediaTrackConstraints {
    focusMode?: ConstrainDOMString;
    focusDistance?: ConstrainDouble;
    torch?: ConstrainBoolean;
  }
  
  interface MediaTrackCapabilities {
    focusMode?: string[];
    focusDistance?: {
      max: number;
      min: number;
      step: number;
    };
    torch?: boolean;
  }
  
  interface MediaTrackSettings {
    torch?: boolean;
  }
  
  interface MediaTrackConstraintSet {
    torch?: boolean;
  }