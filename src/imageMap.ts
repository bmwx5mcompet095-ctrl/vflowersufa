export interface ImageAssetMeta {
  src: string;
  width: number;
  height: number;
  placeholderBg: string;
}

const IMAGE_ASSET_MAP: Record<string, ImageAssetMeta> = {
  '/images/logo.webp': {
    src: '/images/logo.webp',
    width: 828,
    height: 830,
    placeholderBg: '#EFEAE3',
  },
  '/images/hero-enthusiastov.webp': {
    src: '/images/hero-enthusiastov.webp',
    width: 960,
    height: 1280,
    placeholderBg: '#E8DFDC',
  },
  '/images/weddings-hydrangea.webp': {
    src: '/images/weddings-hydrangea.webp',
    width: 960,
    height: 1280,
    placeholderBg: '#EADCE0',
  },
  '/images/nyud-white-roses.webp': {
    src: '/images/nyud-white-roses.webp',
    width: 960,
    height: 1280,
    placeholderBg: '#EAE7E4',
  },
  '/images/chisty-stil.webp': {
    src: '/images/chisty-stil.webp',
    width: 960,
    height: 1280,
    placeholderBg: '#E6D8DD',
  },
  '/images/work-pink-carnations.webp': {
    src: '/images/work-pink-carnations.webp',
    width: 872,
    height: 1226,
    placeholderBg: '#EAD9DE',
  },
  '/images/work-cream-roses.webp': {
    src: '/images/work-cream-roses.webp',
    width: 960,
    height: 1280,
    placeholderBg: '#EAE4DE',
  },
  '/images/work-blue-peach.webp': {
    src: '/images/work-blue-peach.webp',
    width: 960,
    height: 1280,
    placeholderBg: '#DCE3E8',
  },
  '/images/work-gerbera-lily.webp': {
    src: '/images/work-gerbera-lily.webp',
    width: 960,
    height: 1280,
    placeholderBg: '#EADDE1',
  },
  '/images/work-chamomile.webp': {
    src: '/images/work-chamomile.webp',
    width: 743,
    height: 1280,
    placeholderBg: '#E7ECEB',
  },
  '/images/work-lilac.webp': {
    src: '/images/work-lilac.webp',
    width: 960,
    height: 1280,
    placeholderBg: '#E3DCEB',
  },
  '/images/work-grass.webp': {
    src: '/images/work-grass.webp',
    width: 896,
    height: 1200,
    placeholderBg: '#EAE6DF',
  },
};

export function resolveImageAsset(rawPath: string): ImageAssetMeta {
  const mapped = IMAGE_ASSET_MAP[rawPath];
  if (mapped) {
    return mapped;
  }

  return {
    src: rawPath,
    width: 960,
    height: 1280,
    placeholderBg: '#ECE7E0',
  };
}

export interface GalleryWorkItem {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholderBg: string;
  variant: 'tall' | 'medium';
  focus: string;
}

// Only clean bouquet & grass composition photos (no shop interior photos)
export const GALLERY_WORK_IMAGES: GalleryWorkItem[] = [
  {
    id: 'work-grass',
    src: '/images/work-grass.webp',
    alt: 'Минималистичная композиция из злаков, пампасной травы и эвкалипта в керамической вазе',
    width: 896,
    height: 1200,
    placeholderBg: '#EAE6DF',
    variant: 'tall',
    focus: 'center center',
  },
  {
    id: 'work-pink',
    src: '/images/work-pink-carnations.webp',
    alt: 'Букет в ягодно-розовых и бордовых оттенках в пудровой упаковке',
    width: 872,
    height: 1226,
    placeholderBg: '#EAD9DE',
    variant: 'medium',
    focus: 'center 45%',
  },
  {
    id: 'work-cream',
    src: '/images/work-cream-roses.webp',
    alt: 'Круглая сборка в сливочно-кремовых и белых тонах',
    width: 960,
    height: 1280,
    placeholderBg: '#EAE4DE',
    variant: 'medium',
    focus: 'center 48%',
  },
  {
    id: 'work-lilac',
    src: '/images/work-lilac.webp',
    alt: 'Сиренево-белый букет в лавандовой тишью',
    width: 960,
    height: 1280,
    placeholderBg: '#E3DCEB',
    variant: 'tall',
    focus: 'center 52%',
  },
  {
    id: 'work-white',
    src: '/images/nyud-white-roses.webp',
    alt: 'Объёмный букет из кремово-белых бутонов в матовой упаковке',
    width: 960,
    height: 1280,
    placeholderBg: '#EAE7E4',
    variant: 'medium',
    focus: 'center 52%',
  },
  {
    id: 'work-blue',
    src: '/images/work-blue-peach.webp',
    alt: 'Букет в небесно-голубых и тёплых персиковых оттенках',
    width: 960,
    height: 1280,
    placeholderBg: '#DCE3E8',
    variant: 'medium',
    focus: 'center 50%',
  },
];
