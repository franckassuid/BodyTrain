import React, { useState, useEffect } from "react";
import { Activity, Wind, Sparkles, Image as ImageIcon } from "lucide-react";
import type { Exercise } from "../types/exercise.ts";

interface ExerciseAnimationProps {
  exercise: Exercise;
  nextExercise?: Exercise | null;
  phase: "preparation" | "work" | "rest" | "finished";
  circularMode?: boolean;
}

export const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({
  exercise,
  nextExercise,
  phase,
  circularMode = false,
}) => {
  const slug = exercise.slug || exercise.id;

  // Check available media
  const hasAnimationMedia = exercise.media?.some((m) => m.type === "animation");
  const hasStartPhoto = exercise.media?.some((m) => m.type === "start_position");
  const hasEndPhoto = exercise.media?.some((m) => m.type === "end_position");
  const hasPhotos = hasStartPhoto || hasEndPhoto;

  // View mode: 'photos' | 'svg'
  const [viewMode, setViewMode] = useState<"photos" | "svg">(() => {
    if (hasPhotos) return "photos";
    return "svg";
  });

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState<boolean>(false);
  const [activePhotoStep, setActivePhotoStep] = useState<"start" | "end">("start");
  const [photoError, setPhotoError] = useState<boolean>(false);
  const [gifError, setGifError] = useState<boolean>(false);

  const gifUrl = `/animations/${slug}.gif`;

  // Sync default view mode when exercise changes
  useEffect(() => {
    setPhotoError(false);
    setGifError(false);
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
      const imgGif = new Image();
      imgGif.src = `/animations/${nextSlug}.gif`;
      const imgSvg = new Image();
      imgSvg.src = `/animations/${nextSlug}.svg`;
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
            let cleanSvg = svgText;
            if (!cleanSvg.includes("preserveAspectRatio")) {
              cleanSvg = cleanSvg.replace("<svg", '<svg preserveAspectRatio="xMidYMid meet"');
            }
            setSvgContent(cleanSvg);
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

  // Alternating photo postures loop (1.7s per posture)
  useEffect(() => {
    if (viewMode !== "photos" || !hasPhotos || !hasEndPhoto) return;

    const interval = setInterval(() => {
      setActivePhotoStep((prev) => (prev === "start" ? "end" : "start"));
    }, 1700);

    return () => clearInterval(interval);
  }, [viewMode, hasPhotos, hasEndPhoto, slug]);

  const isBreathing = exercise.category === "breathing" || exercise.mode === "breathing";
  const startPhotoUrl = `/exercises/${slug}/start.webp`;
  const endPhotoUrl = hasEndPhoto ? `/exercises/${slug}/end.webp` : startPhotoUrl;

  const frameWidth = circularMode ? 224 : "100%";
  const frameHeight = circularMode ? 224 : 250;
  const frameRadius = circularMode ? "50%" : "var(--radius-xl)";

  return (
    <div
      style={{
        width: circularMode ? "auto" : "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* Visual Frame Container */}
      <div
        style={{
          width: frameWidth,
          height: frameHeight,
          background: "linear-gradient(145deg, var(--bg-surface-elevated), var(--bg-surface))",
          borderRadius: frameRadius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          border: circularMode ? "none" : "1.5px solid var(--border-subtle)",
          position: "relative",
          boxShadow: circularMode ? "inset 0 2px 10px rgba(0,0,0,0.04)" : "0 6px 20px rgba(0,0,0,0.06)",
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
              backgroundColor: "rgba(0, 0, 0, 0.02)",
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

            {/* Posture Step Tag */}
            {hasEndPhoto && (
              <div
                style={{
                  position: "absolute",
                  bottom: circularMode ? 14 : 10,
                  left: circularMode ? "50%" : 12,
                  transform: circularMode ? "translateX(-50%)" : "none",
                  backgroundColor: "rgba(20, 36, 27, 0.75)",
                  backdropFilter: "blur(6px)",
                  color: "#FFFFFF",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  zIndex: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: activePhotoStep === "start" ? "#52B788" : "#E76F51",
                  }}
                />
                <span>{activePhotoStep === "start" ? "1. Départ" : "2. Arrivée"}</span>
              </div>
            )}
          </div>
        ) : viewMode === "svg" && (!gifError || (svgContent && !loadingSvg)) ? (
          /* MODE 2: Clean Animated GIF (or SVG fallback) */
          !gifError ? (
            <img
              src={gifUrl}
              alt={exercise.nameFr || exercise.name}
              onError={() => setGifError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : svgContent ? (
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
          ) : null
        ) : (
          /* MODE 3: Calming Harmony & Breath Bloom */
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <div
              className="pulse-ring"
              style={{
                width: circularMode ? 70 : 84,
                height: circularMode ? 70 : 84,
                borderRadius: "50%",
                backgroundColor: isBreathing ? "var(--color-primary-soft)" : "rgba(231, 111, 81, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isBreathing ? "var(--color-primary)" : "var(--color-accent)",
                border: `2px solid ${isBreathing ? "var(--color-primary-light)" : "var(--color-accent)"}`,
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              }}
            >
              {isBreathing ? <Wind size={circularMode ? 32 : 40} /> : <Activity size={circularMode ? 32 : 40} />}
            </div>

            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "0 14px",
                lineHeight: 1.35,
              }}
            >
              {isBreathing
                ? "Respiration guidée"
                : phase === "rest"
                ? "Repos • Respirez calmement"
                : "Mouvement fluide"}
            </div>
          </div>
        )}
      </div>

      {/* Mode switcher (Photos / Schéma) */}
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
              alignItems: "center",
              backgroundColor: "var(--bg-surface-elevated)",
              padding: 2,
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("photos")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                border: "none",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: viewMode === "photos" ? "var(--bg-surface)" : "transparent",
                color: viewMode === "photos" ? "var(--color-primary)" : "var(--text-muted)",
                boxShadow: viewMode === "photos" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all var(--transition-fast)",
              }}
            >
              <ImageIcon size={12} />
              <span>Photos</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("svg")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                border: "none",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: viewMode === "svg" ? "var(--bg-surface)" : "transparent",
                color: viewMode === "svg" ? "var(--color-primary)" : "var(--text-muted)",
                boxShadow: viewMode === "svg" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all var(--transition-fast)",
              }}
            >
              <Sparkles size={12} />
              <span>Schéma</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
