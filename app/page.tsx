"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Slide = 1 | 2 | 3 | 4 | 5;
const SLIDES: Slide[] = [1, 2, 3, 4, 5];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** ===== SINGLE BACKSOUND FOR ALL SLIDES ===== */
function useBgm() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio("/sound/backsound1.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.65;

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!enabled) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    audio.play().catch(() => setEnabled(false));
  }, [enabled]);

  return { enabled, setEnabled };
}

/** ===== Global Slide Variants (in/out like slide 3) ===== */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_INOUT: [number, number, number, number] = [0.4, 0, 0.2, 1];

const slideVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 40 : -40,
    scale: 0.985,
    filter: "blur(10px)",
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_OUT },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -30 : 30,
    scale: 0.985,
    filter: "blur(10px)",
    transition: { duration: 0.45, ease: EASE_INOUT },
  }),
};

type MessagePayload = {
  nama: string;
  pesan: string;
  harapan2026: string;
};

const LS_KEY = "valentine_message_v1";

export default function Page() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[clamp(index, 0, SLIDES.length - 1)];
  const progress = useMemo(() => ((index + 1) / SLIDES.length) * 100, [index]);
  const { enabled: musicOn, setEnabled: setMusicOn } = useBgm();

  // track direction for slide animation
  const [direction, setDirection] = useState(1);

  const [form, setForm] = useState<MessagePayload>({ nama: "", pesan: "", harapan2026: "" });

  // ✅ pesan yang sudah "dikirim" (ditampilkan hanya di slide 4)
  const [submittedMessage, setSubmittedMessage] = useState<MessagePayload | null>(null);

  // ✅ Load last submitted message from localStorage on first mount (persist after refresh)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as MessagePayload;
      if (parsed && typeof parsed === "object") {
        setSubmittedMessage(parsed);
      }
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  const next = () => {
    setDirection(1);
    setIndex((v) => clamp(v + 1, 0, SLIDES.length - 1));
  };
  const prev = () => {
    setDirection(-1);
    setIndex((v) => clamp(v - 1, 0, SLIDES.length - 1));
  };

  return (
    <main className="min-h-screen relative overflow-hidden text-white">
      {/* Background: nailong3 full + scalable */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: "url(/characters/nailong3.png)" }}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_20%_20%,rgba(255,180,220,.22),transparent_60%),radial-gradient(900px_600px_at_80%_75%,rgba(140,170,255,.20),transparent_62%)]" />

      {/* Rain on all slides */}
      <BgFloatRain slide={slide} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Top Bar */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-200 shadow-[0_0_18px_rgba(255,120,200,.6)]" />
            <span className="font-extrabold text-sm">Selamat Valentine, Jenong</span>
          </div>

          <div className="flex-1 h-2 rounded-full border border-white/15 bg-white/10 overflow-hidden">
            <div className="h-full bg-linear-to-r from-pink-200 to-indigo-300" style={{ width: `${progress}%` }} />
          </div>

          <button
            onClick={() => setMusicOn(!musicOn)}
            className="rounded-full px-3 py-2 text-xs font-extrabold border border-white/15 bg-white/10 hover:bg-white/15"
            title="Play / Stop music"
          >
            {musicOn ? "🔊 Music On" : "🔇 Play Music"}
          </button>
        </div>

        {/* Card */}
        <div className="mt-5 rounded-3xl border border-white/15 bg-black/35 backdrop-blur-xl p-5 shadow-[0_22px_90px_rgba(0,0,0,.45)]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={slide} custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
              {slide === 1 && <Slide1 onNext={next} />}
              {slide === 2 && <Slide2 onNext={next} />}
              {slide === 3 && <Slide3 onNext={next} />}

              {/* ✅ Slide 4 dengan submit pesan + supabase + localStorage */}
              {slide === 4 && (
                <Slide4
                  form={form}
                  setForm={setForm}
                  onNext={next}
                  submittedMessage={submittedMessage}
                  setSubmittedMessage={setSubmittedMessage}
                />
              )}

              {/* ✅ Slide 5 tanpa pesan */}
              {slide === 5 && <Slide5 />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={prev}
              disabled={index === 0}
              className="rounded-full px-4 py-2 font-extrabold border border-white/15 bg-white/10 disabled:opacity-40"
            >
              ← Back
            </button>

            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={[
                    "h-2 w-2 rounded-full",
                    i === index
                      ? "bg-linear-to-r from-pink-200 to-indigo-300 shadow-[0_0_14px_rgba(109,123,255,.55)]"
                      : "bg-white/25",
                  ].join(" ")}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={index === SLIDES.length - 1}
              className="rounded-full px-4 py-2 font-extrabold border border-white/15 bg-white/10 disabled:opacity-40"
            >
              Next →
            </button>
          </div>

          <div className="mt-3 text-center text-xs opacity-80 font-semibold">
            Salsabilla Athiyah:{" "}
            <code className="px-2 py-0.5 rounded-full bg-black/25 border border-white/15">Mantan Kandung</code>
          </div>
        </div>

        <footer className="mt-4 flex justify-between text-xs opacity-80">
          <span>Made By Arjuna Satria</span>
          <span>Slide {slide}/5</span>
        </footer>
      </div>
    </main>
  );
}

