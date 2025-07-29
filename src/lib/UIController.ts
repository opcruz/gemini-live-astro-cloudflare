export class UIController {
    private statusEl: HTMLElement;
    private startBtn: HTMLButtonElement;
    private stopBtn: HTMLButtonElement;
    private resetBtn: HTMLButtonElement;
  
    constructor(el: {
      status: HTMLElement;
      start: HTMLButtonElement;
      stop: HTMLButtonElement;
      reset: HTMLButtonElement;
    }) {
      this.statusEl = el.status;
      this.startBtn = el.start;
      this.stopBtn = el.stop;
      this.resetBtn = el.reset;
    }
  
    bindHandlers(callbacks: {
      onStart: () => void;
      onStop: () => void;
      onReset: () => void;
    }) {
      this.startBtn.addEventListener('click', callbacks.onStart);
      this.stopBtn.addEventListener('click', callbacks.onStop);
      this.resetBtn.addEventListener('click', callbacks.onReset);
    }
  
    setRecordingState(isRecording: boolean) {
      this.startBtn.disabled = isRecording;
      this.stopBtn.disabled = !isRecording;
      this.resetBtn.disabled = !isRecording;
    }
  
    updateStatus(msg: string) {
      this.statusEl.textContent = msg;
    }
  }
  