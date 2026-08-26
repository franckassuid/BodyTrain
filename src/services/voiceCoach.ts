// Web Speech API Voice Coach for BodyTrain morning sessions
// Optimized for natural French voices (Apple Premium/Enhanced, Google Natural, Microsoft Natural)

export interface AudioSettings {
  voiceCoachEnabled: boolean; // Master toggle for spoken voice
  announceExerciseNames: boolean; // Speak "Prochain exercice: ..."
  announceCountdown5s: boolean; // Speak "5, 4, 3, 2, 1" on final seconds
  announceGuidance: boolean; // Speak execution/breathing tips
  soundEffectsEnabled: boolean; // Chimes and beep synthesis
  selectedVoiceURI?: string; // Specific chosen voice URI
  speechRate?: number; // Speed rate (0.8 to 1.2, default 0.98 for warmth)
  speechPitch?: number; // Pitch (0.9 to 1.1, default 1.0)
}

export interface AvailableVoice {
  name: string;
  lang: string;
  voiceURI: string;
  qualityBadge?: string; // "Naturelle", "Premium", "HD"
  isDefault?: boolean;
}

const STORAGE_KEY = "bodytrain_audio_settings";

const DEFAULT_SETTINGS: AudioSettings = {
  voiceCoachEnabled: true,
  announceExerciseNames: true,
  announceCountdown5s: true,
  announceGuidance: true,
  soundEffectsEnabled: true,
  speechRate: 0.98,
  speechPitch: 1.0,
};

