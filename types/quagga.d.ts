declare module 'quagga' {
    namespace Quagga {
      function init(config: any, callback?: (err: any) => void): void;
      function start(): void;
      function stop(): void;
      function onDetected(callback: (result: any) => void): void;
    }
  
    export default Quagga;
  }