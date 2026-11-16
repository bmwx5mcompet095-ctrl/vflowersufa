export interface Bouquet {
  id: string;
  name: string;
  composition: string;
  price: number;
  priceFormatted: string;
  image: string;
  images?: string[];
  focus?: string;
  category?: 'Букеты' | 'Корзины' | string;
}

export interface ShopInfo {
  name: string;
  subtitle: string;
  city: string;
  address: string;
  mapUrl: string;
  phone: string;
  phoneHref: string;
  heroImage: string;
  heroFocus: string;
  ratingLabel: string;
}

export interface DeliveryAndPaymentInfo {
  delivery: string;
  paymentMethods: string[];
}

export interface MessengersInfo {
  whatsapp: string;
  telegram: string;
  vk: string;
}

export const showDemoNote = true;

export const SHOP_INFO: ShopInfo = {
  name: 'В Цветах',
  subtitle: 'Авторские букеты в Уфе',
  city: 'Уфа',
  address: 'Уфа, ул. Энтузиастов, 15',
  mapUrl: 'https://yandex.ru/maps/org/v_tsvetakh/230508707403',
  phone: '+7 (987) 018-88-18',
  phoneHref: 'tel:+79870188818',
  heroImage: '/images/hero-enthusiastov.webp',
  heroFocus: 'center 46%',
  ratingLabel: '4,9 · Яндекс Карты',
};

export const ABOUT_FACTS: string[] = [
  '4,9 на Яндекс Картах · 31 оценка · Хорошее место 2026',
  'Доставка (стоимость уточняйте у флориста) и самовывоз',
  'Подарочная упаковка и свадебная флористика',
  'Удобная парковка у мастерской',
  'Оплата: Картой, Наличными, Переводом (СБП)',
];

export const MESSENGERS: MessengersInfo = {
  whatsapp: 'https://wa.me/79870188818',
  telegram: 'https://t.me/+79870188818',
  vk: 'https://vk.ru/club240705181',
};

export const BOUQUETS: Bouquet[] = [
  {
    id: 'bely-shyolk',
    name: 'Белый шёлк',
    composition:
      'Кремово-белые бутоны в белой матовой упаковке со светлыми атласными лентами',
    price: 4500,
    priceFormatted: '4 500',
    image: '/images/nyud-white-roses.webp',
    images: ['/images/nyud-white-roses.webp'],
    focus: 'center 52%',
    category: 'Букеты',
  },
  {
    id: 'slivochny-kashemir',
    name: 'Сливочный кашемир',
    composition:
      'Сливочно-кремовые, белые и нежно-розовые оттенки в пудровой упаковке',
    price: 3900,
    priceFormatted: '3 900',
    image: '/images/work-cream-roses.webp',
    images: ['/images/work-cream-roses.webp'],
    focus: 'center 48%',
    category: 'Букеты',
  },
  {
    id: 'yagodny-barhat',
    name: 'Ягодный бархат',
    composition:
      'Малиновые, розовые и бордовые бутоны с матовой зеленью в пудровой упаковке',
    price: 4200,
    priceFormatted: '4 200',
    image: '/images/work-pink-carnations.webp',
    images: ['/images/work-pink-carnations.webp'],
    focus: 'center 45%',
    category: 'Букеты',
  },
  {
    id: 'nebo-i-persik',
    name: 'Небо и персик',
    composition:
      'Небесно-голубые, персиковые и сливочно-белые оттенки в кремовой упаковке',
    price: 4600,
    priceFormatted: '4 600',
    image: '/images/work-blue-peach.webp',
    images: ['/images/work-blue-peach.webp'],
    focus: 'center 50%',
    category: 'Букеты',
  },
  {
    id: 'tyoploe-utro',
    name: 'Тёплое утро',
    composition:
      'Персиковые, розовые, белые и солнечно-жёлтые оттенки в розовой упаковке',
    price: 3600,
    priceFormatted: '3 600',
    image: '/images/work-gerbera-lily.webp',
    images: ['/images/work-gerbera-lily.webp'],
    focus: 'center 46%',
    category: 'Букеты',
  },
  {
    id: 'zhemchuzhnaya-vual',
    name: 'Жемчужная вуаль',
    composition:
      'Пудрово-розовые, малиновые и молочно-белые оттенки с жемчужными нитями',
    price: 5400,
    priceFormatted: '5 400',
    image: '/images/weddings-hydrangea.webp',
    images: ['/images/weddings-hydrangea.webp'],
    focus: 'center 48%',
    category: 'Букеты',
  },
  {
    id: 'grafit-i-bordo',
    name: 'Графит и бордо',
    composition:
      'Бордовые и пудрово-розовые оттенки с декоративными перьями в чёрной упаковке',
    price: 3800,
    priceFormatted: '3 800',
    image: '/images/chisty-stil.webp',
    images: ['/images/chisty-stil.webp'],
    focus: 'center 48%',
    category: 'Букеты',
  },
  {
    id: 'bely-polden',
    name: 'Белый полдень',
    composition:
      'Пышная воздушная охапка в белоснежных оттенках со светлыми лентами',
    price: 4100,
    priceFormatted: '4 100',
    image: '/images/work-chamomile.webp',
    images: ['/images/work-chamomile.webp'],
    focus: 'center 46%',
    category: 'Букеты',
  },
  {
    id: 'pudrovy-sad',
    name: 'Пудровый сад',
    composition:
      'Пастельно-розовые, сливочные и белые оттенки с серебристой зеленью',
    price: 5200,
    priceFormatted: '5 200',
    image: '/images/hero-enthusiastov.webp',
    images: ['/images/hero-enthusiastov.webp'],
    focus: 'center 46%',
    category: 'Букеты',
  },
  {
    id: 'lavandovy-rassvet',
    name: 'Лавандовый рассвет',
    composition:
      'Сиреневые, нежно-лиловые и кремовые оттенки в лавандовой тишью',
    price: 4300,
    priceFormatted: '4 300',
    image: '/images/work-lilac.webp',
    images: ['/images/work-lilac.webp'],
    focus: 'center 52%',
    category: 'Букеты',
  },
];

export const DELIVERY_AND_PAYMENT: DeliveryAndPaymentInfo = {
  delivery: 'Доставка есть, стоимость уточняйте у флориста в чате',
  paymentMethods: ['Картой', 'Наличными', 'Переводом (СБП)'],
};

export function buildWhatsAppOrderUrl(bouquet?: Bouquet | null): string {
  if (!bouquet) {
    return MESSENGERS.whatsapp;
  }

  const text = `Здравствуйте! Хочу заказать букет «${bouquet.name}» за ${bouquet.priceFormatted} ₽`;
  return `${MESSENGERS.whatsapp}?text=${encodeURIComponent(text)}`;
}
