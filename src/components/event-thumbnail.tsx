import bands from '@/assets/bands.jpg';
import campus from '@/assets/campus.jpg';
import coding from '@/assets/coding.jpg';
import dance from '@/assets/dance.jpg';
import football from '@/assets/football.jpg';
import garba from '@/assets/garba.jpg';
import hero from '@/assets/hero.jpg';

const images: Record<string, string> = {
  hero,
  garba,
  football,
  coding,
  dance,
  bands,
  campus,
};

export function resolveEventImageSrc(image: string): string | null {
  if (!image) return null;
  if (images[image]) return images[image];
  if (/^(https:\/\/|data:image\/)/.test(image)) return image;
  return null;
}

export function EventThumbnail({ image, className = '' }: { image: string; className?: string }) {
  const src = resolveEventImageSrc(image);
  return src ? (
    <img src={src} alt="" className={`object-cover ${className}`} />
  ) : (
    <div className={`bg-gradient-to-br from-accent via-primary to-cyan ${className}`} />
  );
}
