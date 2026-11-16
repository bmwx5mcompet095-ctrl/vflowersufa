import { useEffect } from 'react';
import { Bouquet, MESSENGERS, buildWhatsAppOrderUrl } from '../data';
import { ArrowUpRightIcon } from './BenefitIcons';

interface OrderModalProps {
  isOpen: boolean;
  bouquet: Bouquet | null;
  contextTitle?: string;
  onClose: () => void;
}

export function OrderModal({
  isOpen,
  bouquet,
  contextTitle,
  onClose,
}: OrderModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const whatsappUrl = buildWhatsAppOrderUrl(bouquet);
  const title = bouquet
    ? `Букет «${bouquet.name}»`
    : contextTitle || 'Написать флористу';
  const subtitle = bouquet
    ? `${bouquet.composition} · ${bouquet.priceFormatted} ₽`
    : 'Выберите удобный мессенджер';

  return (
    <div
      className="sheet-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
      >
        <div className="modal-dialog-head">
          <div>
            <p className="cap-label muted-text">Мессенджер</p>
            <h2 id="order-modal-title" className="display-title">
              {title}
            </h2>
            <p className="body-text muted-text">{subtitle}</p>
          </div>
          <button
            type="button"
            className="pill-close-btn"
            onClick={onClose}
            aria-label="Закрыть окно"
          >
            Закрыть
          </button>
        </div>

        <div className="cart-messengers-list">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="messenger-pill-row"
          >
            <span className="messenger-row-title">WhatsApp</span>
            <span className="messenger-row-action">
              <span>Написать</span>
              <ArrowUpRightIcon size={16} />
            </span>
          </a>
          <a
            href={MESSENGERS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="messenger-pill-row"
          >
            <span className="messenger-row-title">Telegram</span>
            <span className="messenger-row-action">
              <span>Написать</span>
              <ArrowUpRightIcon size={16} />
            </span>
          </a>
          <a
            href={MESSENGERS.vk}
            target="_blank"
            rel="noopener noreferrer"
            className="messenger-pill-row"
          >
            <span className="messenger-row-title">ВКонтакте</span>
            <span className="messenger-row-action">
              <span>Написать</span>
              <ArrowUpRightIcon size={16} />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
