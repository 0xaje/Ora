import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import "../../styles/scrollHero.css";
import {
  CameraTimelineController,
  CameraTimelineOptions,
  frameToIndex,
  indexToFrame,
  frameToProgress,
  resolveCinematicTarget
} from "../../camera/cameraTimeline";

const TOTAL_FRAMES = 300;

export type AmbianceMode = "day" | "sunset" | "night";

export interface ScrollHeroHandle {
  getCurrentFrame: () => number;
  getCurrentAmbiance: () => AmbianceMode;
  setAmbiance: (mode: AmbianceMode) => void;
  navigateToFrame: (targetFrame: number, options?: CameraTimelineOptions) => Promise<boolean>;
  navigateToSpace: (spaceId: string, options?: CameraTimelineOptions) => Promise<boolean>;
  cancelNavigation: () => void;
  isNavigating: () => boolean;
}

export interface ScrollHeroProps {
  onSequenceComplete?: () => void;
  onCtaClick?: () => void;
}

export const ScrollHero = forwardRef<ScrollHeroHandle, ScrollHeroProps>(
  ({ onSequenceComplete, onCtaClick: _onCtaClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Flag tracking programmatic camera tweening to prevent scroll event fight
    const isProgrammaticNavigatingRef = useRef<boolean>(false);
    const cameraControllerRef = useRef<CameraTimelineController | null>(null);

  // Independent frame caches and load trackers for all 3 authentic video tracks
  const frameCachesRef = useRef<Record<AmbianceMode, (HTMLImageElement | null)[]>>({
    day: new Array(TOTAL_FRAMES).fill(null),
    sunset: new Array(TOTAL_FRAMES).fill(null),
    night: new Array(TOTAL_FRAMES).fill(null)
  });

  const isLoadedMapRef = useRef<Record<AmbianceMode, boolean[]>>({
    day: new Array(TOTAL_FRAMES).fill(false),
    sunset: new Array(TOTAL_FRAMES).fill(false),
    night: new Array(TOTAL_FRAMES).fill(false)
  });

  const currentFrameRef = useRef<number>(0);
  const scrollProgressRef = useRef<number>(0);
  const ambianceRef = useRef<AmbianceMode>("sunset");
  const rafIdRef = useRef<number | null>(null);

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [initialFrameLoaded, setInitialFrameLoaded] = useState<boolean>(false);
  const [ambiance, setAmbiance] = useState<AmbianceMode>("sunset");

  // Keep ambianceRef synchronized
  useEffect(() => {
    ambianceRef.current = ambiance;
  }, [ambiance]);

  // Construct frame URL for a specific track and frame index
  const getFrameUrl = useCallback((mode: AmbianceMode, index: number) => {
    const frameNum = String(index + 1).padStart(3, "0");
    return `/frames/${mode}/frame-${frameNum}.jpg`;
  }, []);

  // Draw frame onto canvas with full-bleed cover scaling
  const drawImageToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;

    const imgWidth = img.naturalWidth || 1280;
    const imgHeight = img.naturalHeight || 720;
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let renderWidth = canvasWidth;
    let renderHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    // Full-bleed edge-to-edge: fills entire screen without letterboxing or bars
    if (canvasRatio > imgRatio) {
      renderHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - renderHeight) / 2;
    } else {
      renderWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - renderWidth) / 2;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
    ctx.restore();
  }, []);

  // Render a specific frame for the given ambiance track
  const renderFrame = useCallback(
    (targetIndex: number, mode: AmbianceMode) => {
      currentFrameRef.current = targetIndex;
      const cache = frameCachesRef.current[mode];
      const isLoaded = isLoadedMapRef.current[mode];

      // On-demand priority loading for target frame if not loaded
      if (!cache[targetIndex]) {
        const img = new Image();
        img.src = getFrameUrl(mode, targetIndex);
        cache[targetIndex] = img;
        img.onload = () => {
          isLoaded[targetIndex] = true;
          if (currentFrameRef.current === targetIndex && ambianceRef.current === mode) {
            drawImageToCanvas(img);
          }
        };
      }

      // Proactively load small window around scrub head (target - 2 to target + 3)
      for (let offset = -2; offset <= 3; offset++) {
        const adjIndex = targetIndex + offset;
        if (adjIndex >= 0 && adjIndex < TOTAL_FRAMES && !cache[adjIndex]) {
          const adjImg = new Image();
          adjImg.src = getFrameUrl(mode, adjIndex);
          cache[adjIndex] = adjImg;
          adjImg.onload = () => {
            isLoaded[adjIndex] = true;
          };
        }
      }

      // 1. Direct hit
      if (cache[targetIndex] && isLoaded[targetIndex]) {
        drawImageToCanvas(cache[targetIndex]!);
        return;
      }

      // 2. Nearest loaded fallback for the current track (prevents stutter or black frames)
      let fallbackIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (isLoaded[i] && cache[i]) {
          const dist = Math.abs(i - targetIndex);
          if (dist < minDistance) {
            minDistance = dist;
            fallbackIndex = i;
          }
        }
      }

      if (fallbackIndex !== -1 && cache[fallbackIndex]) {
        drawImageToCanvas(cache[fallbackIndex]!);
      }
    },
    [drawImageToCanvas, getFrameUrl]
  );

  // Resize canvas to fill window at device pixel ratio
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Redraw current frame and active ambiance
    renderFrame(currentFrameRef.current, ambianceRef.current);
  }, [renderFrame]);

  // Progressive batch preloading for a given mode
  const preloadModeBatches = useCallback(
    (mode: AmbianceMode) => {
      const cache = frameCachesRef.current[mode];
      const isLoaded = isLoadedMapRef.current[mode];

      const preloadBatch = (startIndex: number, endIndex: number, onComplete?: () => void) => {
        let loadedCount = 0;
        const count = endIndex - startIndex;
        if (count <= 0) {
          onComplete?.();
          return;
        }

        for (let i = startIndex; i < endIndex; i++) {
          if (!cache[i]) {
            const img = new Image();
            img.src = getFrameUrl(mode, i);
            cache[i] = img;
            img.onload = () => {
              isLoaded[i] = true;
              loadedCount++;
              if (loadedCount >= count) {
                onComplete?.();
              }
            };
            img.onerror = () => {
              loadedCount++;
              if (loadedCount >= count) {
                onComplete?.();
              }
            };
          } else if (isLoaded[i]) {
            loadedCount++;
            if (loadedCount >= count) {
              onComplete?.();
            }
          }
        }
      };

      // Progressive tiers: frames 1-40 first, then 40-150, then 150-300
      preloadBatch(1, 40, () => {
        preloadBatch(40, 150, () => {
          preloadBatch(150, TOTAL_FRAMES);
        });
      });
    },
    [getFrameUrl]
  );

  // Switch ambiance mode
  const handleAmbianceChange = (newMode: AmbianceMode) => {
    if (newMode === ambianceRef.current) return;
    setAmbiance(newMode);
    ambianceRef.current = newMode;
    renderFrame(currentFrameRef.current, newMode);
    preloadModeBatches(newMode);
  };
  if (!cameraControllerRef.current) {
    cameraControllerRef.current = new CameraTimelineController({
      getCurrentFrame: () => indexToFrame(currentFrameRef.current),
      renderFrame: (frameNum: number) => {
        const idx = frameToIndex(frameNum);
        renderFrame(idx, ambianceRef.current);
      },
      syncScroll: (frameNum: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const containerTop = rect.top + window.scrollY;
        const totalScrollableDistance = containerRef.current.offsetHeight - window.innerHeight;
        if (totalScrollableDistance <= 0) return;

        const progress = frameToProgress(frameNum, TOTAL_FRAMES);
        scrollProgressRef.current = progress;
        setScrollProgress(progress);

        const targetY = containerTop + progress * totalScrollableDistance;
        window.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior });
      },
      onAnimationStart: () => {
        isProgrammaticNavigatingRef.current = true;
      },
      onAnimationEnd: () => {
        isProgrammaticNavigatingRef.current = false;
      }
    });
  }

  // Expose typed programmatic navigation handle to parent/App/developer controls
  useImperativeHandle(
    ref,
    () => ({
      getCurrentFrame: () => indexToFrame(currentFrameRef.current),
      getCurrentAmbiance: () => ambianceRef.current,
      setAmbiance: (mode: AmbianceMode) => {
        handleAmbianceChange(mode);
      },
      navigateToFrame: (targetFrame: number, options?: CameraTimelineOptions) => {
        return (
          cameraControllerRef.current?.navigateToFrame(targetFrame, options) ??
          Promise.resolve(false)
        );
      },
      navigateToSpace: (spaceId: string, options?: CameraTimelineOptions) => {
        const target = resolveCinematicTarget(spaceId, options);
        if (!target) return Promise.resolve(false);
        return (
          cameraControllerRef.current?.navigateToFrame(target.frame, {
            ...options,
            durationMs: target.durationMs
          }) ?? Promise.resolve(false)
        );
      },
      cancelNavigation: () => {
        cameraControllerRef.current?.cancelNavigation();
      },
      isNavigating: () => {
        return cameraControllerRef.current?.isNavigating() ?? false;
      }
    }),
    [renderFrame]
  );

  // Cancel any active programmatic camera animation on unmount
  useEffect(() => {
    return () => {
      cameraControllerRef.current?.cancelNavigation();
    };
  }, []);

  // Mount initialization: Preload Frame 0 for all 3 tracks for instant switching
  useEffect(() => {
    let isCancelled = false;

    const modes: AmbianceMode[] = ["sunset", "day", "night"];

    // 1. Immediate priority: Frame 0 for all 3 modes
    modes.forEach((mode) => {
      const img = new Image();
      img.src = getFrameUrl(mode, 0);
      frameCachesRef.current[mode][0] = img;
      img.onload = () => {
        if (isCancelled) return;
        isLoadedMapRef.current[mode][0] = true;
        if (mode === ambianceRef.current) {
          setInitialFrameLoaded(true);
          handleResize();
          renderFrame(0, mode);
        }
      };
      if (img.complete && img.naturalWidth > 0) {
        isLoadedMapRef.current[mode][0] = true;
        if (mode === ambianceRef.current) {
          setInitialFrameLoaded(true);
          handleResize();
          renderFrame(0, mode);
        }
      }
    });

    // 2. Preload active track frames in background
    preloadModeBatches(ambianceRef.current);

    window.addEventListener("resize", handleResize);

    return () => {
      isCancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, [getFrameUrl, handleResize, preloadModeBatches, renderFrame]);

  // Scroll listener tracking progress through the sticky sequence (forward and reverse)
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollableDistance = rect.height - window.innerHeight;

      if (totalScrollableDistance <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / totalScrollableDistance));

      scrollProgressRef.current = progress;
      setScrollProgress(progress);

      // If programmatic camera animation is driving the scroll, skip redundant manual scroll RAF
      if (isProgrammaticNavigatingRef.current) {
        return;
      }

      // Compute frame index (0 to TOTAL_FRAMES - 1)
      const targetIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.floor(progress * (TOTAL_FRAMES - 1)))
      );

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        renderFrame(targetIndex, ambianceRef.current);
      });

      if (progress >= 1 && onSequenceComplete) {
        onSequenceComplete();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [onSequenceComplete, renderFrame]);

  // Fade out the title as user scrolls — gone by ~30% through the sequence
  const titleOpacity = Math.max(0, 1 - scrollProgress * 3.2);
  const titleTranslateY = scrollProgress * -48;

  return (
    <section className="scroll-hero-container" ref={containerRef} aria-label="Aurelia Interactive Architecture Hero">
      {/* Sticky Fullscreen Viewport holding the Canvas sequence */}
      <div className="scroll-hero-sticky">
        <canvas ref={canvasRef} className="scroll-hero-canvas" />

        {/* Ambient Vignette Overlay */}
        <div className="scroll-hero-vignette" />

        {/* Cinematic Brand Title — fades & lifts as user scrolls in */}
        <div
          className="hero-wordmark-overlay"
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleTranslateY}px)`,
            pointerEvents: titleOpacity < 0.05 ? "none" : "auto"
          }}
          aria-hidden={titleOpacity < 0.05}
        >
          <h1 className="hero-wordmark-title">AURELIA</h1>
          <p className="hero-wordmark-tagline">
            <span className="tagline-line">A Place to Stay.</span>
            <span className="tagline-sep" aria-hidden="true" />
            <span className="tagline-line">A Place to Feel.</span>
          </p>
        </div>

        {/* Minimal Progress Line along bottom edge */}
        <div className="sequence-progress-track">
          <div className="sequence-progress-bar" style={{ width: `${Math.round(scrollProgress * 100)}%` }} />
        </div>

        {/* Loading Initial Indicator (Only until frame 0 is ready) */}
        {!initialFrameLoaded && (
          <div className="hero-initial-loader">
            <div className="loader-spinner" />
            <span>Loading Sanctuary...</span>
          </div>
        )}
      </div>
    </section>
  );
});

ScrollHero.displayName = "ScrollHero";
