
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const sounds = {
  playCard: () => {
    playTone(600, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(400, 'sine', 0.05, 0.05), 50);
  },
  winRound: () => {
    playTone(880, 'sine', 0.3, 0.1);
    setTimeout(() => playTone(1108.73, 'sine', 0.3, 0.1), 100);
  },
  war: () => {
    playTone(220, 'sawtooth', 0.5, 0.1);
    playTone(225, 'sawtooth', 0.5, 0.1);
  },
  lose: () => {
    playTone(200, 'square', 0.4, 0.05);
    setTimeout(() => playTone(150, 'square', 0.4, 0.05), 150);
  },
  gameOver: () => {
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.6, 0.1), i * 150);
    });
  }
};
