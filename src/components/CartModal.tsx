import { useEffect, useRef, useState } from 'react';
import { Bouquet, DELIVERY_AND_PAYMENT, MESSENGERS } from '../data';
import { resolveImageAsset } from '../imageMap';
import {
  ArrowUpRightIcon,
  CloseIcon,
  EmptyBagIllustration,
} from './BenefitIcons';

export interface CartItem {
  bouquet: Bouquet;
  quantity: number;
}

interface CartModalProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onGoToCatalog: () => void;
  onUpdateQuantity: (bouquetId: string, delta: number) => void;
  onRemoveItem: (bouquetId: string) => void;
}

interface CheckoutFormState {
  deliveryType: 'Самовывоз' | 'Доставка';
  customerName: string;
  customerPhone: string;
  address: string;
  addressDetails: string;
  otherRecipient: boolean;
  recipientName: string;
  recipientPhone: string;
  date: string;
  time: string;
  asap: boolean;
  cardText: string;
  comment: string;
  paymentMethod: string;
}

const CHECKOUT_STORAGE_KEY = 'vtsvetakh_checkout_v1';

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getLocalNowTimeHm(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function createDefaultFormState(): CheckoutFormState {
  return {
    deliveryType: 'Самовывоз',
    customerName: '',
    customerPhone: '',
    address: '',
    addressDetails: '',
    otherRecipient: false,
    recipientName: '',
    recipientPhone: '',
    date: getLocalTodayIso(),
    time: '',
    asap: false,
    cardText: '',
    comment: '',
    paymentMethod: DELIVERY_AND_PAYMENT.paymentMethods[0] || 'Картой',
  };
}

function loadCheckoutForm(): CheckoutFormState {
  const fallback = createDefaultFormState();
  try {
    const raw = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    const todayIso = getLocalTodayIso();
    const validDate =
      typeof parsed.date === 'string' && parsed.date >= todayIso
        ? parsed.date
        : todayIso;

    const validPayment = DELIVERY_AND_PAYMENT.paymentMethods.includes(
      parsed.paymentMethod
    )
      ? parsed.paymentMethod
      : fallback.paymentMethod;

    return {
      ...fallback,
      ...parsed,
      deliveryType:
        parsed.deliveryType === 'Доставка' ? 'Доставка' : 'Самовывоз',
      otherRecipient: Boolean(parsed.otherRecipient),
      asap: Boolean(parsed.asap),
      date: validDate,
      paymentMethod: validPayment,
    };
  } catch {
    return fallback;
  }
}

function saveCheckoutForm(form: CheckoutFormState): void {
  try {
    window.localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(form));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatRuPhoneMask(rawValue: string): string {
  if (!rawValue.trim() || rawValue.trim() === '+') return '';
  let digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';
  if (digits === '7' && rawValue.trim().length <= 2) {
    return '';
  }
  if (digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  } else if (!digits.startsWith('7')) {
    digits = `7${digits}`;
  }
  digits = digits.slice(0, 11);

  const rest = digits.slice(1);
  let result = '+7';
  if (rest.length > 0) {
    result += ` (${rest.slice(0, 3)}`;
  }
  if (rest.length >= 3) {
    result += ')';
  }
  if (rest.length > 3) {
    result += ` ${rest.slice(3, 6)}`;
  }
  if (rest.length > 6) {
    result += `-${rest.slice(6, 8)}`;
  }
  if (rest.length > 8) {
    result += `-${rest.slice(8, 10)}`;
  }
  return result;
}

function isValidRuPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('7');
}

function formatDateRu(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
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

export function CartModal({
  isOpen,
  items,
  onClose,
  onGoToCatalog,
  onUpdateQuantity,
  onRemoveItem,
}: CartModalProps) {
  const [form, setForm] = useState<CheckoutFormState>(() =>
    typeof window !== 'undefined' ? loadCheckoutForm() : createDefaultFormState()
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<'form' | 'messengers' | 'ready'>('form');
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [copiedButton, setCopiedButton] = useState(false);
  const [selectedMessenger, setSelectedMessenger] = useState<string | null>(
    null
  );
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    saveCheckoutForm(form);
  }, [form]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const todayIso = getLocalTodayIso();
    setForm((prev) => {
      if (!prev.date || prev.date < todayIso) {
        return { ...prev, date: todayIso };
      }
      return prev;
    });

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
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setCopyNotice(null);
      setCopiedButton(false);
      setSelectedMessenger(null);
      setSubmitted(false);
      setTouched({});
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const todayIso = getLocalTodayIso();
  const nowHm = getLocalNowTimeHm();

  const updateField = <K extends keyof CheckoutFormState>(
    key: K,
    value: CheckoutFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const nameError = !form.customerName.trim() ? 'Укажите имя' : '';
  const phoneError = !isValidRuPhone(form.customerPhone)
    ? 'Введите 10 цифр номера после +7'
    : '';
  const addressError =
    form.deliveryType === 'Доставка' && !form.address.trim()
      ? 'Укажите улицу, дом, кв./офис'
      : '';
  const recipientNameError =
    form.otherRecipient && !form.recipientName.trim()
      ? 'Укажите имя получателя'
      : '';
  const recipientPhoneError =
    form.otherRecipient && !isValidRuPhone(form.recipientPhone)
      ? 'Введите 10 цифр телефона получателя после +7'
      : '';
  const dateError = !form.date
    ? 'Выберите дату'
    : form.date < todayIso
    ? 'Прошедшая дата недоступна'
    : '';
  const isPastTimeToday = Boolean(
    !form.asap && form.date === todayIso && form.time && form.time < nowHm
  );
  const timeError = !form.asap
    ? !form.time
      ? 'Выберите время или отметьте «Как можно скорее»'
      : isPastTimeToday
      ? 'Прошедшее время недоступно для сегодняшней даты'
      : ''
    : '';

  const showError = (field: string, msg: string) =>
    Boolean((submitted || touched[field]) && msg);

  const isFormValid =
    items.length > 0 &&
    !nameError &&
    !phoneError &&
    !addressError &&
    !recipientNameError &&
    !recipientPhoneError &&
    !dateError &&
    !timeError;

  const totalSum = items.reduce(
    (sum, item) => sum + item.bouquet.price * item.quantity,
    0
  );

  const buildOrderText = (): string => {
    const lines = items.map(
      (item, index) =>
        `${index + 1}) ${item.bouquet.name} × ${item.quantity} — ${formatPrice(
          item.bouquet.price * item.quantity
        )} ₽`
    );

    const parts = [
      'Здравствуйте! Хочу оформить заказ:',
      ...lines,
      `Итого: ${formatPrice(totalSum)} ₽`,
      `Получение: ${form.deliveryType}`,
      `Заказчик: ${form.customerName.trim() || '—'}, ${
        form.customerPhone.trim() || '—'
      }`,
    ];

    if (form.deliveryType === 'Доставка') {
      parts.push(`Адрес: ${form.address.trim() || '—'}`);
      if (form.addressDetails.trim()) {
        parts.push(`Подъезд / этаж / домофон: ${form.addressDetails.trim()}`);
      }
    }

    if (form.otherRecipient) {
      parts.push(
        `Получатель: ${form.recipientName.trim() || '—'}, ${
          form.recipientPhone.trim() || '—'
        }`
      );
    }

    if (form.date) {
      parts.push(`Дата: ${formatDateRu(form.date)}`);
    }

    parts.push(
      `Время: ${form.asap ? 'как можно скорее' : form.time || 'не указано'}`
    );
    parts.push(`Способ оплаты: ${form.paymentMethod}`);

    if (form.cardText.trim()) {
      parts.push(`Текст открытки: ${form.cardText.trim()}`);
    }
    if (form.comment.trim()) {
      parts.push(`Комментарий: ${form.comment.trim()}`);
    }

    return parts.join('\n');
  };

  const orderText = buildOrderText();
  const whatsappUrl = `${MESSENGERS.whatsapp}?text=${encodeURIComponent(
    orderText
  )}`;

  const handleCopyOnly = async () => {
    const copied = await copyTextToClipboard(orderText);
    if (copied) {
      setCopiedButton(true);
      setCopyNotice(null);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(
        () => setCopiedButton(false),
        2500
      );
    } else {
      setCopyNotice('Не удалось скопировать автоматически');
    }
  };

  const handleProceedToMessengers = () => {
    setSubmitted(true);
    setTouched({
      customerName: true,
      customerPhone: true,
      address: true,
      recipientName: true,
      recipientPhone: true,
      date: true,
      time: true,
    });
    if (!isFormValid) return;
    setStep('messengers');
  };

  const handleSelectWhatsApp = () => {
    setSelectedMessenger('WhatsApp');
    setCopyNotice(null);
    setCopiedButton(false);
    setStep('ready');
  };

  const handleSelectCopyMessenger = async (name: string) => {
    await copyTextToClipboard(orderText);
    setSelectedMessenger(name);
    setCopyNotice('Текст заказа скопирован в буфер — вставьте его в чат');
    setCopiedButton(false);
    setStep('ready');
  };

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
        className="cart-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-modal-title"
      >
        <div className="cart-header">
          <div>
            <p className="cap-label muted-text">Оформление заказа</p>
            <h2 id="cart-modal-title" className="display-title">
              Корзина
            </h2>
          </div>

          <button
            type="button"
            className="pill-close-btn"
            onClick={onClose}
            aria-label="Закрыть корзину"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <EmptyBagIllustration />
              <p className="body-text">Корзина пуста</p>
              <button
                type="button"
                className="btn-primary"
                onClick={onGoToCatalog}
              >
                <span>Выбрать букет</span>
              </button>
            </div>
          ) : step === 'ready' ? (
            <div className="cart-ready-screen">
              <p className="cap-label notice-accent">Готово</p>
              <h3 className="display-title">Заказ готов</h3>
              <p className="body-text muted-text">
                Откроется мессенджер, отправьте сообщение, и флорист ответит и
                уточнит детали.
              </p>

              {selectedMessenger && copyNotice && (
                <p className="pill-notice" role="status">
                  {copyNotice}
                </p>
              )}

              <div className="cart-ready-preview">
                <pre className="cart-ready-pre">{orderText}</pre>
              </div>

              <div className="cart-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopyOnly}
                >
                  <span>
                    {copiedButton ? 'Скопировано ✓' : 'Скопировать текст'}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn-pill-soft"
                  onClick={() => setStep('messengers')}
                >
                  Выбрать другой мессенджер
                </button>
              </div>
            </div>
          ) : step === 'messengers' ? (
            <div className="cart-messenger-step">
              <div className="cart-step-head">
                <button
                  type="button"
                  className="btn-pill-soft"
                  onClick={() => setStep('form')}
                >
                  Изменить данные
                </button>
                <span className="body-text tabular-price">
                  {formatPrice(totalSum)} ₽
                </span>
              </div>

              <p className="body-text muted-text">
                Выберите мессенджер для отправки заказа флористу:
              </p>

              <div className="cart-messengers-list">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="messenger-pill-row"
                  onClick={handleSelectWhatsApp}
                >
                  <span className="messenger-row-title">WhatsApp</span>
                  <span className="messenger-row-action">
                    <span>Открыть с текстом</span>
                    <ArrowUpRightIcon size={16} />
                  </span>
                </a>

                <a
                  href={MESSENGERS.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="messenger-pill-row"
                  onClick={() => handleSelectCopyMessenger('Telegram')}
                >
                  <span className="messenger-row-title">Telegram</span>
                  <span className="messenger-row-action">
                    <span>Скопировать и открыть</span>
                    <ArrowUpRightIcon size={16} />
                  </span>
                </a>

                <a
                  href={MESSENGERS.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="messenger-pill-row"
                  onClick={() => handleSelectCopyMessenger('ВКонтакте')}
                >
                  <span className="messenger-row-title">ВКонтакте</span>
                  <span className="messenger-row-action">
                    <span>Скопировать и открыть</span>
                    <ArrowUpRightIcon size={16} />
                  </span>
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {items.map(({ bouquet, quantity }) => {
                  const asset = resolveImageAsset(bouquet.image);
                  const showImg =
                    bouquet.image && !failedImages[bouquet.image];
                  return (
                    <div key={bouquet.id} className="cart-item">
                      {showImg && (
                        <img
                          src={asset.src}
                          alt={bouquet.name}
                          width={asset.width}
                          height={asset.height}
                          loading="lazy"
                          decoding="async"
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [bouquet.image]: true,
                            }))
                          }
                          className="cart-item-img"
                          style={{
                            objectPosition: bouquet.focus || 'center 48%',
                          }}
                        />
                      )}

                      <div className="cart-item-info">
                        <div className="cart-item-top">
                          <h3 className="body-text cart-item-name">
                            {bouquet.name}
                          </h3>
                          <button
                            type="button"
                            className="pill-remove-btn"
                            onClick={() => onRemoveItem(bouquet.id)}
                            aria-label={`Удалить «${bouquet.name}»`}
                          >
                            Удалить
                          </button>
                        </div>

                        <div className="cart-item-bottom">
                          <div className="stepper-pill">
                            <button
                              type="button"
                              className="stepper-pill-btn"
                              onClick={() => onUpdateQuantity(bouquet.id, -1)}
                              aria-label="Уменьшить количество"
                            >
                              −
                            </button>
                            <span className="stepper-pill-val">{quantity}</span>
                            <button
                              type="button"
                              className="stepper-pill-btn"
                              onClick={() => onUpdateQuantity(bouquet.id, 1)}
                              aria-label="Увеличить количество"
                            >
                              +
                            </button>
                          </div>

                          <span className="body-text tabular-price">
                            {formatPrice(bouquet.price * quantity)} ₽
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-form">
                <div className="cart-field">
                  <span className="cap-label muted-text">Способ получения</span>
                  <div
                    className="pill-tabs"
                    role="group"
                    aria-label="Способ получения"
                  >
                    <button
                      type="button"
                      className={`pill-tab${
                        form.deliveryType === 'Самовывоз' ? ' is-active' : ''
                      }`}
                      onClick={() => updateField('deliveryType', 'Самовывоз')}
                    >
                      Самовывоз
                    </button>
                    <button
                      type="button"
                      className={`pill-tab${
                        form.deliveryType === 'Доставка' ? ' is-active' : ''
                      }`}
                      onClick={() => updateField('deliveryType', 'Доставка')}
                    >
                      Доставка
                    </button>
                  </div>
                </div>

                <div className="cart-field-row">
                  <label className="cart-field">
                    <span className="cap-label muted-text">Имя *</span>
                    <input
                      type="text"
                      className={`soft-input${
                        showError('customerName', nameError) ? ' is-invalid' : ''
                      }`}
                      placeholder="Ваше имя"
                      value={form.customerName}
                      onBlur={() => markTouched('customerName')}
                      onChange={(e) =>
                        updateField('customerName', e.target.value)
                      }
                    />
                    {showError('customerName', nameError) && (
                      <span className="field-error-text">{nameError}</span>
                    )}
                  </label>

                  <label className="cart-field">
                    <span className="cap-label muted-text">Телефон *</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      className={`soft-input${
                        showError('customerPhone', phoneError)
                          ? ' is-invalid'
                          : ''
                      }`}
                      placeholder="+7 (___) ___-__-__"
                      value={form.customerPhone}
                      onBlur={() => markTouched('customerPhone')}
                      onChange={(e) =>
                        updateField(
                          'customerPhone',
                          formatRuPhoneMask(e.target.value)
                        )
                      }
                    />
                    {showError('customerPhone', phoneError) && (
                      <span className="field-error-text">{phoneError}</span>
                    )}
                  </label>
                </div>

                {form.deliveryType === 'Доставка' && (
                  <>
                    <label className="cart-field">
                      <span className="cap-label muted-text">
                        Адрес (улица, дом, кв./офис) *
                      </span>
                      <input
                        type="text"
                        className={`soft-input${
                          showError('address', addressError) ? ' is-invalid' : ''
                        }`}
                        placeholder="Уфа, ул. Энтузиастов, 15, кв. 12"
                        value={form.address}
                        onBlur={() => markTouched('address')}
                        onChange={(e) => updateField('address', e.target.value)}
                      />
                      {showError('address', addressError) && (
                        <span className="field-error-text">{addressError}</span>
                      )}
                    </label>

                    <label className="cart-field">
                      <span className="cap-label muted-text">
                        Подъезд / этаж / домофон
                      </span>
                      <input
                        type="text"
                        className="soft-input"
                        placeholder="Подъезд 2, этаж 4, домофон 12"
                        value={form.addressDetails}
                        onChange={(e) =>
                          updateField('addressDetails', e.target.value)
                        }
                      />
                    </label>
                  </>
                )}

                <label className="cart-checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.otherRecipient}
                    onChange={(e) =>
                      updateField('otherRecipient', e.target.checked)
                    }
                  />
                  <span className="body-text">Получатель другой человек</span>
                </label>

                {form.otherRecipient && (
                  <div className="cart-field-row">
                    <label className="cart-field">
                      <span className="cap-label muted-text">
                        Имя получателя *
                      </span>
                      <input
                        type="text"
                        className={`soft-input${
                          showError('recipientName', recipientNameError)
                            ? ' is-invalid'
                            : ''
                        }`}
                        placeholder="Имя получателя"
                        value={form.recipientName}
                        onBlur={() => markTouched('recipientName')}
                        onChange={(e) =>
                          updateField('recipientName', e.target.value)
                        }
                      />
                      {showError('recipientName', recipientNameError) && (
                        <span className="field-error-text">
                          {recipientNameError}
                        </span>
                      )}
                    </label>

                    <label className="cart-field">
                      <span className="cap-label muted-text">
                        Телефон получателя *
                      </span>
                      <input
                        type="tel"
                        inputMode="tel"
                        className={`soft-input${
                          showError('recipientPhone', recipientPhoneError)
                            ? ' is-invalid'
                            : ''
                        }`}
                        placeholder="+7 (___) ___-__-__"
                        value={form.recipientPhone}
                        onBlur={() => markTouched('recipientPhone')}
                        onChange={(e) =>
                          updateField(
                            'recipientPhone',
                            formatRuPhoneMask(e.target.value)
                          )
                        }
                      />
                      {showError('recipientPhone', recipientPhoneError) && (
                        <span className="field-error-text">
                          {recipientPhoneError}
                        </span>
                      )}
                    </label>
                  </div>
                )}

                <label className="cart-field">
                  <span className="cap-label muted-text">Дата *</span>
                  <input
                    type="date"
                    min={todayIso}
                    className={`soft-input${
                      showError('date', dateError) ? ' is-invalid' : ''
                    }`}
                    value={form.date}
                    onBlur={() => markTouched('date')}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateField('date', val && val < todayIso ? todayIso : val);
                    }}
                  />
                  {showError('date', dateError) && (
                    <span className="field-error-text">{dateError}</span>
                  )}
                </label>

                <div className="cart-field">
                  <span className="cap-label muted-text">Время *</span>
                  <input
                    type="time"
                    disabled={form.asap}
                    min={form.date === todayIso ? nowHm : undefined}
                    aria-label="Время получения"
                    className={`soft-input${
                      showError('time', timeError) ? ' is-invalid' : ''
                    }`}
                    value={form.time}
                    onBlur={() => markTouched('time')}
                    onChange={(e) => updateField('time', e.target.value)}
                  />
                  <label className="cart-checkbox-row cart-checkbox-compact">
                    <input
                      type="checkbox"
                      checked={form.asap}
                      onChange={(e) => updateField('asap', e.target.checked)}
                    />
                    <span className="body-text">Как можно скорее</span>
                  </label>
                  {showError('time', timeError) && (
                    <span className="field-error-text">{timeError}</span>
                  )}
                </div>

                <div className="cart-field">
                  <span className="cap-label muted-text">Способ оплаты</span>
                  <div
                    className="pill-tabs"
                    role="radiogroup"
                    aria-label="Способ оплаты"
                  >
                    {DELIVERY_AND_PAYMENT.paymentMethods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        role="radio"
                        aria-checked={form.paymentMethod === method}
                        className={`pill-tab${
                          form.paymentMethod === method ? ' is-active' : ''
                        }`}
                        onClick={() => updateField('paymentMethod', method)}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="cart-field">
                  <span className="cap-label muted-text">Текст открытки</span>
                  <input
                    type="text"
                    className="soft-input"
                    placeholder="Пожелания для открытки"
                    value={form.cardText}
                    onChange={(e) => updateField('cardText', e.target.value)}
                  />
                </label>

                <label className="cart-field">
                  <span className="cap-label muted-text">Комментарий</span>
                  <input
                    type="text"
                    className="soft-input"
                    placeholder="Пожелания к заказу"
                    value={form.comment}
                    onChange={(e) => updateField('comment', e.target.value)}
                  />
                </label>
              </div>

              <div className="cart-summary">
                <div className="cart-summary-top">
                  <span className="body-text">Итого</span>
                  <span className="body-text tabular-price cart-summary-sum">
                    {formatPrice(totalSum)} ₽
                  </span>
                </div>
                <p className="cart-summary-note">
                  Стоимость доставки и время подтвердит флорист
                </p>
              </div>

              {copyNotice && (
                <p className="pill-notice" role="status">
                  {copyNotice}
                </p>
              )}

              <div className="cart-actions">
                <button
                  type="button"
                  className="btn-primary cart-submit-btn"
                  onClick={handleProceedToMessengers}
                >
                  <span>Отправить заказ</span>
                </button>

                <button
                  type="button"
                  className="btn-pill-soft"
                  onClick={handleCopyOnly}
                >
                  {copiedButton ? 'Скопировано ✓' : 'Скопировать текст'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
