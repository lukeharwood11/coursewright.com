import { useEffect, useRef, useState } from "react";
import {
  audioSnippetFilename,
  pickRecorderMimeType,
  snippetReachedMax,
} from "@/materials/model/audioSnippet";

function isAudioFile(file: File | null): file is File {
  return file != null && file.type.startsWith("audio/");
}

export function useAudioSnippetRecorder(
  file: File | null,
  onFile: (file: File | null) => void,
) {
  const [status, setStatus] = useState<"idle" | "starting" | "recording">("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const previewForFileRef = useRef<File | null>(null);

  function replacePreview(next: string | null, forFile: File | null = null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = next;
    previewForFileRef.current = forFile;
    setPreviewUrl(next);
  }

  // Keep a playable preview for whatever audio File the parent still holds
  // (e.g. after remounting when switching material kinds).
  useEffect(() => {
    if (!isAudioFile(file)) {
      if (previewForFileRef.current != null) replacePreview(null);
      return;
    }
    if (previewForFileRef.current === file && previewUrlRef.current) return;
    replacePreview(URL.createObjectURL(file), file);
  }, [file]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (tickRef.current != null) window.clearInterval(tickRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function finish(blobs: Blob[], mimeType: string) {
    const type = mimeType || blobs[0]?.type || "audio/webm";
    const next = new File([new Blob(blobs, { type })], audioSnippetFilename(type), {
      type,
    });
    replacePreview(URL.createObjectURL(next), next);
    onFile(next);
  }

  async function start() {
    setError(null);
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (tickRef.current != null) window.clearInterval(tickRef.current);
        tickRef.current = null;
        setStatus("idle");
        finish(chunksRef.current, recorder.mimeType);
      };
      recorder.start(1000);
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setStatus("recording");
      tickRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setElapsedMs(elapsed);
        if (snippetReachedMax(elapsed) && recorder.state === "recording") {
          recorder.stop();
        }
      }, 200);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStatus("idle");
      setError("Allow the microphone to record a short clip, or upload a file instead.");
    }
  }

  function stop() {
    const recorder = mediaRef.current;
    if (recorder && recorder.state === "recording") recorder.stop();
  }

  function clearPreview() {
    replacePreview(null);
  }

  return { status, elapsedMs, error, previewUrl, start, stop, clearPreview };
}
