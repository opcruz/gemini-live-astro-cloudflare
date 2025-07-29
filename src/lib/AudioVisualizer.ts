export class AudioVisualizer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private analyser: AnalyserNode | undefined;
  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d')!;
    }
  
    setup(outputNode: GainNode, audioCtx: AudioContext) {
      this.analyser = audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      outputNode.connect(this.analyser);
      outputNode.connect(audioCtx.destination);
  
      window.addEventListener('resize', () => this.resizeCanvas());
      this.resizeCanvas();
      this.animate();
    }
  
    private resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  
    private animate() {
      requestAnimationFrame(() => this.animate());
      const bufferLength = this.analyser!.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser!.getByteFrequencyData(dataArray);
  
      this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
      const barWidth = (this.canvas.width / bufferLength) * 2.5;
      let x = 0;
  
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = ((dataArray[i] / 255) * this.canvas.height) / 2;
        const hue = (i / bufferLength) * 360;
        this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        this.ctx.fillRect(x, this.canvas.height / 2 - barHeight / 2, barWidth, barHeight);
        x += barWidth + 1;
      }
    }
  }
  