/* ===== Slide 1 ===== */
function Slide1({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="rounded-3xl border border-white/15 bg-white/10 p-2">
        <img src="/characters/Hay.gif" alt="Hay" className="w-70 h-auto rounded-2xl" />
      </div>

      <div className="text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-black leading-tight">Hai Salsabila Jenong (≧▽≦)</h1>
        <p className="mt-2 text-base md:text-lg opacity-90">Klik tombol dibawah ini yaa</p>
        <button onClick={onNext} className="mt-4 rounded-full px-6 py-3 font-extrabold border border-white/15 bg-white/10 hover:bg-white/15">
          Klik ✨
        </button>
      </div>
    </div>
  );
}

/* ===== Slide 2 ===== */
function Slide2({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center text-center">
        <img
          src="/characters/Joget.gif"
          alt="Joget"
          className="w-35 h-auto rounded-2xl border border-white/15 bg-white/10 p-2"
        />

        <h2 className="mt-3 text-4xl md:text-5xl font-black leading-tight">
          Happy Valentine{" "}
          <span className="text-pink-200 drop-shadow-[0_0_18px_rgba(255,120,200,.45)]">Mantan Kandung</span> 💖
        </h2>

        <p className="mt-2 opacity-90">Semoga sukses dan bahagia terus ya, hehe 🌿</p>

        <button onClick={onNext} className="mt-4 rounded-full px-6 py-3 font-extrabold border border-white/15 bg-white/10 hover:bg-white/15">
          Klik lanjut dong!
        </button>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <SmoothCard src="/characters/sabil1.jpeg" alt="sabil1" delay={0.0} />
        <SmoothCard src="/characters/sabil2.jpeg" alt="sabil2" delay={0.08} />
        <SmoothCard src="/characters/sabil3.jpeg" alt="sabil3" delay={0.16} />
      </div>
    </div>
  );
}

function SmoothCard({ src, alt, delay }: { src: string; alt: string; delay: number }) {
  return (
    <motion.div
      className="rounded-3xl border border-white/15 bg-white/10 p-2"
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, ease: EASE_OUT, delay }}
      whileHover={{ y: -6 }}
    >
      <motion.div animate={{ y: [0, -5, 0], rotate: [0, 0.6, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: EASE_INOUT }}>
        <img src={src} alt={alt} className="w-55 h-auto rounded-2xl" />
      </motion.div>
    </motion.div>
  );
}

