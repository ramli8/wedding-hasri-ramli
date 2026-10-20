export type FeedbackKind = "ok" | "already" | "invalid";

// Pola getar dan nada dibedakan agar penjaga bisa tahu hasilnya tanpa melihat layar.
const VIBRATION: Record<FeedbackKind, number[]> = {
  ok: [60],
  already: [80, 60, 80],
  invalid: [300],
};
const TONE: Record<FeedbackKind, { hz: number; ms: number }[]> = {
  ok: [{ hz: 880, ms: 110 }],
  already: [
    { hz: 660, ms: 90 },
    { hz: 660, ms: 90 },
  ],
  invalid: [{ hz: 220, ms: 350 }],
};

let audio: AudioContext | undefined;

function beep(tones: { hz: number; ms: number }[]) {
  try {
    audio ??= new AudioContext();
    let start = audio.currentTime;
    for (const tone of tones) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = tone.hz;
      gain.gain.value = 0.15;
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
