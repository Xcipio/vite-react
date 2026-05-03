import { useCallback, useEffect, useRef, useState } from "react";

export type ContactBubbleKey = "small" | "medium" | "large";

type ContactBubblePosition = {
  x: number;
  y: number;
};

type RuntimeBubble = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  radius: number;
  speed: number;
};

type ContactBubbleLayout = {
  size: number;
  radius: number;
  speed: number;
  startRight: number;
  startBottom: number;
};

const CONTACT_BUBBLE_LAYOUTS: Record<ContactBubbleKey, ContactBubbleLayout> = {
  small: {
    size: 34,
    radius: 12,
    speed: 0.84,
    startRight: 22,
    startBottom: 18,
  },
  medium: {
    size: 44,
    radius: 17,
    speed: 0.64,
    startRight: 118,
    startBottom: 28,
  },
  large: {
    size: 56,
    radius: 21,
    speed: 0.46,
    startRight: 72,
    startBottom: 68,
  },
};

function useContactBubbles() {
  const contactCardRef = useRef<HTMLDivElement | null>(null);
  const contactBubbleRuntimeRef = useRef<Record<ContactBubbleKey, RuntimeBubble> | null>(null);
  const [burstVersions, setBurstVersions] = useState<Record<ContactBubbleKey, number>>({
    small: 0,
    medium: 0,
    large: 0,
  });
  const [bursting, setBursting] = useState<Record<ContactBubbleKey, boolean>>({
    small: false,
    medium: false,
    large: false,
  });
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [positions, setPositions] = useState<Record<ContactBubbleKey, ContactBubblePosition>>({
    small: { x: 0, y: 0 },
    medium: { x: 0, y: 0 },
    large: { x: 0, y: 0 },
  });

  const updatePositions = useCallback((bubbles: Record<ContactBubbleKey, RuntimeBubble>) => {
    setPositions({
      small: { x: bubbles.small.x, y: bubbles.small.y },
      medium: { x: bubbles.medium.x, y: bubbles.medium.y },
      large: { x: bubbles.large.x, y: bubbles.large.y },
    });
  }, []);

  const respawnBubble = useCallback(
    (key: ContactBubbleKey) => {
      const runtime = contactBubbleRuntimeRef.current;
      const card = contactCardRef.current;
      if (!runtime || !card) {
        return;
      }

      const bubble = runtime[key];
      const width = card.clientWidth;
      const height = card.clientHeight;
      if (!width || !height) {
        return;
      }

      const maxX = Math.max(0, width - bubble.size);
      const maxY = Math.max(0, height - bubble.size);
      const otherKeys = (Object.keys(runtime) as ContactBubbleKey[]).filter(
        (candidate) => candidate !== key,
      );

      let nextX = bubble.x;
      let nextY = bubble.y;

      for (let attempt = 0; attempt < 40; attempt += 1) {
        const candidateX = Math.random() * maxX;
        const candidateY = Math.random() * maxY;
        const isOverlapping = otherKeys.some((otherKey) => {
          const otherBubble = runtime[otherKey];
          const dx =
            otherBubble.x + otherBubble.size / 2 - (candidateX + bubble.size / 2);
          const dy =
            otherBubble.y + otherBubble.size / 2 - (candidateY + bubble.size / 2);
          const minimumDistance = otherBubble.radius + bubble.radius + 4;
          return Math.hypot(dx, dy) < minimumDistance;
        });

        if (!isOverlapping) {
          nextX = candidateX;
          nextY = candidateY;
          break;
        }
      }

      bubble.x = nextX;
      bubble.y = nextY;

      const angle = Math.random() * Math.PI * 2;
      bubble.vx = Math.cos(angle) * bubble.speed;
      bubble.vy = Math.sin(angle) * bubble.speed;

      updatePositions(runtime);
    },
    [updatePositions],
  );

  const burstBubble = (key: ContactBubbleKey) => {
    setBurstVersions((versions) => ({
      ...versions,
      [key]: versions[key] + 1,
    }));
    setBursting((current) => ({
      ...current,
      [key]: true,
    }));
  };

  useEffect(() => {
    const timeoutIds: number[] = [];

    (Object.keys(bursting) as ContactBubbleKey[]).forEach((key) => {
      if (!bursting[key]) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        setBursting((current) => ({
          ...current,
          [key]: false,
        }));
        respawnBubble(key);
      }, 720);
      timeoutIds.push(timeoutId);
    });

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [bursting, respawnBubble]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(
      "(max-width: 1100px), (prefers-reduced-motion: reduce)",
    );

    let frameId = 0;
    let lastTime = 0;

    const randomVelocity = (speed: number) => {
      const angle = Math.random() * Math.PI * 2;
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
    };

    const setVelocityDirection = (
      bubble: RuntimeBubble,
      angle: number,
      speed = bubble.speed,
    ) => {
      bubble.vx = Math.cos(angle) * speed;
      bubble.vy = Math.sin(angle) * speed;
    };

    const jitterVelocity = (bubble: RuntimeBubble) => {
      const angle = Math.atan2(bubble.vy, bubble.vx) + (Math.random() - 0.5) * 0.36;
      setVelocityDirection(bubble, angle);
    };

    const initializeRuntime = () => {
      const card = contactCardRef.current;
      if (!card || mediaQuery.matches) {
        contactBubbleRuntimeRef.current = null;
        setMotionEnabled(false);
        return false;
      }

      const width = card.clientWidth;
      const height = card.clientHeight;
      if (!width || !height) {
        return false;
      }

      const smallLayout = CONTACT_BUBBLE_LAYOUTS.small;
      const mediumLayout = CONTACT_BUBBLE_LAYOUTS.medium;
      const largeLayout = CONTACT_BUBBLE_LAYOUTS.large;
      const smallVelocity = randomVelocity(smallLayout.speed);
      const mediumVelocity = randomVelocity(mediumLayout.speed);
      const largeVelocity = randomVelocity(largeLayout.speed);

      const runtime: Record<ContactBubbleKey, RuntimeBubble> = {
        small: {
          x: width - smallLayout.startRight - smallLayout.size,
          y: height - smallLayout.startBottom - smallLayout.size,
          size: smallLayout.size,
          radius: smallLayout.radius,
          speed: smallLayout.speed,
          ...smallVelocity,
        },
        medium: {
          x: width - mediumLayout.startRight - mediumLayout.size,
          y: height - mediumLayout.startBottom - mediumLayout.size,
          size: mediumLayout.size,
          radius: mediumLayout.radius,
          speed: mediumLayout.speed,
          ...mediumVelocity,
        },
        large: {
          x: width - largeLayout.startRight - largeLayout.size,
          y: height - largeLayout.startBottom - largeLayout.size,
          size: largeLayout.size,
          radius: largeLayout.radius,
          speed: largeLayout.speed,
          ...largeVelocity,
        },
      };

      const keys = Object.keys(runtime) as ContactBubbleKey[];
      for (let i = 0; i < keys.length; i += 1) {
        for (let j = i + 1; j < keys.length; j += 1) {
          const bubbleA = runtime[keys[i]];
          const bubbleB = runtime[keys[j]];
          const dx = bubbleB.x + bubbleB.size / 2 - (bubbleA.x + bubbleA.size / 2);
          const dy = bubbleB.y + bubbleB.size / 2 - (bubbleA.y + bubbleA.size / 2);
          const distance = Math.hypot(dx, dy);
          const minimumDistance = bubbleA.radius + bubbleB.radius + 8;

          if (distance < minimumDistance) {
            bubbleB.x = Math.max(0, bubbleB.x + (minimumDistance - distance));
          }
        }
      }

      contactBubbleRuntimeRef.current = runtime;
      setMotionEnabled(true);
      updatePositions(runtime);
      return true;
    };

    const step = (timestamp: number) => {
      const runtime = contactBubbleRuntimeRef.current;
      if (!runtime) {
        frameId = window.requestAnimationFrame(step);
        return;
      }

      const card = contactCardRef.current;
      if (!card) {
        frameId = window.requestAnimationFrame(step);
        return;
      }

      const width = card.clientWidth;
      const height = card.clientHeight;
      const delta = lastTime ? Math.min((timestamp - lastTime) / 16.6667, 2.2) : 1;
      lastTime = timestamp;

      (Object.keys(runtime) as ContactBubbleKey[]).forEach((key) => {
        const bubble = runtime[key];
        bubble.x += bubble.vx * delta;
        bubble.y += bubble.vy * delta;

        const maxX = Math.max(0, width - bubble.size);
        const maxY = Math.max(0, height - bubble.size);

        if (bubble.x <= 0) {
          bubble.x = 0;
          bubble.vx = Math.abs(bubble.vx);
          jitterVelocity(bubble);
        } else if (bubble.x >= maxX) {
          bubble.x = maxX;
          bubble.vx = -Math.abs(bubble.vx);
          jitterVelocity(bubble);
        }

        if (bubble.y <= 0) {
          bubble.y = 0;
          bubble.vy = Math.abs(bubble.vy);
          jitterVelocity(bubble);
        } else if (bubble.y >= maxY) {
          bubble.y = maxY;
          bubble.vy = -Math.abs(bubble.vy);
          jitterVelocity(bubble);
        }
      });

      const keys = Object.keys(runtime) as ContactBubbleKey[];
      for (let i = 0; i < keys.length; i += 1) {
        for (let j = i + 1; j < keys.length; j += 1) {
          const bubbleA = runtime[keys[i]];
          const bubbleB = runtime[keys[j]];
          const centerDx =
            bubbleB.x + bubbleB.size / 2 - (bubbleA.x + bubbleA.size / 2);
          const centerDy =
            bubbleB.y + bubbleB.size / 2 - (bubbleA.y + bubbleA.size / 2);
          const distance = Math.hypot(centerDx, centerDy);
          const minimumDistance = bubbleA.radius + bubbleB.radius + 2;

          if (distance < minimumDistance) {
            const normalX = distance > 0 ? centerDx / distance : 1;
            const normalY = distance > 0 ? centerDy / distance : 0;
            const overlap = minimumDistance - distance;

            bubbleA.x -= normalX * (overlap / 2);
            bubbleA.y -= normalY * (overlap / 2);
            bubbleB.x += normalX * (overlap / 2);
            bubbleB.y += normalY * (overlap / 2);

            const relativeVelocityX = bubbleB.vx - bubbleA.vx;
            const relativeVelocityY = bubbleB.vy - bubbleA.vy;
            const separatingSpeed =
              relativeVelocityX * normalX + relativeVelocityY * normalY;

            if (separatingSpeed < 0) {
              const impulse = -separatingSpeed;
              bubbleA.vx -= impulse * normalX;
              bubbleA.vy -= impulse * normalY;
              bubbleB.vx += impulse * normalX;
              bubbleB.vy += impulse * normalY;
            }

            jitterVelocity(bubbleA);
            jitterVelocity(bubbleB);
          }
        }
      }

      updatePositions(runtime);
      frameId = window.requestAnimationFrame(step);
    };

    const handleViewportChange = () => {
      lastTime = 0;
      initializeRuntime();
    };

    handleViewportChange();
    frameId = window.requestAnimationFrame(step);
    mediaQuery.addEventListener("change", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      mediaQuery.removeEventListener("change", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [updatePositions]);

  return {
    burstBubble,
    bursting,
    burstVersions,
    contactCardRef,
    motionEnabled,
    positions,
  };
}

export default useContactBubbles;
