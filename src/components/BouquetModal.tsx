import { useEffect, useRef, useState } from 'react';
import { Bouquet } from '../data';
import { resolveImageAsset } from '../imageMap';
import { CloseIcon, ShareIcon } from './BenefitIcons';
import { ImageZoomModal } from './ImageZoomModal';

interface BouquetModalProps {
  bouquet: Bouquet | null;
  onClose: () => void;
  onAddToCart: (bouquet: Bouquet, quantity: number) => void;
  onOrderNow: (bouquet: Bouquet, quantity: number) => void;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

async function copyShareUrl(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function BouquetModal({
  bouquet,
  onClose,
  onAddToCart,
  onOrderNow,
}: BouquetModalProps) {
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  const [shareCopied, setShareCopied] = useState(false);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setQuantity(1);
    setZoomSrc(null);
    setImgFailed({});
    setShareCopied(false);
  }, [bouquet?.id]);

  useEffect(() => {
    if (!bouquet) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !zoomSrc) {
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
  }, [bouquet, zoomSrc, onClose]);

  if (!bouquet) {
    return null;
  }

  const rawImages =
    bouquet.images && bouquet.images.length > 0
      ? bouquet.images
      : bouquet.image
      ? [bouquet.image]
      : [];

  const resolvedPhotos = rawImages
    .filter((raw) => raw && !imgFailed[raw])
    .map((raw) => ({
      raw,
      asset: resolveImageAsset(raw),
    }));

  const hasGallery = resolvedPhotos.length > 1;
  const zoomedAsset = zoomSrc ? resolveImageAsset(zoomSrc) : null;
  const objectPosition = bouquet.focus || 'center 48%';

  const handleGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex && idx >= 0 && idx < resolvedPhotos.length) {
      setActiveIndex(idx);
    }
  };

  const scrollToSlide = (idx: number) => {
    const el = galleryRef.current;
    setActiveIndex(idx);
    if (el) {
      el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
    }
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('bouquet', bouquet.id);
    shareUrl.hash = '';
    const copied = await copyShareUrl(shareUrl.toString());
    if (copied) {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2400);
    }
  };

  return (
    <>
      <div
        className="sheet-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bouquet-sheet-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bouquet-sheet">
          <div className="bouquet-sheet-topbar">
            <span className="cap-label muted-text">
              {bouquet.category || 'Букет'}
            </span>
            <div className="bouquet-topbar-actions">
              <button
                type="button"
                className="btn-pill-soft"
                onClick={handleShare}
                aria-label="Поделиться ссылкой на букет"
              >
                <ShareIcon />
                <span>Поделиться</span>
              </button>
              <button
                type="button"
                className="pill-close-btn"
                onClick={onClose}
                aria-label="Закрыть карточку букета"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {shareCopied && (
            <div className="bouquet-share-notice" role="status">
              <span className="pill-notice">Ссылка скопирована</span>
            </div>
          )}

          <div className="bouquet-sheet-content">
            <div className="bouquet-sheet-media-col">
              {hasGallery ? (
                <>
                  <div
                    ref={galleryRef}
                    className="bouquet-sheet-gallery"
                    aria-label="Галерея букета"
                    onScroll={handleGalleryScroll}
                  >
                    {resolvedPhotos.map(({ raw, asset }, idx) => (
                      <button
                        key={`${raw}-${idx}`}
                        type="button"
                        className="bouquet-sheet-slide"
                        style={{ backgroundColor: asset.placeholderBg }}
                        onClick={() => setZoomSrc(raw)}
                        aria-label={`Увеличить фото ${idx + 1} из ${resolvedPhotos.length}`}
                      >
                        <img
                          src={asset.src}
                          alt={`Букет «${bouquet.name}» — фото ${idx + 1}`}
                          width={asset.width}
                          height={asset.height}
                          loading="lazy"
                          decoding="async"
                          onError={() =>
                            setImgFailed((prev) => ({ ...prev, [raw]: true }))
                          }
                          style={{ objectPosition }}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="gallery-dots" role="tablist" aria-label="Слайды">
                    {resolvedPhotos.map(({ raw }, idx) => (
                      <button
                        key={`dot-${raw}-${idx}`}
                        type="button"
                        role="tab"
                        aria-selected={idx === activeIndex}
                        aria-label={`Фото ${idx + 1}`}
                        className={`gallery-dot${
                          idx === activeIndex ? ' is-active' : ''
                        }`}
                        onClick={() => scrollToSlide(idx)}
                      />
                    ))}
                  </div>
                </>
              ) : resolvedPhotos[0] ? (
                <button
                  type="button"
                  className="bouquet-sheet-slide"
                  style={{ backgroundColor: resolvedPhotos[0].asset.placeholderBg }}
                  onClick={() => setZoomSrc(resolvedPhotos[0].raw)}
                  aria-label={`Увеличить фото ${bouquet.name}`}
                >
                  <img
                    src={resolvedPhotos[0].asset.src}
                    alt={`Букет «${bouquet.name}»`}
                    width={resolvedPhotos[0].asset.width}
                    height={resolvedPhotos[0].asset.height}
                    loading="lazy"
                    decoding="async"
                    onError={() =>
                      setImgFailed((prev) => ({
                        ...prev,
                        [resolvedPhotos[0].raw]: true,
                      }))
                    }
                    style={{ objectPosition }}
                  />
                </button>
              ) : null}
            </div>

            <div className="bouquet-sheet-info">
              <h2 id="bouquet-sheet-title" className="display-title">
                {bouquet.name}
              </h2>

              <p className="body-text muted-text">{bouquet.composition}</p>

              <div className="bouquet-meta-rows">
                <div className="bouquet-meta-row">
                  <span className="body-text muted-text">Цена за букет</span>
                  <span className="body-text tabular-price">
                    {bouquet.priceFormatted} ₽
                  </span>
                </div>

                <div className="bouquet-meta-row">
                  <span className="body-text muted-text">Количество</span>
                  <div className="stepper-pill">
                    <button
                      type="button"
                      className="stepper-pill-btn"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Уменьшить количество"
                    >
                      −
                    </button>
                    <span className="stepper-pill-val">{quantity}</span>
                    <button
                      type="button"
                      className="stepper-pill-btn"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Увеличить количество"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bouquet-meta-row bouquet-total-row">
                  <span className="body-text">Итого</span>
                  <span className="body-text tabular-price bouquet-total-price">
                    {formatPrice(bouquet.price * quantity)} ₽
                  </span>
                </div>
              </div>

              <div className="bouquet-modal-actions">
                <button
                  type="button"
                  className="btn-primary bouquet-action-btn"
                  onClick={() => onOrderNow(bouquet, quantity)}
                >
                  <span>Заказать этот букет</span>
                </button>
                <button
                  type="button"
                  className="btn-pill-soft bouquet-action-btn"
                  onClick={() => {
                    onAddToCart(bouquet, quantity);
                    onClose();
                  }}
                >
                  <span>В корзину</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {zoomedAsset && (
        <ImageZoomModal
          src={zoomedAsset.src}
          alt={`Букет «${bouquet.name}»`}
          width={zoomedAsset.width}
          height={zoomedAsset.height}
          placeholderBg={zoomedAsset.placeholderBg}
          onClose={() => setZoomSrc(null)}
        />
      )}
    </>
  );
}
