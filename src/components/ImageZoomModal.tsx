import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './BenefitIcons';

interface ImageZoomModalProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholderBg: string;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

function getDistance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function ImageZoomModal({
  src,
  alt,
  width,
  height,
  placeholderBg,
  onClose,
}: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const panStartRef = useRef<Point | null>(null);
  const translateStartRef = useRef<Point>({ x: 0, y: 0 });
  const lastTapTimeRef = useRef<number>(0);
  const movedDuringTapRef = useRef<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const clampScale = (value: number) => Math.min(4, Math.max(1, value));

  const toggleDoubleTapZoom = () => {
    if (scale > 1.1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(2.5);
      setTranslate({ x: 0, y: 0 });
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    movedDuringTapRef.current = false;

    const active = Array.from(pointersRef.current.values());
    if (active.length === 2) {
      pinchStartDistRef.current = getDistance(active[0], active[1]);
      pinchStartScaleRef.current = scale;
      panStartRef.current = null;
    } else if (active.length === 1) {
      panStartRef.current = active[0];
      translateStartRef.current = translate;
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const active = Array.from(pointersRef.current.values());
    if (active.length === 2 && pinchStartDistRef.current) {
      movedDuringTapRef.current = true;
      const currentDist = getDistance(active[0], active[1]);
      const nextScale = clampScale(
        pinchStartScaleRef.current * (currentDist / pinchStartDistRef.current)
      );
      setScale(nextScale);
      if (nextScale <= 1.02) {
        setTranslate({ x: 0, y: 0 });
      }
    } else if (active.length === 1 && panStartRef.current && scale > 1.02) {
      const dx = active[0].x - panStartRef.current.x;
      const dy = active[0].y - panStartRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        movedDuringTapRef.current = true;
      }
      const maxOffset = (scale - 1) * 180;
      setTranslate({
        x: Math.max(-maxOffset, Math.min(maxOffset, translateStartRef.current.x + dx)),
        y: Math.max(-maxOffset, Math.min(maxOffset, translateStartRef.current.y + dy)),
      });
    }
  };

  const handlePointerUpOrCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);

    const active = Array.from(pointersRef.current.values());
    if (active.length < 2) {
      pinchStartDistRef.current = null;
    }

    if (active.length === 1) {
      panStartRef.current = active[0];
      translateStartRef.current = translate;
    } else if (active.length === 0) {
      panStartRef.current = null;
      if (!movedDuringTapRef.current) {
        const now = Date.now();
        if (now - lastTapTimeRef.current < 300) {
          toggleDoubleTapZoom();
          lastTapTimeRef.current = 0;
        } else {
          lastTapTimeRef.current = now;
        }
      }
    }
  };

  return (
    <div
      className="zoom-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Просмотр фото: ${alt}`}
    >
      <div className="zoom-topbar">
        <span className="zoom-hint">
          {scale > 1.05 ? `${scale.toFixed(1)}×` : 'Двойное касание или щипок'}
        </span>
        <button
          type="button"
          className="zoom-close-btn"
          onClick={onClose}
          aria-label="Закрыть просмотр фото"
        >
          <CloseIcon />
        </button>
      </div>

      <div
        className="zoom-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          draggable={false}
          className="zoom-image"
          style={{
            backgroundColor: placeholderBg,
            transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}
