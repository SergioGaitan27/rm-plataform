declare module 'quagga' {
  namespace Quagga {
    function init(config: any, callback?: (err: any) => void): void;
    function start(): void;
    function stop(): void;
    function onDetected(callback: (result: any) => void): void;
    function onProcessed(callback: (result: any) => void): void;
    
    const canvas: {
      ctx: {
        overlay: CanvasRenderingContext2D;
      };
      dom: {
        overlay: HTMLCanvasElement;
      };
    };

    namespace ImageDebug {
      function drawPath(path: any, start: any, end: any, options?: any): void;
    }
  }

  export default Quagga;
}