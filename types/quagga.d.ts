declare module 'quagga' {
  namespace Quagga {
    function init(config: any, callback?: (err: any) => void): void;
    function start(): void;
    function stop(): void;
    function onDetected(callback: (result: any) => void): void;
    function onProcessed(callback: (result: any) => void): void;

    namespace CameraAccess {
      function request(constraints: any): Promise<any>;
    }

    namespace ImageDebug {
      function drawPath(
        path: any[],
        context: { x: number; y: number },
        drawingCtx: CanvasRenderingContext2D,
        style: { color: string; lineWidth: number }
      ): void;
    }

    namespace canvas {
      const ctx: {
        overlay: CanvasRenderingContext2D;
      };
      const dom: {
        overlay: HTMLCanvasElement;
      };
    }
  }

  export default Quagga;
}