class VoiceCoachService {
  private settings: AudioSettings = DEFAULT_SETTINGS;
  private voice: SpeechSynthesisVoice | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.loadSettings();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
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
    // Update voice if selectedVoiceURI changed
    this.applySelectedVoice();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /** Rate French voices by naturalness & quality */
  private scoreVoice(v: SpeechSynthesisVoice): number {
    let score = 0;
    const name = (v.name || "").toLowerCase();
    const lang = (v.lang || "").toLowerCase();

    // Prefer France French, then other French
    if (lang === "fr-fr" || lang === "fr_fr") score += 40;
    else if (lang.startsWith("fr")) score += 25;
    else return -1000; // not French

    // Neural / Natural / Premium voices get top priority
    if (name.includes("premium")) score += 100;
    if (name.includes("enhanced") || (v as unknown as { enhanced?: boolean }).enhanced) score += 95;
    if (name.includes("natural") || name.includes("online (natural)")) score += 90;
    if (name.includes("siri")) score += 85;
    if (name.includes("google")) score += 80;

    // Renowned natural voice personas
    if (name.includes("thomas")) score += 30;
    if (name.includes("amélie") || name.includes("amelie")) score += 30;
    if (name.includes("audrey")) score += 25;
    if (name.includes("aurélie") || name.includes("aurelie")) score += 25;
    if (name.includes("marie")) score += 25;
    if (name.includes("denise")) score += 25;
    if (name.includes("henri")) score += 25;
    if (name.includes("paulina")) score += 25;
    if (name.includes("nicolas")) score += 20;

    // Demote robotic compact legacy voices
    if (name.includes("compact")) score -= 50;

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

    // 1. If user explicitly selected a voiceURI, try to match it
    if (this.settings.selectedVoiceURI) {
      const match = this.cachedVoices.find(
        (v) => v.voiceURI === this.settings.selectedVoiceURI || v.name === this.settings.selectedVoiceURI
      );
      if (match) {
        this.voice = match;
        return;
      }
    }

    // 2. Otherwise pick the highest-scored natural French voice
    const sorted = [...this.cachedVoices].sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));
    this.voice = sorted[0] || null;
  }

  /** Returns formatted list of available French voices for UI picker */
  public getAvailableVoices(): AvailableVoice[] {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
    const rawVoices = window.speechSynthesis
      .getVoices()
      .filter((v) => v.lang.toLowerCase().startsWith("fr"));

    const sorted = [...rawVoices].sort((a, b) => this.scoreVoice(b) - this.scoreVoice(a));

    return sorted.map((v, idx) => {
      let badge: string | undefined;
      const lower = v.name.toLowerCase();
      if (lower.includes("premium") || lower.includes("enhanced") || (v as unknown as { enhanced?: boolean }).enhanced) {
        badge = "Premium HD";
      } else if (lower.includes("natural")) {
        badge = "Naturelle";
      } else if (lower.includes("siri")) {
        badge = "Siri";
      } else if (lower.includes("google")) {
        badge = "Google HD";
      }

      return {
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
        qualityBadge: badge,
        isDefault: idx === 0,
      };
    });
  }

  public getCurrentVoiceName(): string {
    return this.voice?.name || "Voix système automatique";
  }

  private speak(text: string, options?: { rate?: number; pitch?: number; priority?: boolean }) {
    if (!this.settings.voiceCoachEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      if (options?.priority || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      // Add gentle punctuation phrasing for more natural rhythm
      const naturalText = text.trim();
      const utterance = new SpeechSynthesisUtterance(naturalText);
      utterance.lang = "fr-FR";

      if (!this.voice) {
        this.applySelectedVoice();
      }
      if (this.voice) {
        utterance.voice = this.voice;
      }

      // 0.96 - 1.02 provides a warm, natural human cadence (not robotic rush)
      utterance.rate = options?.rate ?? this.settings.speechRate ?? 0.98;
      utterance.pitch = options?.pitch ?? this.settings.speechPitch ?? 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio fallback
    }
  }

  /** Announce exercise during preparation */
  public announcePreparation(exerciseName: string) {
    if (!this.settings.voiceCoachEnabled || !this.settings.announceExerciseNames) return;
    this.speak(`Préparez-vous : ${exerciseName}`, { priority: true });
  }

  /** Announce start of exercise work phase and optional guidance */
  public announceExerciseStart(exerciseName: string, guidance?: string) {
    if (!this.settings.voiceCoachEnabled) return;

    if (this.settings.announceGuidance && guidance) {
      const cleanGuidance = guidance.split(".")[0].trim();
      if (cleanGuidance.length > 0 && cleanGuidance.length < 80) {
        this.speak(`C'est parti pour ${exerciseName}. ${cleanGuidance}`, { priority: true });
        return;
      }
    }

    if (this.settings.announceExerciseNames) {
      this.speak(`C'est parti pour ${exerciseName} !`, { priority: true });
    }
  }

  /** Announce countdown for last 5 seconds (5, 4, 3, 2, 1) */
  public announceCountdown(second: number) {
    if (!this.settings.voiceCoachEnabled || !this.settings.announceCountdown5s) return;
    if (second >= 1 && second <= 5) {
      this.speak(String(second), { rate: 1.15, priority: true });
    }
  }

  /** Announce rest period and next exercise */
  public announceRest(nextExerciseName?: string) {
    if (!this.settings.voiceCoachEnabled) return;
    if (nextExerciseName && this.settings.announceExerciseNames) {
      this.speak(`Repos. À suivre : ${nextExerciseName}`, { priority: true });
    } else {
      this.speak(`Repos, respirez calmement.`, { priority: true });
    }
  }

  /** Announce completion of the full session */
  public announceCompletion() {
    if (!this.settings.voiceCoachEnabled) return;
    this.speak(`Séance terminée ! Bravo pour votre réveil matinal !`, { priority: true });
  }

  /** Test current voice with a sample sentence */
  public testVoice(sampleText?: string) {
    const text =
      sampleText ||
      "Bonjour ! C'est parti pour votre réveil matinal. Respirez profondément et suivez le rythme.";
    this.speak(text, { priority: true });
  }

  /** Stop all speech immediately */
  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceCoach = new VoiceCoachService();
