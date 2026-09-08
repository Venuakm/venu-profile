"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * A CSS-3D scene sitting behind the page: wireframe solids, orbiting rings and a
 * depth-sorted particle field, all reacting to the pointer and to scroll.
 *
 * Built with CSS transforms rather than WebGL - it costs nothing to load, runs
 * on the compositor, and degrades to a still image when motion is reduced.
 */

/** Deterministic PRNG so server and client generate identical particles. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

type Particle = { x: number; y: number; z: number; size: number; delay: number; duration: number; accent: boolean };

function useParticles(count: number): Particle[] {
  return useMemo(() => {
    const random = seeded(20260908);
    return Array.from({ length: count }, () => ({
      x: random() * 100,
      y: random() * 100,
      z: random() * 480 - 240,
      size: 1 + random() * 2.6,
      delay: random() * -22,
      duration: 16 + random() * 20,
      accent: random() > 0.72,
    }));
  }, [count]);
}

export function Scene3D() {
  const [enabled, setEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useParticles(46);

  // Pointer parallax - the whole scene leans toward the cursor.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const tiltX = useSpring(useTransform(pointerY, [-0.5, 0.5], [8, -8]), { stiffness: 60, damping: 20 });
  const tiltY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-10, 10]), { stiffness: 60, damping: 20 });

  const { scrollYProgress } = useScroll();
  const scrollSpin = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const scrollDrift = useTransform(scrollYProgress, [0, 1], [0, -160]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);

    const onMove = (event: MouseEvent) => {
      pointerX.set(event.clientX / window.innerWidth - 0.5);
      pointerY.set(event.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [pointerX, pointerY]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ perspective: "1100px", perspectiveOrigin: "50% 45%" }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          rotateX: enabled ? tiltX : 0,
          rotateY: enabled ? tiltY : 0,
          y: scrollDrift,
        }}
      >
        {/* Depth-sorted particle field */}
        {particles.map((particle, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              transform: `translateZ(${particle.z}px)`,
              background: particle.accent ? "var(--accent)" : "var(--c-chalk)",
              opacity: particle.accent ? 0.55 : 0.22,
              boxShadow: particle.accent ? "0 0 10px var(--accent)" : "none",
              animation: enabled
                ? `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`
                : undefined,
            }}
          />
        ))}

        {/* Wireframe cube, upper left */}
        <motion.div
          className="absolute left-[8%] top-[18%] h-28 w-28 sm:h-36 sm:w-36"
          style={{ transformStyle: "preserve-3d", rotateZ: scrollSpin }}
        >
          <WireCube size={144} duration={28} />
        </motion.div>

        {/* Octahedron, right side */}
        <motion.div
          className="absolute right-[10%] top-[52%] h-24 w-24 sm:h-32 sm:w-32"
          style={{ transformStyle: "preserve-3d" }}
        >
          <WireOctahedron size={120} duration={22} />
        </motion.div>

        {/* Nested orbit rings, centre */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ transformStyle: "preserve-3d" }}
        >
          <OrbitRings />
        </div>

        {/* Small cube, lower left, counter-rotating for parallax */}
        <div className="absolute bottom-[14%] left-[24%] hidden lg:block" style={{ transformStyle: "preserve-3d" }}>
          <WireCube size={72} duration={19} reverse />
        </div>
      </motion.div>
    </div>
  );
}

/** Six translucent faces assembled into a rotating cube. */
function WireCube({ size, duration, reverse }: { size: number; duration: number; reverse?: boolean }) {
  const half = size / 2;
  const faces = [
    `rotateY(0deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ];

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size, transformStyle: "preserve-3d" }}
      animate={{ rotateX: [0, 360], rotateY: [0, reverse ? -360 : 360] }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {faces.map((transform, index) => (
        <span
          key={index}
          className="absolute inset-0 border"
          style={{
            transform,
            borderColor: index % 2 === 0 ? "color-mix(in srgb, var(--accent) 32%, transparent)" : "var(--c-line-strong)",
            background:
              index === 0
                ? "linear-gradient(135deg, color-mix(in srgb, var(--accent) 7%, transparent), transparent)"
                : "transparent",
          }}
        />
      ))}
    </motion.div>
  );
}

/** Two stacked pyramids - four triangles up, four down. */
function WireOctahedron({ size, duration }: { size: number; duration: number }) {
  const faces = [0, 90, 180, 270];

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size, transformStyle: "preserve-3d" }}
      animate={{ rotateY: [0, 360], rotateX: [12, 372] }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {faces.map((angle) => (
        <span key={`up-${angle}`} style={triangleStyle(size, angle, false)} />
      ))}
      {faces.map((angle) => (
        <span key={`down-${angle}`} style={triangleStyle(size, angle, true)} />
      ))}
    </motion.div>
  );
}

function triangleStyle(size: number, angle: number, flipped: boolean): React.CSSProperties {
  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: size,
    height: size,
    clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
    background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 14%, transparent), transparent 75%)",
    border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
    transform: `rotateY(${angle}deg) rotateX(${flipped ? -35 : 35}deg) translateZ(${size * 0.22}px) ${
      flipped ? "scaleY(-1)" : ""
    }`,
    transformOrigin: "50% 100%",
    backfaceVisibility: "visible",
  };
}

/** Three rings on different axes, like a gyroscope. */
function OrbitRings() {
  const rings = [
    { size: 460, rotateX: 74, rotateY: 0, duration: 34, dashed: false },
    { size: 620, rotateX: 66, rotateY: 32, duration: 52, dashed: true },
    { size: 340, rotateX: 80, rotateY: -24, duration: 26, dashed: false },
  ];

  return (
    <div style={{ transformStyle: "preserve-3d" }}>
      {rings.map((ring, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full border"
          style={{
            width: ring.size,
            height: ring.size,
            left: -ring.size / 2,
            top: -ring.size / 2,
            transformStyle: "preserve-3d",
            borderStyle: ring.dashed ? "dashed" : "solid",
            borderColor:
              index === 0 ? "color-mix(in srgb, var(--accent) 26%, transparent)" : "var(--c-line-strong)",
          }}
          animate={{ rotateZ: [0, index % 2 === 0 ? 360 : -360] }}
          transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
          initial={{ rotateX: ring.rotateX, rotateY: ring.rotateY }}
        >
          {/* A light travelling around the ring */}
          <span
            className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 18px 4px color-mix(in srgb, var(--accent) 65%, transparent)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
