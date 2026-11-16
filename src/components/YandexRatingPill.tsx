import { useEffect, useRef, useState } from 'react';
import { SHOP_INFO } from '../data';
import { ArrowUpRightIcon, MapPinIcon, StarIcon } from './BenefitIcons';

interface YandexRatingPillProps {
  variant?: 'hero' | 'card';
}

export function YandexRatingPill({ variant = 'card' }: YandexRatingPillProps) {
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [ratingVal, setRatingVal] = useState(4.9);

  useEffect(() => {
    const el = linkRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setEntered(true);
      setRatingVal(4.9);
      return;
    }

    let rafId = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        setEntered(true);

        const duration = 850;
        const start = performance.now();

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setRatingVal(Number((4.9 * eased).toFixed(1)));
          if (t < 1) {
            rafId = window.requestAnimationFrame(tick);
          } else {
            setRatingVal(4.9);
          }
        };

        setRatingVal(0);
        rafId = window.requestAnimationFrame(tick);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const formattedRating = ratingVal.toFixed(1).replace('.', ',');

  return (
    <a
      ref={linkRef}
      href={SHOP_INFO.mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`yandex-rating-pill yandex-rating-pill-${variant}${
        entered ? ' is-entered' : ''
      }`}
      aria-label="Мы на Яндекс Картах, рейтинг 4,9 — открыть на карте"
    >
      <span className="yandex-pin" aria-hidden="true">
        <span className="yandex-pin-ring" />
        <MapPinIcon />
      </span>

      <span className="yandex-rating-text">МЫ НА ЯНДЕКС КАРТАХ ·</span>

      <span className="yandex-star-single" aria-hidden="true">
        <StarIcon />
      </span>

      <span className="yandex-rating-score tabular-price">
        {formattedRating}
      </span>

      <span className="yandex-arrow" aria-hidden="true">
        <ArrowUpRightIcon size={14} />
      </span>
    </a>
  );
}