/* ===== Slide 3 ===== */
function Slide3({ onNext }: { onNext: () => void }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <motion.div
        initial={{ opacity: 0, x: -40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="flex justify-center md:justify-start"
      >
        <motion.div
          className="rounded-3xl border border-white/15 bg-white/10 p-2"
          animate={{ y: [0, -6, 0], rotate: [0, 1.2, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: EASE_INOUT }}
        >
          <img src="/characters/nailong2.png" alt="nailong2" className="w-55 h-auto rounded-2xl" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
        className="text-center md:text-left"
      >
        <h2 className="text-4xl md:text-5xl font-black">Eh jadi ga nih ke solo?</h2>
        <p className="mt-2 opacity-90">yaa, kalo jadi coba dong klik tombol di bawah ini😳</p>

        <button onClick={onNext} className="mt-4 rounded-full px-6 py-3 font-extrabold border border-white/15 bg-white/10 hover:bg-white/15">
          Gas ga sh?
        </button>
      </motion.div>
    </div>
  );
}

/* ===== Slide 4 (Supabase + Persist) ===== */
function Slide4({
  form,
  setForm,
  onNext,
  submittedMessage,
  setSubmittedMessage,
}: {
  form: MessagePayload;
  setForm: React.Dispatch<React.SetStateAction<MessagePayload>>;
  onNext: () => void;
  submittedMessage: MessagePayload | null;
  setSubmittedMessage: React.Dispatch<React.SetStateAction<MessagePayload | null>>;
}) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.nama.trim() || !form.pesan.trim() || !form.harapan2026.trim()) {
      alert("Isi semua dulu yaa 😤");
      return;
    }

    setSending(true);

    const payload: MessagePayload = {
      nama: form.nama,
      pesan: form.pesan,
      harapan: form.harapan2026,
    };

    // ✅ Insert to Supabase (table: messages)
    const { error } = await supabase.from("valentine-message").insert([payload]);

    if (error) {
      console.error(error);
      alert("Gagal kirim ke Supabase: " + error.message);
      setSending(false);
      return;
    }

    // ✅ Update local state + localStorage (persist after refresh)
    setSubmittedMessage(payload);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {}

    alert("Pesan berhasil dikirim ✅");
    setSending(false);
  };

  const clearLocal = () => {
    setSubmittedMessage(null);
    localStorage.removeItem(LS_KEY);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div>
        <h2 className="text-3xl md:text-4xl font-black leading-tight">Isi dlu ya form nya, JENONG 😎</h2>
        <p className="mt-2 opacity-90">Hehe, isi lohh yaa awas kalo Ngarang</p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="text-sm font-extrabold opacity-90">Nama</label>
          <input
            value={form.nama}
            onChange={(e) => setForm((s) => ({ ...s, nama: e.target.value }))}
            className="w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 outline-none focus:border-pink-200/60"
            placeholder="Contoh Nama : Arjuna Ganteng..."
          />

          <label className="text-sm font-extrabold opacity-90">Pesan singkat</label>
          <textarea
            value={form.pesan}
            onChange={(e) => setForm((s) => ({ ...s, pesan: e.target.value }))}
            className="w-full min-h-24 rounded-2xl border border-white/15 bg-black/25 px-4 py-3 outline-none focus:border-pink-200/60"
            placeholder="'Ihh juna baik, soleh, calon org sukses'"
          />

          <label className="text-sm font-extrabold opacity-90">Harapan 2026</label>
          <textarea
            value={form.harapan2026}
            onChange={(e) => setForm((s) => ({ ...s, harapan2026: e.target.value }))}
            className="w-full min-h-24 rounded-2xl border border-white/15 bg-black/25 px-4 py-3 outline-none focus:border-pink-200/60"
            placeholder="'Semoga 2026 juna makin di lancarkan rezekinya..'"
          />
        </div>

        {/* ✅ tombol kirim pesan */}
        <button
          onClick={handleSend}
          disabled={sending}
          className="mt-4 rounded-full px-6 py-3 font-extrabold border border-pink-200/60 bg-pink-200/15 hover:bg-pink-200/25 disabled:opacity-50"
        >
          {sending ? "Mengirim..." : "Kirim Pesan 💌"}
        </button>

        {/* optional: clear local saved message */}
        <button
          onClick={clearLocal}
          className="mt-3 ml-2 rounded-full px-6 py-3 font-extrabold border border-white/15 bg-white/10 hover:bg-white/15"
        >
          Reset Pesan
        </button>

        <button
          onClick={onNext}
          className="mt-3 block rounded-full px-6 py-3 font-extrabold border border-white/15 bg-white/10 hover:bg-white/15"
        >
          Surprises buat kamu🙈
        </button>
      </div>

      {/* tampil pesan hanya setelah dikirim */}
      <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
        <div className="text-xs font-extrabold opacity-80">Pesan Terkirim</div>

        {submittedMessage ? (
          <>
            <div className="mt-2 text-lg font-black">
              {submittedMessage.nama ? `Hai, ${submittedMessage.nama} ` : "Hai! "}
            </div>
            <div className="mt-2 text-sm opacity-90 whitespace-pre-wrap">{submittedMessage.pesan}</div>
            <div className="mt-3 text-sm opacity-90 whitespace-pre-wrap">
              <span className="font-extrabold">Harapan 2026:</span> {submittedMessage.harapan2026}
            </div>
            <div className="mt-3 text-xs opacity-75">(Pesan udah kekirim & tersimpan ✅)</div>
          </>
        ) : (
          <>
            <div className="mt-2 text-lg font-black">{form.nama ? `Hai, ${form.nama} ` : "Hai! "}</div>
            <div className="mt-2 text-sm opacity-90 whitespace-pre-wrap">{form.pesan || "Pesan buat juna ganteng ada disini..."}</div>
            <div className="mt-3 text-sm opacity-90 whitespace-pre-wrap">
              <span className="font-extrabold">Harapan 2026:</span> {form.harapan2026 || "(belum diisi)"}
            </div>
            <div className="mt-3 text-xs opacity-75">
              Klik <span className="font-extrabold">Kirim Pesan 💌</span> biar pesannya “fix” dan ke-save.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== Slide 5 (lebih menarik, tanpa pesan) ===== */
function Slide5() {
  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="text-center"
      >
        <h2 className="text-4xl md:text-5xl font-black">Surprise JENONG!</h2>
        <p className="mt-2 opacity-90">Semangat yaa buat kedepannya💖</p>

        <motion.div
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: EASE_INOUT }}
        >
          <span className="text-sm font-extrabold">Ready to go?</span>
          <span className="text-lg">✈️</span>
        </motion.div>
      </motion.div>

      <div className="rounded-2xl border border-white/15 bg-black/25 overflow-hidden">
        <iframe src="/tiket/tiket.pdf" className="w-full h-130" title="tiket" />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="/tiket/tiket.pdf"
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-6 py-3 font-extrabold border border-white/15 bg-white/10 hover:bg-white/15"
        >
          Open PDF
        </a>
        <a
          href="/tiket/tiket.pdf"
          download
          className="rounded-full px-6 py-3 font-extrabold border border-pink-200/60 bg-pink-200/15 hover:bg-pink-200/25"
        >
          Download PDF 🎁
        </a>
      </div>

      <p className="text-xs opacity-80 mt-1 text-center">
        semangat yaaa by <span className="font-extrabold">Arjuna Satria</span>
      </p>
    </div>
  );
}

/** ===== Background Float Rain ===== */
function BgFloatRain({ slide }: { slide: Slide }) {
  const sources = ["/characters/sabil1-bg.png", "/characters/sabil2-bg.png", "/characters/sabil3-bg.png"];

  const count = slide === 2 ? 10 : slide === 4 ? 8 : 9;

  return (
    <div className="absolute inset-0 pointer-events-none z-1 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 73) % 100;
        const delay = (i * 0.55) % 6;
        const dur = 10 + (i % 6);
        const size = 90 + ((i * 17) % 80);
        const src = sources[i % sources.length];

        return (
          <motion.img
            key={i}
            src={src}
            alt=""
            className="absolute opacity-25 blur-[0.2px] rounded-2xl"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              top: `-20%`,
              filter: "drop-shadow(0 0 18px rgba(0,0,0,.22))",
            }}
            initial={{ y: "-30vh" }}
            animate={{ y: "140vh", x: [0, 18, -10, 0], rotate: [0, 4, -3, 0] }}
            transition={{
              duration: dur,
              repeat: Infinity,
              ease: "linear",
              delay,
            }}
          />
        );
      })}
    </div>
  );
}
