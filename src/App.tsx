import { CSSProperties, useEffect, useRef, useState } from 'react';
import {
  ABOUT_FACTS,
  BOUQUETS,
  Bouquet,
  DELIVERY_AND_PAYMENT,
  MESSENGERS,
  SHOP_INFO,
} from './data';
import {
  GALLERY_WORK_IMAGES,
  GalleryWorkItem,
  resolveImageAsset,
} from './imageMap';
import { BouquetModal } from './components/BouquetModal';
import { CartItem, CartModal } from './components/CartModal';
import { ImageZoomModal } from './components/ImageZoomModal';
import {
  ArrowUpRightIcon,
  CartBagIcon,
  CloseIcon,
  PlusIcon,
} from './components/BenefitIcons';
import { YandexRatingPill } from './components/YandexRatingPill';

const CART_STORAGE_KEY = 'vtsvetakh_cart_v1';

const MENU_LINKS = [
  { href: '#catalog', label: 'Каталог' },
  { href: '#benefits', label: 'Почему мы' },
  { href: '#how-to-order', label: 'Как заказать' },
  { href: '#about', label: 'О магазине' },
  { href: '#works', label: 'Работы' },
  { href: '#faq', label: 'Вопросы' },
  { href: '#contacts', label: 'Контакты' },
];

const HERO_TITLE = 'Букет, который хочется подарить';
const HERO_SUBTITLE =
  'Соберём по вашему поводу и бюджету. Пришлём фото готового букета перед выдачей';

const BENEFITS = [
  {
    title: 'Подбор под повод',
    text: 'Расскажите, кому и по какому поводу. Предложим варианты под ваш бюджет',
  },
  {
    title: 'Фото перед выдачей',
    text: 'Покажем готовый букет до выдачи, чтобы вы были уверены в выборе',
  },
  {
    title: 'Аккуратная упаковка',
    text: 'Упакуем так, чтобы букет красиво дошёл до получателя',
  },
  {
    title: 'Заказ без звонков',
    text: 'Выберите букет, укажите дату и время. Заказ придёт нам в мессенджер',
  },
];

const ORDER_STEPS = [
  '1. Выберите букет',
  '2. Укажите адрес, дату и время',
  '3. Отправьте заказ в мессенджер, флорист подтвердит детали',
];

const FAQ_ITEMS = [
  {
    q: 'Есть ли доставка и сколько она стоит?',
    a: 'Доставка есть, её стоимость и удобное время уточняются флористом в чате.',
  },
  {
    q: 'Можно ли добавить открытку?',
    a: 'Да, можно добавить открытку с вашим текстом — укажите пожелание при оформлении заказа.',
  },
  {
    q: 'Можно ли собрать букет по своему бюджету?',
    a: 'Да, напишите повод и комфортный бюджет — флорист предложит подходящие варианты.',
  },
  {
    q: 'Есть ли подарочная упаковка?',
    a: 'Да, подарочная упаковка есть — оформим букет аккуратно и со вкусом.',
  },
  {
    q: 'Есть ли парковка и свадебная флористика?',
    a: 'Уточните у флориста в чате.',
  },
  {
    q: 'Какие способы оплаты доступны?',
    a: `Самовывоз по адресу: ${SHOP_INFO.address}. Оплата: ${DELIVERY_AND_PAYMENT.paymentMethods.join(', ')}.`,
  },
];

const ALL_CATEGORIES = ['Все', 'Букеты', 'Корзины'] as const;

const highPriorityImgProps = {
  fetchpriority: 'high',
} as unknown as React.ImgHTMLAttributes<HTMLImageElement>;

function loadStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const byId = new Map(BOUQUETS.map((b) => [b.id, b]));
    return parsed
      .map((entry: { id?: string; quantity?: number }) => {
        const bouquet = entry?.id ? byId.get(entry.id) : undefined;
        const quantity =
          typeof entry?.quantity === 'number' && entry.quantity > 0
            ? Math.floor(entry.quantity)
            : 0;
        if (!bouquet || quantity <= 0) return null;
        return { bouquet, quantity };
      })
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

