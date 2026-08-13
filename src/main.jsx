import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import { ArrowUpRight } from "lucide-react";
import "./styles.css";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 280;
const FRAME_PATH = (i) =>
  `/StaringVideo/ezgif-frame-${String(i + 1).padStart(3, "0")}.jpg`;

const FEATURES = [
  ["AI Assistant", "Smart suggestions for better layouts."],
  ["2D Planner", "Design accurate floor plans with ease."],
  ["3D Visualization", "See your house come to life."],
  ["Walkthrough", "Explore your home from inside."],
  ["VR Ready", "Experience your design virtually."],
  ["3D Assets", "Furnish and decorate your spaces."],
  ["Custom Styles", "Personalize colours and materials."],
  ["Multi-Floor", "Design your complete home across levels."],
  ["Infinite Canvas", "Create without workspace limits."],
  ["Full Control", "Your ideas, your decisions."]
];

function App() {
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const featureRef = useRef(null);
  const featureContentRef = useRef(null);
  const videoRef = useRef(null);
  const buttonRef = useRef(null);

  // Preload all 280 frames before enabling scrolling.
  useEffect(() => {
    let cancelled = false;
    const images = [];

    const load = async () => {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        await new Promise((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => resolve();
          img.onerror = () => resolve(); // keep the loader from hanging
          img.src = FRAME_PATH(i);
          images[i] = img;
        });
        if (!cancelled) setLoaded(Math.round(((i + 1) / TOTAL_FRAMES) * 100));
      }
      if (!cancelled) {
        window.__heroFrames = images;
        setReady(true);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Lenis + scroll-linked animations.
  useEffect(() => {
    if (!ready) return;

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.9
    });

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      ScrollTrigger.update();
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      const canvas = canvasRef.current;
      const ctx2d = canvas.getContext("2d");
      const frames = window.__heroFrames;
      let lastFrame = -1;
      let drawQueued = false;

      const resizeCanvas = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawFrame(Math.max(lastFrame, 0));
      };

      const drawFrame = (index) => {
        if (!frames[index]) return;
        const img = frames[index];
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const x = (w - dw) / 2;
        const y = (h - dh) / 2;
        ctx2d.clearRect(0, 0, w, h);
        ctx2d.drawImage(img, x, y, dw, dh);
        lastFrame = index;
      };

      const queueDraw = (index) => {
        if (index === lastFrame || drawQueued) return;
        drawQueued = true;
        requestAnimationFrame(() => {
          drawQueued = false;
          drawFrame(index);
        });
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      drawFrame(0);

      gsap.to({ frame: 0 }, {
        frame: TOTAL_FRAMES - 1,
        ease: "none",
        onUpdate: function () {
          queueDraw(Math.floor(this.targets()[0].frame));
        },
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          pin: canvas,
          anticipatePin: 1
        }
      });

      gsap.to(".hero-copy", {
        opacity: 0,
        y: -35,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "25% top",
          scrub: true
        }
      });

      // Feature showcase: 10 scroll steps inside one pinned section.
      const featureState = { index: 0 };
      gsap.to(featureState, {
        index: FEATURES.length - 1,
        snap: "index",
        ease: "none",
        scrollTrigger: {
          trigger: featureRef.current,
          start: "top top",
          end: `+=${window.innerHeight * FEATURES.length}`,
          pin: true,
          scrub: 0.35,
          anticipatePin: 1,
          onUpdate: (self) => {
            const index = Math.min(
              FEATURES.length - 1,
              Math.floor(self.progress * FEATURES.length)
            );
            renderFeature(index);
          }
        }
      });

      const renderFeature = (index) => {
        if (!featureContentRef.current) return;
        const current = featureContentRef.current.dataset.index;
        if (String(index) === current) return;
        featureContentRef.current.dataset.index = index;

        const title = featureContentRef.current.querySelector(".feature-title");
        const desc = featureContentRef.current.querySelector(".feature-desc");

        gsap.to([title, desc], {
          opacity: 0,
          y: 18,
          duration: 0.22,
          ease: "power2.out",
          onComplete: () => {
            title.textContent = FEATURES[index][0];
            desc.textContent = FEATURES[index][1];
            gsap.fromTo(title,
              { opacity: 0, y: -16 },
              { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }
            );
            gsap.fromTo(desc,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.42, delay: 0.1, ease: "power3.out" }
            );
          }
        });

        document.querySelectorAll(".feature-dot").forEach((dot, i) => {
          dot.classList.toggle("active", i === index);
        });
      };

      renderFeature(0);

      gsap.from(".cta-inner", {
        opacity: 0,
        y: 45,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".cta",
          start: "top 80%"
        }
      });

      // Magnetic CTA.
      const button = buttonRef.current;
      const move = (e) => {
        const r = button.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const distance = Math.hypot(dx, dy);
        if (distance < 150) {
          gsap.to(button, {
            x: dx * 0.16,
            y: dy * 0.16,
            duration: 0.35,
            ease: "power3.out"
          });
        }
      };
      const leave = () => gsap.to(button, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.45)" });
      button.addEventListener("mousemove", move);
      button.addEventListener("mouseleave", leave);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        button.removeEventListener("mousemove", move);
        button.removeEventListener("mouseleave", leave);
      };
    });

    return () => {
      ctx.revert();
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [ready]);

  if (!ready) {
    return (
      <div className="loader">
        <div className="loader-top">
          <span>INTERIOR</span>
          <span>{loaded}%</span>
        </div>
        <div className="loader-track">
          <div className="loader-fill" style={{ width: `${loaded}%` }} />
        </div>
        <p>Preparing your space…</p>
      </div>
    );
  }

  return (
    <main>
      <section ref={heroRef} className="hero">
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <p className="eyebrow">DESIGN WITHOUT LIMITS</p>
          <h1>Imagine it.<br /><em>Then live in it.</em></h1>
          <p className="hero-sub">A cinematic workspace for turning ideas into spaces.</p>
          <div className="scroll-hint"><span /> Scroll to explore</div>
        </div>
      </section>

      <section ref={featureRef} className="features">
        <div className="features-inner">
          <div ref={featureContentRef} data-index="-1" className="feature-copy">
            <p className="eyebrow">THE WORKSPACE</p>
            <h2 className="feature-title">AI Assistant</h2>
            <p className="feature-desc">Smart suggestions for better layouts.</p>
          </div>

          <div className="feature-media">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/feature-poster.jpg"
            >
        <source
  src="/Recording%202026-08-12%20135227.mp4"
  type="video/mp4"
/>
            </video>
            <div className="media-shine" />
          </div>

          <div className="feature-progress" aria-label="Feature progress">
            {FEATURES.map((_, i) => (
              <span key={i} className={`feature-dot ${i === 0 ? "active" : ""}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-inner">
          <p className="eyebrow">YOUR NEXT SPACE STARTS HERE</p>
          <h2>Ready to design<br /><em>your dream home?</em></h2>
          <a
            ref={buttonRef}
            className="beta-button"
            href="https://example.com"
            target="_blank"
            rel="noreferrer"
          >
            <span>Visit Beta Version</span>
            <ArrowUpRight size={20} strokeWidth={1.8} />
          </a>
          <p className="placeholder-note">Replace the placeholder beta URL in <code>src/main.jsx</code>.</p>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
