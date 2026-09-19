import { useEffect, useId, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { formatPlaybackTime } from "@/materials/model/playback";

type Props = {
  src: string;
  title?: string;
  className?: string;
  onRetry?: () => void;
};

const RATES = [1, 1.5] as const;

export function AudioPlayer({ src, title, className, onRetry }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const labelId = useId();
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);
  const [error, setError] = useState<string | null>(null);
  const [scrubbing, setScrubbing] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setError(null);
    audio.pause();
    audio.load();
    audio.playbackRate = rate;
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
  }, [rate]);

  function syncTime() {
    const audio = audioRef.current;
    if (!audio || scrubbing) return;
    setCurrent(audio.currentTime);
  }

  function syncMeta() {
    const audio = audioRef.current;
    if (!audio) return;
    if (Number.isFinite(audio.duration)) setDuration(audio.duration);
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    try {
      if (audio.paused) {
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    } catch {
      setPlaying(false);
      setError("Couldn’t play this audio. Try again or download the file.");
    }
  }

  function onSeek(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setCurrent(value);
  }

  function toggleRate() {
    setRate((prev) => (prev === 1 ? 1.5 : 1));
  }

  const max = duration > 0 && Number.isFinite(duration) ? duration : 0;
  const progressLabel = `${formatPlaybackTime(current)} / ${
    max > 0 ? formatPlaybackTime(max) : "–:––"
  }`;

  return (
    <div
      className={[
        "rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3 shadow-[var(--shadow)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-labelledby={title ? labelId : undefined}
      aria-label={title ? undefined : "Audio player"}
    >
      {title ? (
        <p
          id={labelId}
          className="mb-2 truncate text-[13px] font-bold text-[var(--ink)]"
        >
          {title}
        </p>
      ) : null}

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="sr-only"
        onTimeUpdate={syncTime}
        onLoadedMetadata={syncMeta}
        onDurationChange={syncMeta}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setError("Couldn’t load this audio. Try again or download the file.");
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void togglePlay()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--green)] bg-[var(--green)] text-white transition-colors hover:border-[var(--green-deep)] hover:bg-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <PauseIcon className="h-6 w-6" aria-hidden />
          ) : (
            <PlayIcon className="h-6 w-6" aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={`${labelId}-scrub`}>
            Seek
          </label>
          <input
            id={`${labelId}-scrub`}
            type="range"
            min={0}
            max={max || 0}
            step={0.1}
            value={max > 0 ? Math.min(current, max) : 0}
            disabled={max <= 0}
            onPointerDown={() => setScrubbing(true)}
            onPointerUp={() => setScrubbing(false)}
            onPointerCancel={() => setScrubbing(false)}
            onChange={(event) => onSeek(Number(event.target.value))}
            className="cw-audio-scrub h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--line-soft)] accent-[var(--green)] disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="mt-1 flex items-center justify-between gap-2 text-[12px] font-medium text-[var(--ink-soft)]">
            <span aria-live="off">{progressLabel}</span>
            <button
              type="button"
              onClick={toggleRate}
              className="rounded-[6px] border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 text-[12px] font-bold text-[var(--ink)] hover:border-[var(--green)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              aria-label={`Playback speed ${rate} times. Click to change.`}
            >
              {rate === 1 ? "1×" : "1.5×"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-[13px] text-[var(--amber-deep)]" role="alert">
            {error}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                onRetry();
              }}
              className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
