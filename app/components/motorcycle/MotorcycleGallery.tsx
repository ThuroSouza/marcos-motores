import { Bike, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { MotorcycleImage } from "../../types/motorcycle";

export function MotorcycleGallery({ images, name }: { images: MotorcycleImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const change = (offset: number) => setActive((current) => (current + offset + images.length) % images.length);
  const activeImage = images[Math.min(active, images.length - 1)];

  return (
    <div>
      <div
        className="relative overflow-hidden border border-white/10 bg-charcoal"
        onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null || images.length < 2) return;
          const distance = event.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(distance) > 45) change(distance > 0 ? -1 : 1);
          touchStartX.current = null;
        }}
      >
        {activeImage ? <img src={activeImage.url} alt={activeImage.alt || name} className="aspect-[4/3] w-full object-cover sm:aspect-[3/2]" /> : <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 text-muted sm:aspect-[3/2]"><Bike size={44} aria-hidden="true" />Fotos indisponíveis</div>}
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => change(-1)} aria-label={`Foto anterior de ${name}`} className="gallery-arrow left-3"><ChevronLeft size={22} aria-hidden="true" /></button>
            <button type="button" onClick={() => change(1)} aria-label={`Próxima foto de ${name}`} className="gallery-arrow right-3"><ChevronRight size={22} aria-hidden="true" /></button>
          </>
        )}
        {images.length > 0 && <span className="absolute bottom-4 right-4 bg-ink/85 px-3 py-1.5 text-xs text-white">{Math.min(active + 1, images.length)} / {images.length}</span>}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Miniaturas das fotos">
          {images.map((image, index) => (
            <button key={image.id} type="button" onClick={() => setActive(index)} aria-label={`Ver foto ${index + 1} de ${name}`} aria-current={active === index ? "true" : undefined} className={`w-24 shrink-0 overflow-hidden border-2 transition sm:w-28 ${active === index ? "border-gold" : "border-transparent hover:border-white/40"}`}>
              <img src={image.url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
