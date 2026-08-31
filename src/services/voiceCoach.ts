// Hybrid Neural Audio & Voice Coach for BodyTrain
// Tier 1: Instant Studio Pre-rendered Neural Cues (0ms latency, 100% offline)
// Tier 2: Free Microsoft Neural Edge TTS (/api/tts - Henri / Denise Studio HD)
// Tier 3: Browser SpeechSynthesis Fallback (offline system voice)

export type VoiceGenderPreference = "auto" | "male" | "female";

export interface AudioSettings {
  voiceCoachEnabled: boolean; // Master toggle for spoken voice
  voiceGenderPreference?: VoiceGenderPreference; // "auto", "male", "female"
  announceExerciseNames: boolean; // Speak "Prochain exercice: ..."
  announceCountdown5s: boolean; // Speak "5, 4, 3, 2, 1" on final seconds
  announceGuidance: boolean; // Speak execution/breathing tips
  soundEffectsEnabled: boolean; // Chimes and beep synthesis
  selectedVoiceURI?: string; // Specific chosen voice URI
  speechRate?: number; // Speed rate (0.8 to 1.2, default 0.98 for warmth)
  speechPitch?: number; // Pitch (0.85 to 1.15, default 1.0)
}

export interface AvailableVoice {
  name: string;
  lang: string;
  voiceURI: string;
  gender: "male" | "female" | "neutral";
  genderLabel: string;
  qualityBadge?: string; // "Studio Neural", "Naturelle", "Premium HD", "Google HD", "Siri"
  isDefault?: boolean;
}

const STORAGE_KEY = "bodytrain_audio_settings";

const DEFAULT_SETTINGS: AudioSettings = {
  voiceCoachEnabled: true,
  voiceGenderPreference: "male", // default to warm Henri studio male voice
  announceExerciseNames: true,
  announceCountdown5s: true,
  announceGuidance: true,
  soundEffectsEnabled: true,
  speechRate: 0.98,
  speechPitch: 1.0,
};

export function detectVoiceGender(v: SpeechSynthesisVoice): "male" | "female" | "neutral" {
  const name = (v.name || "").toLowerCase();
  const uri = (v.voiceURI || "").toLowerCase();

  // Explicit male indicators across Apple, Google, Microsoft & Android
  if (
    name.includes("thomas") ||
    name.includes("nicolas") ||
    name.includes("henri") ||
    name.includes("claude") ||
    name.includes("jerome") ||
    name.includes("jérôme") ||
    name.includes("paul") ||
    name.includes("alain") ||
    name.includes("homme") ||
    name.includes("male") ||
    name.includes("voix 1") ||
    uri.includes("fr-fr-x-fra") ||
    uri.includes("fr-fr-x-frd") ||
    uri.includes("fr-ca-x-cab") ||
    uri.includes("fr-ca-x-cad") ||
    uri.includes("standard-b") ||
    uri.includes("standard-d") ||
    uri.includes("neural2-b") ||
    uri.includes("neural2-d") ||
    uri.includes("wavenet-b") ||
    uri.includes("wavenet-d")
  ) {
    return "male";
  }

  // Explicit female indicators across Apple, Google, Microsoft & Android
  if (
    name.includes("amélie") ||
    name.includes("amelie") ||
    name.includes("audrey") ||
    name.includes("aurélie") ||
    name.includes("aurelie") ||
    name.includes("marie") ||
    name.includes("denise") ||
    name.includes("paulina") ||
    name.includes("brigitte") ||
    name.includes("celeste") ||
    name.includes("femme") ||
    name.includes("female") ||
    name.includes("voix 2") ||
    uri.includes("fr-fr-x-frc") ||
    uri.includes("fr-fr-x-frb") ||
    uri.includes("fr-ca-x-caa") ||
    uri.includes("fr-ca-x-cac") ||
    uri.includes("standard-a") ||
    uri.includes("standard-c") ||
    uri.includes("neural2-a") ||
    uri.includes("neural2-c") ||
    uri.includes("wavenet-a") ||
    uri.includes("wavenet-c")
  ) {
    return "female";
  }

  return "neutral";
}

