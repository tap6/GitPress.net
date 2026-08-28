"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaBlob } from "@/hooks/useMediaBlob";

const VIEW_WIDTH = 280;

interface Props {
  label: string;
  hint?: string;
  /** Width / height of the crop window. */
  aspect: number;
  round?: boolean;
  dataField: string;
  removeField: string;
  currentPreviewUrl?: string | null;
  aspectChoices?: Array<{ id: string; label: string; value: number }>;
}

export function ImageCropper({
  label,
  hint,
  aspect: initialAspect,
  round,
  dataField,
  removeField,
  currentPreviewUrl,
  aspectChoices,
}: Props) {
  const [aspect, setAspect] = useState(initialAspect);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dataUrl, setDataUrl] = useState("");
  const [remove, setRemove] = useState(false);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const viewH = Math.round(VIEW_WIDTH / aspect);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const coverScale = natural ? Math.max(VIEW_WIDTH / natural.w, viewH / natural.h) : 1;

  const clampPan = useCallback(
    (next: { x: number; y: number }, nextZoom: number, size: { w: number; h: number }) => {
      const scale = Math.max(VIEW_WIDTH / size.w, viewH / size.h) * nextZoom;
      const dw = size.w * scale;
      const dh = size.h * scale;
      const maxX = Math.max(0, (dw - VIEW_WIDTH) / 2);
      const maxY = Math.max(0, (dh - viewH) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [viewH],
  );

  useEffect(() => {
    if (natural) setPan((p) => clampPan(p, zoom, natural));
  }, [aspect, zoom, natural, clampPan]);

  useEffect(() => {
    if (!fileUrl || !natural) {
      setDataUrl("");
      return;
    }
    const image = new Image();
    let cancelled = false;
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      const scale = Math.max(VIEW_WIDTH / natural.w, viewH / natural.h) * zoom;
      const outW = Math.min(800, Math.max(1, Math.round((VIEW_WIDTH / scale) * 2)));
      const outH = Math.max(1, Math.round(outW / aspect));
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const sx = (natural.w - VIEW_WIDTH / scale) / 2 - pan.x / scale;
      const sy = (natural.h - viewH / scale) / 2 - pan.y / scale;
      ctx.drawImage(image, sx, sy, VIEW_WIDTH / scale, viewH / scale, 0, 0, canvas.width, canvas.height);
      setDataUrl(canvas.toDataURL("image/jpeg", 0.92));
    };
    image.src = fileUrl;
    return () => {
      cancelled = true;
    };
  }, [fileUrl, natural, zoom, pan, aspect, viewH]);

  function onFile(file: File | undefined) {
    if (!file) return;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRemove(false);
    const image = new Image();
    image.onload = () => setNatural({ w: image.naturalWidth, h: image.naturalHeight });
    image.src = url;
  }

  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">{label}</legend>
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}

      {aspectChoices && aspectChoices.length > 1 && (
        <div className="flex gap-1">
          {aspectChoices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => setAspect(choice.value)}
              className={`rounded border px-2 py-0.5 text-xs ${
                aspect === choice.value
                  ? "border-wp-accent text-wp-accent"
                  : "border-neutral-300 text-neutral-500"
              }`}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => onFile(e.target.files?.[0])}
        className="block w-full text-xs text-neutral-500 file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-neutral-700"
      />

      {fileUrl ? (
        <div
          className="relative mx-auto overflow-hidden bg-neutral-100"
          style={{
            width: VIEW_WIDTH,
            height: viewH,
            borderRadius: round ? "999px" : "8px",
            cursor: "grab",
            touchAction: "none",
          }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
          }}
          onPointerMove={(e) => {
            if (!drag.current || !natural) return;
            const next = {
              x: drag.current.panX + (e.clientX - drag.current.x),
              y: drag.current.panY + (e.clientY - drag.current.y),
            };
            setPan(clampPan(next, zoom, natural));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt=""
            draggable={false}
            className="pointer-events-none max-w-none select-none"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: natural ? natural.w * coverScale * zoom : undefined,
              height: natural ? natural.h * coverScale * zoom : undefined,
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
            }}
          />
        </div>
      ) : currentPreviewUrl && !remove ? (
        <CurrentPreview url={currentPreviewUrl} round={round} />
      ) : (
        <div
          className="mx-auto flex items-center justify-center bg-neutral-50 text-xs text-neutral-400"
          style={{
            width: VIEW_WIDTH,
            height: Math.min(viewH, 120),
            borderRadius: round ? "999px" : "8px",
          }}
        >
          尚未设置
        </div>
      )}

      {fileUrl && (
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          缩放
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-wp-accent"
          />
        </label>
      )}

      {currentPreviewUrl && (
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          <input
            type="checkbox"
            name={removeField}
            value="on"
            checked={remove}
            onChange={(e) => {
              setRemove(e.target.checked);
              if (e.target.checked) {
                if (fileUrl) URL.revokeObjectURL(fileUrl);
                setFileUrl(null);
                setDataUrl("");
              }
            }}
            className="accent-wp-accent"
          />
          移除当前图片
        </label>
      )}

      <input type="hidden" name={dataField} value={dataUrl} />
    </fieldset>
  );
}

function CurrentPreview({ url, round }: { url: string; round?: boolean }) {
  const { src, loading, failed } = useMediaBlob(url);
  if (failed) {
    return <p className="text-xs text-neutral-400">当前图片无法预览</p>;
  }
  if (loading || !src) {
    return <div className="mx-auto h-28 w-28 animate-pulse rounded bg-neutral-100" />;
  }
  return (
    <img
      src={src}
      alt=""
      className={`mx-auto max-h-28 bg-neutral-50 object-contain ${round ? "h-28 w-28 rounded-full object-cover" : "rounded"}`}
    />
  );
}
