import React, { useState, useEffect } from "react";
import { Activity, Wind, Sparkles, Image as ImageIcon, Play, Pause } from "lucide-react";
import type { Exercise } from "../types/exercise.ts";

interface ExerciseAnimationProps {
  exercise: Exercise;
  nextExercise?: Exercise | null;
  phase: "preparation" | "work" | "rest" | "finished";
}

export const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({
  exercise,
  nextExercise,
  phase,
}) => {
  const slug = exercise.slug || exercise.id;

  // Check available media
  const hasAnimationMedia = exercise.media?.some((m) => m.type === "animation");
  const hasStartPhoto = exercise.media?.some((m) => m.type === "start_position");
  const hasEndPhoto = exercise.media?.some((m) => m.type === "end_position");
  const hasPhotos = hasStartPhoto || hasEndPhoto;

  // View mode: 'photos' | 'svg' | 'breathing'
  const [viewMode, setViewMode] = useState<"photos" | "svg">(() => {
    if (hasPhotos) return "photos";
    return "svg";
  });

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState<boolean>(false);
  const [activePhotoStep, setActivePhotoStep] = useState<"start" | "end">("start");
  const [isPhotoLooping, setIsPhotoLooping] = useState<boolean>(true);
  const [photoError, setPhotoError] = useState<boolean>(false);

  // Sync default view mode when exercise changes
  useEffect(() => {
    setPhotoError(false);
    setActivePhotoStep("start");
    if (hasPhotos) {
      setViewMode("photos");
    } else {
      setViewMode("svg");
    }
  }, [exercise.id, hasPhotos]);

  // Preload next exercise assets
  useEffect(() => {
    if (nextExercise) {
      const nextSlug = nextExercise.slug || nextExercise.id;
      // Preload next SVG
      const imgSvg = new Image();
      imgSvg.src = `/animations/${nextSlug}.svg`;
      // Preload next Photos
      const imgPhoto1 = new Image();
      imgPhoto1.src = `/exercises/${nextSlug}/start.webp`;
      const imgPhoto2 = new Image();
      imgPhoto2.src = `/exercises/${nextSlug}/end.webp`;
    }
  }, [nextExercise]);

  // Fetch SVG animation when in SVG mode
  useEffect(() => {
    let isCancelled = false;
    setLoadingSvg(true);

    const svgPath = `/animations/${slug}.svg`;
    fetch(svgPath)
      .then((res) => {
        if (!res.ok) throw new Error("SVG not found");
        return res.text();
      })
      .then((svgText) => {
        if (!isCancelled) {
          if (svgText.includes("<svg") && svgText.includes("</svg>")) {
            setSvgContent(svgText);
          } else {
            setSvgContent(null);
          }
          setLoadingSvg(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSvgContent(null);
          setLoadingSvg(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  // Photo alternating animation loop (e.g. 1.8s per posture)
  useEffect(() => {
    if (viewMode !== "photos" || !hasPhotos || !isPhotoLooping || !hasEndPhoto) return;

    const interval = setInterval(() => {
      setActivePhotoStep((prev) => (prev === "start" ? "end" : "start"));
    }, 1700);

    return () => clearInterval(interval);
  }, [viewMode, hasPhotos, isPhotoLooping, hasEndPhoto, slug]);

  const isBreathing = exercise.category === "breathing" || exercise.mode === "breathing";
  const startPhotoUrl = `/exercises/${slug}/start.webp`;
  const endPhotoUrl = hasEndPhoto ? `/exercises/${slug}/end.webp` : startPhotoUrl;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Visual Frame Container */}
      <div
        style={{
          width: "100%",
          height: 250,
          backgroundColor: "var(--bg-surface-elevated)",
          borderRadius: "var(--radius-xl)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
          position: "relative",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* MODE 1: High Quality Photo Demonstration with Live Loop */}
        {viewMode === "photos" && hasPhotos && !photoError ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#18181B",
            }}
          >
            {/* Start Photo */}
            <img
              src={startPhotoUrl}
              alt={`${exercise.nameFr || exercise.name} - Départ`}
              onError={() => setPhotoError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                position: "absolute",
                top: 0,
                left: 0,
                opacity: activePhotoStep === "start" ? 1 : 0,
                transition: "opacity 0.4s ease-in-out, transform 0.4s ease-in-out",
                transform: activePhotoStep === "start" ? "scale(1)" : "scale(0.98)",
              }}
            />

            {/* End Photo */}
            {hasEndPhoto && (
              <img
                src={endPhotoUrl}
                alt={`${exercise.nameFr || exercise.name} - Fin`}
                onError={() => setPhotoError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: activePhotoStep === "end" ? 1 : 0,
                  transition: "opacity 0.4s ease-in-out, transform 0.4s ease-in-out",
                  transform: activePhotoStep === "end" ? "scale(1)" : "scale(0.98)",
                }}
              />
            )}

            {/* Step Badge Overlay */}
            {hasEndPhoto && (
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(0, 0, 0, 0.65)",
                  backdropFilter: "blur(6px)",
                  color: "#FFFFFF",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: activePhotoStep === "start" ? "var(--color-primary)" : "#38BDF8",
                    display: "inline-block",
                  }}
                />
                <span>{activePhotoStep === "start" ? "1. Position de départ" : "2. Position d'arrivée"}</span>
              </div>
            )}

            {/* Manual Toggle Play/Pause Loop */}
            {hasEndPhoto && (
              <button
                type="button"
                onClick={() => setIsPhotoLooping(!isPhotoLooping)}
                aria-label={isPhotoLooping ? "Mettre en pause l'animation photo" : "Lancer l'animation photo"}
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.65)",
                  backdropFilter: "blur(6px)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isPhotoLooping ? <Pause size={14} /> : <Play size={14} />}
              </button>
            )}
          </div>
        ) : viewMode === "svg" && svgContent && !loadingSvg ? (
          /* MODE 2: SVG Animation */
          <div
            className="animation-container"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          /* MODE 3: Calm Breathing & Mobility Fallback */
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              className="pulse-ring"
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                backgroundColor: isBreathing ? "var(--color-primary-soft)" : "var(--bg-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)",
                border: "2px solid var(--color-primary-light)",
              }}
            >
              {isBreathing ? <Wind size={40} /> : <Activity size={40} />}
            </div>

            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "var(--text-subtle)",
                textAlign: "center",
                padding: "0 16px",
              }}
            >
              {isBreathing
                ? "Respiration guidée • Inspire et expire profondément"
                : phase === "rest"
                ? "Prends une profonde inspiration et relâche"
                : "Maintiens un mouvement continu et maîtrisé"}
            </div>
          </div>
        )}
      </div>

      {/* Media Type Switcher (when both Photos & SVG or Multiple views available) */}
      {hasPhotos && (hasAnimationMedia || svgContent) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "var(--bg-surface)",
              padding: 3,
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("photos")}
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.78rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5,
                backgroundColor: viewMode === "photos" ? "var(--color-primary)" : "transparent",
                color: viewMode === "photos" ? "#FFFFFF" : "var(--text-muted)",
                transition: "all 0.2s ease",
              }}
            >
              <ImageIcon size={13} />
              <span>Photos ({hasEndPhoto ? "Animées" : "1 pose"})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("svg")}
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.78rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5,
                backgroundColor: viewMode === "svg" ? "var(--color-primary)" : "transparent",
                color: viewMode === "svg" ? "#FFFFFF" : "var(--text-muted)",
                transition: "all 0.2s ease",
              }}
            >
              <Sparkles size={13} />
              <span>Schéma filaire</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
