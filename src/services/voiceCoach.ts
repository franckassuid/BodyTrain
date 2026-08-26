// Web Speech API Voice Coach for BodyTrain morning sessions
// Optimized for natural French voices (Male & Female on Apple, Google, Microsoft, Android, iOS)

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
  qualityBadge?: string; // "Naturelle", "Premium HD", "Google HD", "Siri"
  isDefault?: boolean;
}

const STORAGE_KEY = "bodytrain_audio_settings";

const DEFAULT_SETTINGS: AudioSettings = {
  voiceCoachEnabled: true,
  voiceGenderPreference: "auto",
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
    // Update voice if selectedVoiceURI or gender preference changed
    this.applySelectedVoice();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /** Rate French voices by naturalness & user gender preference */
  private scoreVoice(v: SpeechSynthesisVoice): number {
    let score = 0;
    const name = (v.name || "").toLowerCase();
    const lang = (v.lang || "").toLowerCase();
    const gender = detectVoiceGender(v);
    const pref = this.settings.voiceGenderPreference || "auto";

    // Prefer France French, then other French
    if (lang === "fr-fr" || lang === "fr_fr") score += 40;
    else if (lang.startsWith("fr")) score += 25;
    else return -1000; // not French

    // Gender preference matching
    if (pref === "male") {
      if (gender === "male") score += 250;
      else if (gender === "female") score -= 150;
    } else if (pref === "female") {
      if (gender === "female") score += 250;
      else if (gender === "male") score -= 150;
    }

    // Neural / Natural / Premium voices get top priority
    if (name.includes("premium")) score += 100;
    if (name.includes("enhanced") || (v as unknown as { enhanced?: boolean }).enhanced) score += 95;
    if (name.includes("natural") || name.includes("online (natural)")) score += 90;
    if (name.includes("siri")) score += 85;
    if (name.includes("google")) score += 80;

    // Renowned natural voice personas
    if (name.includes("thomas")) score += 40;
    if (name.includes("amélie") || name.includes("amelie")) score += 40;
    if (name.includes("nicolas")) score += 35;
    if (name.includes("audrey")) score += 35;
    if (name.includes("aurélie") || name.includes("aurelie")) score += 30;
    if (name.includes("marie")) score += 30;
    if (name.includes("henri")) score += 30;
    if (name.includes("denise")) score += 30;
    if (name.includes("paulina")) score += 25;

    // Demote robotic compact legacy voices
    if (name.includes("compact")) score -= 60;

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

    // 2. Otherwise pick the highest-scored natural French voice (respecting gender preference)
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
      const gender = detectVoiceGender(v);

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
        gender,
        genderLabel: gender === "male" ? "Voix d'homme" : gender === "female" ? "Voix de femme" : "Voix système",
        qualityBadge: badge,
        isDefault: idx === 0,
      };
    });
  }

  public getCurrentVoiceName(): string {
    return this.voice?.name || "Voix système automatique";
  }

  public getCurrentVoiceGender(): "male" | "female" | "neutral" {
    if (!this.voice) return "neutral";
    return detectVoiceGender(this.voice);
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

      // Custom pitch adaptation based on gender preference
      let pitch = options?.pitch ?? this.settings.speechPitch ?? 1.0;
      if (this.settings.voiceGenderPreference === "male" && pitch === 1.0) {
        pitch = 0.90; // Deeper, warm masculine timbre
      } else if (this.settings.voiceGenderPreference === "female" && pitch === 1.0) {
        pitch = 1.03; // Gentle, clear feminine timbre
      }

      utterance.rate = options?.rate ?? this.settings.speechRate ?? 0.98;
      utterance.pitch = pitch;
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
    const isMale = this.settings.voiceGenderPreference === "male" || this.getCurrentVoiceGender() === "male";
    const text =
      sampleText ||
      (isMale
        ? "Bonjour ! Je serai votre coach pour la séance de ce matin. Respirez profondément et suivez le rythme."
        : "Bonjour ! C'est parti pour votre réveil matinal. Respirez profondément et suivez le rythme.");
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
