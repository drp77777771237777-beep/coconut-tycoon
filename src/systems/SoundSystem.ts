import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';

type Note = [freq: number, delay: number, dur: number, type?: OscillatorType];

const SOUNDS: Record<string, Note[]> = {
  harvest: [[320, 0, 0.08, 'triangle'], [220, 0.06, 0.1, 'triangle']],
  coin: [[880, 0, 0.06, 'square'], [1320, 0.05, 0.08, 'square']],
  sell: [[660, 0, 0.05, 'square']],
  upgrade: [[523, 0, 0.1], [659, 0.09, 0.1], [784, 0.18, 0.16]],
  worker: [[392, 0, 0.1], [494, 0.1, 0.1], [587, 0.2, 0.2]],
  complete: [[523, 0, 0.15], [659, 0.15, 0.15], [784, 0.3, 0.15], [1047, 0.45, 0.35]],
  click: [[500, 0, 0.04, 'square']],
  boat: [[196, 0, 0.3, 'sawtooth'], [262, 0.25, 0.4, 'sawtooth']],
  error: [[160, 0, 0.15, 'square']],
};

let ctx: AudioContext | null = null;
let started = false;

function context(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

export const SoundSystem = {
  play(name: string): void {
    if (!gameState.data.settings.sound) return;
    const notes = SOUNDS[name];
    const ac = context();
    if (!notes || !ac) return;
    if (ac.state === 'suspended') void ac.resume();
    const now = ac.currentTime;
    for (const [freq, delay, dur, type] of notes) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type ?? 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.12, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    }
  },

  start(): void {
    if (started) return;
    started = true;
    eventBus.on(EVT.SOUND, (name: string) => SoundSystem.play(name));
  },
};
