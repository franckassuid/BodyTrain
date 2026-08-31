import React, { useState, useEffect, useRef } from "react";
import { Activity, Wind, Play, Pause, Image as ImageIcon } from "lucide-react";
import type { Exercise } from "../types/exercise.ts";

interface ExerciseAnimationProps {
  exercise: Exercise;
  nextExercise?: Exercise | null;
  phase: "preparation" | "work" | "rest" | "finished";
  circularMode?: boolean;
  isPaused?: boolean;
}

export const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({
  exercise,
  nextExercise,
  phase,
  circularMode = false,
  isPaused = false,
}) => {
  const slug = exercise.slug || exercise.id;

  // Check available media
  const hasStartPhoto = exercise.media?.some((m) => m.type === "start_position");
  const hasEndPhoto = exercise.media?.some((m) => m.type === "end_position");
  const hasPhotos = hasStartPhoto || hasEndPhoto;

  // View mode: 'gif' (default) | 'photos'
  const [viewMode, setViewMode] = useState<"gif" | "photos">("gif");
  const [activePhotoStep, setActivePhotoStep] = useState<"start" | "end">("start");
  const [photoError, setPhotoError] = useState<boolean>(false);
  const [gifError, setGifError] = useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gifUrl = `/animations/${slug}.gif`;

  // Reset states on exercise change
  useEffect(() => {
    setPhotoError(false);
    setGifError(false);
    setIsFrozen(false);
    setActivePhotoStep("start");
    setViewMode("gif");
  }, [exercise.id, slug]);

  // Pause handling: snapshot frame to canvas to freeze the GIF playback
  useEffect(() => {
    if (isPaused) {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (img && canvas) {
        try {
          const w = img.naturalWidth || img.clientWidth || 300;
          const h = img.naturalHeight || img.clientHeight || 300;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            setIsFrozen(true);
          }
        } catch {
          setIsFrozen(true);
        }
      } else {
        setIsFrozen(true);
      }
    } else {
      setIsFrozen(false);
    }
  }, [isPaused]);

  // Preload next exercise assets
  useEffect(() => {
    if (nextExercise) {
      const nextSlug = nextExercise.slug || nextExercise.id;
      const imgGif = new Image();
      imgGif.src = `/animations/${nextSlug}.gif`;
      const imgPhoto1 = new Image();
      imgPhoto1.src = `/exercises/${nextSlug}/start.webp`;
      const imgPhoto2 = new Image();
      imgPhoto2.src = `/exercises/${nextSlug}/end.webp`;
    }
  }, [nextExercise]);

  // Alternating photo postures loop (1.7s per posture) if in photo mode
  useEffect(() => {
    if (isPaused || viewMode !== "photos" || !hasPhotos || !hasEndPhoto) return;

    const interval = setInterval(() => {
      setActivePhotoStep((prev) => (prev === "start" ? "end" : "start"));
    }, 1700);

    return () => clearInterval(interval);
  }, [isPaused, viewMode, hasPhotos, hasEndPhoto, slug]);

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
        {/* MODE 1: Top Priority Fluid Animated GIF */}
        {viewMode === "gif" && !gifError ? (
          <>
            <img
              ref={imgRef}
              src={gifUrl}
              alt={exercise.nameFr || exercise.name}
              onError={() => setGifError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: isFrozen ? "none" : "block",
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: isFrozen ? "block" : "none",
              }}
            />
            {isPaused && (
              <div
                style={{
                  position: "absolute",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "#FFFFFF",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  zIndex: 10,
                  letterSpacing: "0.04em",
                  backdropFilter: "blur(4px)",
                }}
              >
                <Pause size={12} fill="currentColor" />
                <span>PAUSE</span>
              </div>
            )}
          </>
        ) : (viewMode === "photos" || gifError) && hasPhotos && !photoError ? (
          /* MODE 2: High Quality Photo Demonstration with Live Loop */
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

      {/* Mode switcher (Animation / Photos) when photos are also available */}
      {hasPhotos && !gifError && (
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
              onClick={() => setViewMode("gif")}
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
                backgroundColor: viewMode === "gif" ? "var(--bg-surface)" : "transparent",
                color: viewMode === "gif" ? "var(--color-primary)" : "var(--text-muted)",
                boxShadow: viewMode === "gif" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all var(--transition-fast)",
              }}
            >
              <Play size={12} fill="currentColor" />
              <span>Animation</span>
            </button>

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
          </div>
        </div>
      )}
    </div>
  );
};
