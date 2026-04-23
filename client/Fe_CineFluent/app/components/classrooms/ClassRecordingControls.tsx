"use client";

import { useRef, useState } from "react";
import { Mic, Square, WandSparkles } from "lucide-react";

import { BeUrl } from "@/app/lib/services/api_client";
import { IClassSessionRecap } from "@/app/lib/types/classroom";

function compactText(value: string | null | undefined, maxChars: number) {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

export default function ClassRecordingControls({
  classroomId,
  sessionId,
  initialRecap,
  readOnly = false,
}: {
  classroomId: number;
  sessionId: number;
  initialRecap: IClassSessionRecap | null;
  readOnly?: boolean;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recap, setRecap] = useState<IClassSessionRecap | null>(initialRecap);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function uploadRecording(blob: Blob, durationSeconds: number) {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("audio", blob, `class-session-${sessionId}.webm`);
    formData.append("duration_seconds", String(Math.round(durationSeconds)));

    try {
      const response = await fetch(
        `${BeUrl}/classrooms/${classroomId}/sessions/${sessionId}/recordings`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Không thể tạo recap từ ghi âm.");
      }

      setRecap(payload?.data?.recap || null);
    } catch (uploadError: any) {
      setError(uploadError?.message || "Không thể upload ghi âm.");
    } finally {
      setIsUploading(false);
    }
  }

  async function startRecording() {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      const recorderOptions = MediaRecorder.isTypeSupported("audio/webm")
        ? { mimeType: "audio/webm" }
        : undefined;
      const recorder = new MediaRecorder(stream, recorderOptions);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const durationSeconds = startedAtRef.current
          ? (Date.now() - startedAtRef.current) / 1000
          : 0;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        uploadRecording(blob, durationSeconds);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setError(
        "Trình duyệt không cấp quyền microphone hoặc không hỗ trợ ghi âm.",
      );
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  }

  const summaryText = compactText(recap?.summary_text, 320);
  const keyPoints = (recap?.key_points || []).slice(0, 3).map((point) =>
    compactText(point, 110),
  );
  const homeworkText = compactText(recap?.homework_text, 160);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      {!readOnly ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-300">Ghi âm AI recap</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Giáo viên bấm ghi âm, cuối buổi dừng lại để AI tóm tắt ngắn nội
              dung chính.
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <WandSparkles className="h-5 w-5" />
          </div>
        </div>
      ) : null}

      {!readOnly ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording || isUploading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Mic className="h-4 w-4" />
            Bắt đầu
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-blue-400 disabled:cursor-not-allowed disabled:text-slate-600"
          >
            <Square className="h-4 w-4" />
            Kết thúc
          </button>
        </div>
      ) : null}

      {isRecording ? (
        <p className="mt-3 text-xs font-semibold text-blue-300">
          Đang ghi âm microphone của giáo viên...
        </p>
      ) : null}

      {isUploading ? (
        <p className="mt-3 text-xs font-semibold text-blue-300">
          Đang upload audio và chờ Gemini tóm tắt...
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs font-semibold text-red-300">{error}</p>
      ) : null}

      {recap ? (
        <div
          className={
            readOnly
              ? "max-h-[420px] space-y-4 overflow-y-auto pr-1"
              : "mt-5 max-h-[420px] space-y-4 overflow-y-auto border-t border-slate-800 pt-4 pr-1"
          }
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
              Recap buổi học
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              {summaryText || "Chưa có tóm tắt ngắn cho buổi học này."}
            </p>
          </div>

          {keyPoints.length ? (
            <div>
              <p className="text-sm font-semibold text-slate-300">Ý chính</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-400">
                {keyPoints.map((point) => (
                  <li key={point}>- {point}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {homeworkText ? (
            <div>
              <p className="text-sm font-semibold text-slate-300">Bài cần làm</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {homeworkText}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