class VoiceCoachService {
  private settings: AudioSettings = DEFAULT_SETTINGS;
  private voice: SpeechSynthesisVoice | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  private activeRequestId: number = 0;

  constructor() {
    this.loadSettings();
    if (typeof window !== "undefined") {
      if ("speechSynthesis" in window) {
        this.initVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
      this.preloadCues();
    }
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = DEFAULT_SETTINGS;
    }
  }

  public saveSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // ignore localStorage errors
    }
    this.applySelectedVoice();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private getGenderDir(): "male" | "female" {
    return this.settings.voiceGenderPreference === "female" ? "female" : "male";
  }

  private getNeuralVoiceName(): string {
    return this.settings.voiceGenderPreference === "female"
      ? "fr-FR-DeniseNeural"
      : "fr-FR-HenriNeural";
  }

  /** Preload essential studio audio cues into browser cache */
  private preloadCues() {
    if (typeof window === "undefined" || typeof Audio === "undefined") return;
    const gender = this.getGenderDir();
    const cueNames = [
      "countdown_5",
      "countdown_4",
      "countdown_3",
      "countdown_2",
      "countdown_1",
      "start",
      "prep",
      "rest",
      "halfway",
      "complete",
    ];

    cueNames.forEach((name) => {
      try {
        const audio = new Audio();
        audio.src = `/audio/cues/${gender}/${name}.mp3`;
        audio.preload = "auto";
      } catch {
        // ignore in tests
      }
    });
  }

  /** Play pre-rendered studio cue with 0ms latency and strict single-audio exclusivity */
  private playStudioCue(cueId: string): Promise<boolean> {
    if (!this.settings.voiceCoachEnabled) return Promise.resolve(false);
    if (typeof window === "undefined" || typeof Audio === "undefined") return Promise.resolve(false);

    this.stop();
    const reqId = ++this.activeRequestId;

    const gender = this.getGenderDir();
    const src = `/audio/cues/${gender}/${cueId}.mp3`;

    return new Promise((resolve) => {
      try {
        const audio = new Audio(src);
        this.currentAudio = audio;
        audio.volume = 1.0;

        audio.onended = () => {
          if (this.currentAudio === audio) this.currentAudio = null;
          resolve(true);
        };

        audio.onerror = () => {
          if (this.currentAudio === audio) this.currentAudio = null;
          resolve(false);
        };

        audio
          .play()
          .then(() => {
            if (this.activeRequestId !== reqId) {
              audio.pause();
              resolve(false);
            }
          })
          .catch(() => resolve(false));
      } catch {
        resolve(false);
      }
    });
  }

  /** Stream or fetch studio Neural voice from Edge TTS backend */
  private playNeuralTts(text: string, reqId: number): Promise<boolean> {
    if (!this.settings.voiceCoachEnabled) return Promise.resolve(false);
    if (typeof window === "undefined" || typeof Audio === "undefined") return Promise.resolve(false);
    if (typeof navigator !== "undefined" && !navigator.onLine) return Promise.resolve(false);

    const voice = this.getNeuralVoiceName();
    const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`;

    return new Promise((resolve) => {
      try {
        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.volume = 1.0;

        audio.onended = () => {
          if (this.currentAudio === audio) this.currentAudio = null;
          resolve(true);
        };

        audio.onerror = () => {
          if (this.currentAudio === audio) this.currentAudio = null;
          resolve(false);
        };

        audio
          .play()
          .then(() => {
            if (this.activeRequestId !== reqId) {
              audio.pause();
              resolve(false);
            } else {
              // Successfully started playing neural audio
              resolve(true);
            }
          })
          .catch(() => resolve(false));
      } catch {
        resolve(false);
      }
    });
  }

  /** Synthesize voice using Neural TTS with strict fallback guard (never simultaneous) */
  private async speak(text: string, options?: { rate?: number; pitch?: number; priority?: boolean }) {
    if (!this.settings.voiceCoachEnabled) return;

    this.stop();
    const reqId = ++this.activeRequestId;

    // 1. Try Neural Studio TTS first
    const played = await this.playNeuralTts(text, reqId);
    if (played || this.activeRequestId !== reqId) {
      return; // Neural audio is playing or was cancelled by a newer command -> DO NOT trigger SpeechSynthesis!
    }

    // 2. Fallback to browser SpeechSynthesis ONLY if Neural TTS completely failed AND request is still active
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (this.activeRequestId !== reqId) return;

    try {
      window.speechSynthesis.cancel();

      const naturalText = text.trim();
      const utterance = new SpeechSynthesisUtterance(naturalText);
      utterance.lang = "fr-FR";

      if (!this.voice) this.applySelectedVoice();
      if (this.voice) utterance.voice = this.voice;

      let pitch = options?.pitch ?? this.settings.speechPitch ?? 1.0;
      if (this.settings.voiceGenderPreference === "male" && pitch === 1.0) {
        pitch = 0.90;
      } else if (this.settings.voiceGenderPreference === "female" && pitch === 1.0) {
        pitch = 1.03;
      }

      utterance.rate = options?.rate ?? this.settings.speechRate ?? 0.98;
      utterance.pitch = pitch;
      utterance.volume = 1.0;

      if (this.activeRequestId === reqId) {
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // ignore
    }
  }

  private scoreVoice(v: SpeechSynthesisVoice): number {
    let score = 0;
    const name = (v.name || "").toLowerCase();
    const lang = (v.lang || "").toLowerCase();
    const gender = detectVoiceGender(v);
    const pref = this.settings.voiceGenderPreference || "auto";

    if (lang === "fr-fr" || lang === "fr_fr") score += 40;
    else if (lang.startsWith("fr")) score += 25;
    else return -1000;

    if (pref === "male") {
      if (gender === "male") score += 250;
      else if (gender === "female") score -= 150;
    } else if (pref === "female") {
      if (gender === "female") score += 250;
      else if (gender === "male") score -= 150;
    }

    if (name.includes("premium")) score += 100;
    if (name.includes("enhanced") || (v as unknown as { enhanced?: boolean }).enhanced) score += 95;
    if (name.includes("natural") || name.includes("online (natural)")) score += 90;
    if (name.includes("siri")) score += 85;
    if (name.includes("google")) score += 80;

    if (name.includes("thomas")) score += 40;
    if (name.includes("amélie") || name.includes("amelie")) score += 40;
    if (name.includes("nicolas")) score += 35;
    if (name.includes("audrey")) score += 35;
    if (name.includes("henri")) score += 30;

    return score;
  }

  private initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    this.cachedVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("fr"));
    this.applySelectedVoice();
  }

  private applySelectedVoice() {
    if (this.cachedVoices.length === 0) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        this.cachedVoices = window.speechSynthesis
          .getVoices()
          .filter((v) => v.lang.toLowerCase().startsWith("fr"));
      }
    }
    if (this.cachedVoices.length === 0) return;

    if (this.settings.selectedVoiceURI) {
      const match = this.cachedVoices.find(
        (v) => v.voiceURI === this.settings.selectedVoiceURI || v.name === this.settings.selectedVoiceURI
      );
      if (match) {
        this.voice = match;
        return;
      }
    }

    const sorted = [...this.cachedVoices].sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));
    this.voice = sorted[0] || null;
  }

  public getAvailableVoices(): AvailableVoice[] {
    const list: AvailableVoice[] = [
      {
        name: "Henri (Studio Neural HD)",
        lang: "fr-FR",
        voiceURI: "neural-henri",
        gender: "male",
        genderLabel: "Voix d'homme Studio",
        qualityBadge: "Studio Neural",
        isDefault: this.settings.voiceGenderPreference !== "female",
      },
      {
        name: "Denise (Studio Neural HD)",
        lang: "fr-FR",
        voiceURI: "neural-denise",
        gender: "female",
        genderLabel: "Voix de femme Studio",
        qualityBadge: "Studio Neural",
        isDefault: this.settings.voiceGenderPreference === "female",
      },
    ];

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const rawVoices = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang.toLowerCase().startsWith("fr"));

      const sorted = [...rawVoices].sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));

      sorted.forEach((v) => {
        const gender = detectVoiceGender(v);
        list.push({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
          gender,
          genderLabel: gender === "male" ? "Voix d'homme système" : gender === "female" ? "Voix de femme système" : "Système",
          qualityBadge: "Système",
        });
      });
    }

    return list;
  }

  public getCurrentVoiceName(): string {
    if (this.settings.voiceGenderPreference === "female") {
      return "Denise (Studio Neural HD)";
    }
    return "Henri (Studio Neural HD)";
  }

  /** Announce exercise during preparation */
  public async announcePreparation(exerciseName: string) {
    if (!this.settings.voiceCoachEnabled || !this.settings.announceExerciseNames) return;
    this.speak(`Préparez-vous pour ${exerciseName}`, { priority: true });
  }

  /** Announce start of exercise work phase and optional guidance */
  public async announceExerciseStart(exerciseName: string, guidance?: string) {
    if (!this.settings.voiceCoachEnabled) return;

    if (this.settings.announceGuidance && guidance) {
      const cleanGuidance = guidance.split(".")[0].trim();
      if (cleanGuidance.length > 0 && cleanGuidance.length < 90) {
        this.speak(`C'est parti pour ${exerciseName}. ${cleanGuidance}`, { priority: true });
        return;
      }
    }

    if (this.settings.announceExerciseNames) {
      this.speak(`C'est parti pour ${exerciseName} !`, { priority: true });
    }
  }

  /** Announce countdown for last 5 seconds (5, 4, 3, 2, 1) using studio audio cue */
  public async announceCountdown(second: number) {
    if (!this.settings.voiceCoachEnabled || !this.settings.announceCountdown5s) return;
    if (second >= 1 && second <= 5) {
      const ok = await this.playStudioCue(`countdown_${second}`);
      if (!ok) {
        this.speak(String(second), { rate: 1.15, priority: true });
      }
    }
  }

  /** Announce halfway side switch for unilateral exercises */
  public async announceHalfwaySwitch() {
    if (!this.settings.voiceCoachEnabled) return;
    this.speak("Changez de côté !", { priority: true });
  }

  /** Announce rest period and next exercise + position transition cue */
  public async announceRest(nextExerciseName?: string, positionPrompt?: string) {
    if (!this.settings.voiceCoachEnabled) return;
    if (nextExerciseName && this.settings.announceExerciseNames) {
      const cue = positionPrompt
        ? `Repos. Prochain mouvement : ${nextExerciseName}. ${positionPrompt}`
        : `Repos. Prochain mouvement : ${nextExerciseName}`;
      this.speak(cue, { priority: true });
    } else {
      const ok = await this.playStudioCue("rest");
      if (!ok) {
        this.speak(`Repos, respirez calmement.`, { priority: true });
      }
    }
  }

  /** Announce completion of the full session using studio fanfare & voice */
  public async announceCompletion() {
    if (!this.settings.voiceCoachEnabled) return;
    const ok = await this.playStudioCue("complete");
    if (!ok) {
      this.speak(`Séance terminée ! Félicitations pour votre réveil en mouvement !`, { priority: true });
    }
  }

  /** Test current voice with a sample sentence */
  public testVoice(sampleText?: string) {
    const isMale = this.settings.voiceGenderPreference === "male" || this.getGenderDir() === "male";
    const text =
      sampleText ||
      (isMale
        ? "Bonjour ! Je serai votre coach pour la séance de ce matin. Respirez profondément et suivez le rythme."
        : "Bonjour ! C'est parti pour votre réveil matinal. Respirez profondément et suivez le rythme.");
    this.speak(text, { priority: true });
  }

  /** Stop all speech immediately */
  public stop() {
    this.activeRequestId++;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = "";
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }
}

export const voiceCoach = new VoiceCoachService();
