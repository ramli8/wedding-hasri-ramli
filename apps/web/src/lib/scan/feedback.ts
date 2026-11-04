export type FeedbackKind = "ok" | "vip" | "already" | "invalid";

// Pola getar dan nada dibedakan agar penjaga bisa tahu hasilnya tanpa melihat layar.
// VIP: tiga nada naik (do-mi-sol) seperti lonceng, jelas berbeda dari satu "bip" tamu biasa.
type Tone = { hz: number; ms: number; type?: OscillatorType; fade?: boolean };

const VIBRATION: Record<FeedbackKind, number[]> = {
  ok: [60],
  vip: [60, 60, 60, 60, 180],
  already: [80, 60, 80],
  invalid: [300],
};
const TONE: Record<FeedbackKind, Tone[]> = {
  ok: [{ hz: 880, ms: 110 }],
  vip: [
    { hz: 1047, ms: 110, type: "triangle", fade: true },
    { hz: 1319, ms: 110, type: "triangle", fade: true },
    { hz: 1568, ms: 320, type: "triangle", fade: true },
  ],
  already: [
    { hz: 660, ms: 90 },
    { hz: 660, ms: 90 },
  ],
  invalid: [{ hz: 220, ms: 350 }],
};

let audio: AudioContext | undefined;

function beep(tones: Tone[]) {
  try {
    audio ??= new AudioContext();
    let start = audio.currentTime;
    for (const tone of tones) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = tone.hz;
      if (tone.type) oscillator.type = tone.type;
      if (tone.fade) {
        // Meredup di ujung nada supaya berbunyi seperti lonceng, bukan bip yang terpotong.
        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + tone.ms / 1000);
      } else {
        gain.gain.value = 0.15;
      }
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + tone.ms / 1000);
      start += tone.ms / 1000 + 0.05;
    }
  } catch {
    /* suara tidak tersedia; getar dan warna layar tetap bekerja */
  }
}

export function feedback(kind: FeedbackKind, sound: boolean) {
  navigator.vibrate?.(VIBRATION[kind]);
  if (sound) beep(TONE[kind]);
}