function saveStoredCart(items: CartItem[]): void {
  try {
    const payload = items.map((item) => ({
      id: item.bouquet.id,
      quantity: item.quantity,
    }));
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Все');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [failedBouquetIds, setFailedBouquetIds] = useState<
    Record<string, boolean>
  >({});
  const [failedWorkIds, setFailedWorkIds] = useState<Record<string, boolean>>(
    {}
  );
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    typeof window !== 'undefined' ? loadStoredCart() : []
  );
  const [cartOpen, setCartOpen] = useState(false);

  const [bagPulse, setBagPulse] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const bagTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [detailBouquet, setDetailBouquet] = useState<Bouquet | null>(null);
  const [zoomedWork, setZoomedWork] = useState<GalleryWorkItem | null>(null);

  const heroAsset = resolveImageAsset(SHOP_INFO.heroImage);

  const bouquetsWithPhotos = BOUQUETS.filter(
    (item) => item.image.trim().length > 0 && !failedBouquetIds[item.id]
  );

  // Hide empty categories dynamically
  const visibleCategories = ALL_CATEGORIES.filter((category) => {
    if (category === 'Все') return true;
    return bouquetsWithPhotos.some((item) => item.category === category);
  });

  const effectiveCategory = visibleCategories.includes(
    activeCategory as (typeof ALL_CATEGORIES)[number]
  )
    ? activeCategory
    : 'Все';

  const filteredBouquets = bouquetsWithPhotos.filter((item) =>
    effectiveCategory === 'Все' ? true : item.category === effectiveCategory
  );

  const visibleWorks = GALLERY_WORK_IMAGES.filter(
    (item) => item.src.trim().length > 0 && !failedWorkIds[item.id]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSum = cartItems.reduce(
    (sum, item) => sum + item.bouquet.price * item.quantity,
    0
  );

  // Open shared ?bouquet=<id> link automatically on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('bouquet');
    if (sharedId) {
      const found = BOUQUETS.find((b) => b.id === sharedId);
      if (found) {
        setDetailBouquet(found);
      }
    }
  }, []);

  useEffect(() => {
    saveStoredCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    return () => {
      if (bagTimerRef.current) window.clearTimeout(bagTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
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
  }, [menuOpen]);

  // Single IntersectionObserver for all scroll-revealed headings, captions, photos, and cards
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.reveal'));
    if (elements.length === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [effectiveCategory, filteredBouquets.length]);

  const triggerCartFeedback = () => {
    setBagPulse(false);
    window.requestAnimationFrame(() => {
      setBagPulse(true);
    });
    if (bagTimerRef.current) window.clearTimeout(bagTimerRef.current);
    bagTimerRef.current = window.setTimeout(() => setBagPulse(false), 480);

    setToastVisible(true);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastVisible(false), 2000);
  };

  const addToCart = (bouquet: Bouquet, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.bouquet.id === bouquet.id);
      if (existing) {
        return prev.map((item) =>
          item.bouquet.id === bouquet.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { bouquet, quantity: qty }];
    });
    triggerCartFeedback();
  };

  const updateCartQuantity = (bouquetId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.bouquet.id === bouquetId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
    if (delta > 0) {
      triggerCartFeedback();
    }
  };

  const removeFromCart = (bouquetId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.bouquet.id !== bouquetId)
    );
  };

  const getCartQuantity = (bouquetId: string): number =>
    cartItems.find((item) => item.bouquet.id === bouquetId)?.quantity ?? 0;

  const handleGoToCatalog = () => {
    setCartOpen(false);
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderNow = (bouquet: Bouquet, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.bouquet.id === bouquet.id);
      if (existing) {
        return prev.map((item) =>
          item.bouquet.id === bouquet.id
            ? { ...item, quantity: Math.max(item.quantity, qty) }
            : item
        );
      }
      return [...prev, { bouquet, quantity: qty }];
    });
    setDetailBouquet(null);
    setCartOpen(true);
  };

  const titleWords = HERO_TITLE.split(' ');
  const aboutFactsDisplay = ABOUT_FACTS;

  return (
    <div className={cartCount > 0 ? 'page-shell has-sticky-cart' : 'page-shell'}>
      <header className="floating-header-wrap">
        <div className="floating-header">
          <a href="#top" className="brand-wordmark">
            {SHOP_INFO.name}
          </a>

          <div className="header-actions">
            <button
              type="button"
              className="header-menu-btn"
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              Меню
            </button>

            <button
              type="button"
              className={`header-bag-btn${bagPulse ? ' is-bouncing' : ''}`}
              aria-label={`Корзина (${cartCount})`}
              onClick={() => setCartOpen(true)}
            >
              <CartBagIcon />
              {cartCount > 0 && (
                <span key={cartCount} className="cart-badge">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Навигация по сайту"
        >
          <div className="menu-overlay-top">
            <span className="brand-wordmark">{SHOP_INFO.name}</span>
            <button
              type="button"
              className="pill-close-btn"
              aria-label="Закрыть меню"
              onClick={() => setMenuOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="menu-overlay-body" aria-label="Разделы сайта">
            {MENU_LINKS.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className="menu-overlay-link"
                style={{ '--item-index': index } as CSSProperties}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="menu-overlay-footer">
            <div className="menu-footer-contacts">
              <a href={SHOP_INFO.phoneHref} className="menu-footer-phone">
                {SHOP_INFO.phone}
              </a>
              <span className="body-text muted-text">{SHOP_INFO.address}</span>
            </div>

            <div className="menu-footer-messengers">
              <a
                href={MESSENGERS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="messenger-text-link"
              >
                <span>WhatsApp</span>
                <ArrowUpRightIcon size={16} />
              </a>
              <a
                href={MESSENGERS.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="messenger-text-link"
              >
                <span>Telegram</span>
                <ArrowUpRightIcon size={16} />
              </a>
              <a
                href={MESSENGERS.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="messenger-text-link"
              >
                <span>ВКонтакте</span>
                <ArrowUpRightIcon size={16} />
              </a>
            </div>
          </div>
        </div>
      )}

      <main id="top" className="main-container">
        {/* 1. Hero */}
        <section className="hero-section">
          <div
            className="hero-card"
            style={{ backgroundColor: heroAsset.placeholderBg }}
          >
            {SHOP_INFO.heroImage && !heroImgFailed && (
              <img
                src={heroAsset.src}
                alt={`${SHOP_INFO.name} — авторский букет`}
                width={heroAsset.width}
                height={heroAsset.height}
                decoding="async"
                onError={() => setHeroImgFailed(true)}
                className="hero-card-img"
                style={{ objectPosition: SHOP_INFO.heroFocus }}
                {...highPriorityImgProps}
              />
            )}
            <div className="hero-scrim" aria-hidden="true" />

            <div className="hero-top-badge">
              <YandexRatingPill variant="hero" />
            </div>

            <div className="hero-card-content">
              <h1 className="display-title hero-title">
                {titleWords.map((word, idx) => (
                  <span key={`${word}-${idx}`} className="word-mask">
                    <span
                      className="word-rise"
                      style={{ '--word-index': idx } as CSSProperties}
                    >
                      {word}
                      {idx < titleWords.length - 1 ? '\u00A0' : ''}
                    </span>
                  </span>
                ))}
              </h1>

              <p className="body-text hero-subtitle hero-seq-1">
                {HERO_SUBTITLE}
              </p>

              <a href="#catalog" className="btn-primary hero-cta hero-seq-2">
                <span>Выбрать букет</span>
              </a>
            </div>
          </div>
        </section>

        {/* 2. Catalog */}
        <section id="catalog" className="section-block">
          <div className="section-head">
            <h2 className="display-title reveal reveal-heading">
              <span className="line-mask">
                <span className="line-rise">Каталог</span>
              </span>
            </h2>
          </div>

          <div
            className="pill-tabs catalog-tabs reveal reveal-text"
            role="tablist"
            aria-label="Категории каталога"
          >
            {visibleCategories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={effectiveCategory === category}
                className={`pill-tab${
                  effectiveCategory === category ? ' is-active' : ''
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="catalog-grid">
            {filteredBouquets.map((bouquet, idx) => {
              const asset = resolveImageAsset(bouquet.image);
              const qty = getCartQuantity(bouquet.id);

              return (
                <article
                  key={bouquet.id}
                  className="bouquet-card reveal reveal-card"
                  style={
                    {
                      '--reveal-delay': `${idx * 60}ms`,
                    } as CSSProperties
                  }
                >
                  <div className="bouquet-media-wrap">
                    <button
                      type="button"
                      className="bouquet-media-btn"
                      style={{ backgroundColor: asset.placeholderBg }}
                      onClick={() => setDetailBouquet(bouquet)}
                      aria-label={`Открыть букет «${bouquet.name}»`}
                    >
                      <img
                        src={asset.src}
                        alt={`Букет «${bouquet.name}»`}
                        width={asset.width}
                        height={asset.height}
                        loading="lazy"
                        decoding="async"
                        onError={() =>
                          setFailedBouquetIds((prev) => ({
                            ...prev,
                            [bouquet.id]: true,
                          }))
                        }
                        style={{
                          objectPosition: bouquet.focus || 'center 48%',
                        }}
                      />
                    </button>

                    <div className="bouquet-photo-control">
                      {qty === 0 ? (
                        <button
                          type="button"
                          className="card-add-circle"
                          onClick={() => addToCart(bouquet, 1)}
                          aria-label={`Добавить «${bouquet.name}» в корзину`}
                        >
                          <PlusIcon />
                        </button>
                      ) : (
                        <div className="card-stepper-pill">
                          <button
                            type="button"
                            className="card-stepper-btn"
                            onClick={() => updateCartQuantity(bouquet.id, -1)}
                            aria-label="Уменьшить количество"
                          >
                            −
                          </button>
                          <span className="card-stepper-val">{qty}</span>
                          <button
                            type="button"
                            className="card-stepper-btn"
                            onClick={() => updateCartQuantity(bouquet.id, 1)}
                            aria-label="Увеличить количество"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="bouquet-info-btn"
                    onClick={() => setDetailBouquet(bouquet)}
                  >
                    <h3 className="bouquet-name">{bouquet.name}</h3>
                    <p className="bouquet-composition">{bouquet.composition}</p>
                    <span className="bouquet-price tabular-price">
                      {bouquet.priceFormatted} ₽
                    </span>
                    <span className="bouquet-price-note">
                      Цены ориентировочные, актуальные уточнит флорист
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* 2b. Why Choose Us */}
        <section id="benefits" className="section-block">
          <div className="section-head">
            <h2 className="display-title reveal reveal-heading">
              <span className="line-mask">
                <span className="line-rise">Почему выбирают нас</span>
              </span>
            </h2>
          </div>

          <div className="benefits-grid">
            {BENEFITS.map((item, idx) => (
              <article
                key={item.title}
                className="benefit-card reveal reveal-card"
                style={
                  {
                    '--reveal-delay': `${idx * 55}ms`,
                  } as CSSProperties
                }
              >
                <h3 className="benefit-title">{item.title}</h3>
                <p className="body-text muted-text">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 2c. How to Order */}
        <section id="how-to-order" className="section-block">
          <div className="white-card-block reveal reveal-text">
            <h2 className="display-title reveal reveal-heading">
              <span className="line-mask">
                <span className="line-rise">Как заказать</span>
              </span>
            </h2>

            <ol className="steps-list">
              {ORDER_STEPS.map((stepText, idx) => (
                <li
                  key={stepText}
                  className="step-item body-text reveal reveal-text"
                  style={
                    {
                      '--reveal-delay': `${idx * 55}ms`,
                    } as CSSProperties
                  }
                >
                  {stepText}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3. About */}
        <section id="about" className="section-block">
          <div className="white-card-block reveal reveal-text">
            <h2 className="display-title reveal reveal-heading">
              <span className="line-mask">
                <span className="line-rise">О магазине</span>
              </span>
            </h2>
            <p className="body-text muted-text about-lead reveal reveal-text">
              Цветочная мастерская «В Цветах» в Уфе — авторские букеты и
              композиции на заказ с быстрым согласованием в мессенджере.
            </p>

            <div className="about-rating-wrap reveal reveal-text">
              <YandexRatingPill variant="card" />
            </div>

            <ul className="about-facts-list">
              {aboutFactsDisplay.map((fact, idx) => (
                <li
                  key={fact}
                  className="about-fact-item body-text reveal reveal-text"
                  style={
                    {
                      '--reveal-delay': `${idx * 55}ms`,
                    } as CSSProperties
                  }
                >
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. Works */}
        {visibleWorks.length > 0 && (
          <section id="works" className="section-block">
            <div className="section-head">
              <h2 className="display-title reveal reveal-heading">
                <span className="line-mask">
                  <span className="line-rise">Работы</span>
                </span>
              </h2>
            </div>

            <div className="works-mosaic">
              {visibleWorks.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={`work-tile work-tile-${item.variant} reveal reveal-photo`}
                  style={
                    {
                      backgroundColor: item.placeholderBg,
                      '--reveal-delay': `${idx * 60}ms`,
                    } as CSSProperties
                  }
                  onClick={() => setZoomedWork(item)}
                  aria-label={`Открыть фото: ${item.alt}`}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    loading="lazy"
                    decoding="async"
                    onError={() =>
                      setFailedWorkIds((prev) => ({
                        ...prev,
                        [item.id]: true,
                      }))
                    }
                    style={{ objectPosition: item.focus }}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 5. FAQ */}
        <section id="faq" className="section-block">
          <div className="white-card-block reveal reveal-text">
            <h2 className="display-title reveal reveal-heading">
              <span className="line-mask">
                <span className="line-rise">Частые вопросы</span>
              </span>
            </h2>

            <div className="faq-list">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.q}
                    className={`faq-item${isOpen ? ' is-open' : ''}`}
                  >
                    <button
                      type="button"
                      className="faq-trigger body-text"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    >
                      <span>{item.q}</span>
                      <span
                        className={`faq-plus-icon${isOpen ? ' is-open' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      className={`faq-collapse${isOpen ? ' is-open' : ''}`}
                      aria-hidden={!isOpen}
                    >
                      <div className="faq-collapse-inner">
                        <p className="body-text muted-text faq-answer-text">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5b. Custom Order CTA */}
        <section id="custom-order" className="section-block">
          <div className="white-card-block reveal reveal-text">
            <h2 className="display-title custom-cta-title reveal reveal-heading">
              <span className="line-mask">
                <span className="line-rise">
                  Не нашли нужный букет? Напишите, соберём под ваш повод и бюджет
                </span>
              </span>
            </h2>

            <div className="custom-cta-actions">
              <a
                href={MESSENGERS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary custom-cta-btn"
              >
                <span>WhatsApp</span>
                <ArrowUpRightIcon size={16} />
              </a>
              <a
                href={MESSENGERS.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-soft custom-cta-btn"
              >
                <span>Telegram</span>
                <ArrowUpRightIcon size={16} />
              </a>
              <a
                href={MESSENGERS.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill-soft custom-cta-btn"
              >
                <span>ВК</span>
                <ArrowUpRightIcon size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* 6. Contacts + Footer */}
        <section id="contacts" className="section-block">
          <div className="white-card-block reveal reveal-text">
            <h2 className="display-title reveal reveal-heading">
              <span className="line-mask">
                <span className="line-rise">Контакты</span>
              </span>
            </h2>

            <div className="contacts-stack">
              <div className="contact-row">
                <p className="cap-label muted-text reveal reveal-caption">
                  <span>Телефон</span>
                </p>
                <a href={SHOP_INFO.phoneHref} className="contact-main-link">
                  {SHOP_INFO.phone}
                </a>
              </div>

              <div className="contact-row">
                <p className="cap-label muted-text reveal reveal-caption">
                  <span>Адрес</span>
                </p>
                <p className="contact-main-text">{SHOP_INFO.address}</p>
                <a
                  href={SHOP_INFO.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="messenger-text-link"
                >
                  <span>Открыть на Яндекс Картах</span>
                  <ArrowUpRightIcon size={16} />
                </a>
              </div>

              <div className="contact-row">
                <p className="cap-label muted-text reveal reveal-caption">
                  <span>Мессенджеры</span>
                </p>
                <div className="contacts-messengers">
                  <a
                    href={MESSENGERS.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="messenger-text-link"
                  >
                    <span>WhatsApp</span>
                    <ArrowUpRightIcon size={16} />
                  </a>
                  <a
                    href={MESSENGERS.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="messenger-text-link"
                  >
                    <span>Telegram</span>
                    <ArrowUpRightIcon size={16} />
                  </a>
                  <a
                    href={MESSENGERS.vk}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="messenger-text-link"
                  >
                    <span>ВКонтакте</span>
                    <ArrowUpRightIcon size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <footer className="site-footer">
            <span className="cap-label muted-text">
              © {SHOP_INFO.name}, {SHOP_INFO.city}
            </span>
            <span className="cap-label muted-text">{SHOP_INFO.address}</span>
          </footer>
        </section>
      </main>

      {toastVisible && (
        <div
          className={`cart-toast${cartCount > 0 ? ' with-sticky-bar' : ''}`}
          role="status"
          aria-live="polite"
        >
          Добавлено в корзину
        </div>
      )}

      {cartCount > 0 && (
        <div className="sticky-cart-wrap">
          <button
            type="button"
            className="sticky-cart-pill"
            onClick={() => setCartOpen(true)}
          >
            <span>
              Корзина · {cartCount} · {formatPrice(cartSum)} ₽
            </span>
          </button>
        </div>
      )}

      <BouquetModal
        bouquet={detailBouquet}
        onClose={() => setDetailBouquet(null)}
        onAddToCart={(bouquet, qty) => addToCart(bouquet, qty)}
        onOrderNow={handleOrderNow}
      />

      <CartModal
        isOpen={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onGoToCatalog={handleGoToCatalog}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
      />

      {zoomedWork && (
        <ImageZoomModal
          src={zoomedWork.src}
          alt={zoomedWork.alt}
          width={zoomedWork.width}
          height={zoomedWork.height}
          placeholderBg={zoomedWork.placeholderBg}
          onClose={() => setZoomedWork(null)}
        />
      )}
    </div>
  );
}
