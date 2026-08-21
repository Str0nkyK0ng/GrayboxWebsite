'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from 'react';
import Image from 'next/image';

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

interface LightboxEntry {
  id: string;
  src: string;
  alt: string;
}

interface LightboxCtx {
  register: (entry: LightboxEntry) => void;
  unregister: (id: string) => void;
  openAt: (id: string) => void;
}

const LightboxContext = createContext<LightboxCtx | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export const LightboxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const entriesRef = useRef<LightboxEntry[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingToRef = useRef(false);

  /* registration ----------------------------------------------------- */
  const register = useCallback((entry: LightboxEntry) => {
    entriesRef.current = [
      ...entriesRef.current.filter((e) => e.id !== entry.id),
      entry,
    ];
  }, []);

  const unregister = useCallback((id: string) => {
    entriesRef.current = entriesRef.current.filter((e) => e.id !== id);
  }, []);

  /* open at a specific image ---------------------------------------- */
  const openAt = useCallback((id: string) => {
    const idx = entriesRef.current.findIndex((e) => e.id === id);
    if (idx === -1) return;
    setCurrent(idx);
    requestAnimationFrame(() => {
      setIsAnimating(true);
      const el = scrollRef.current;
      if (el) {
        el.scrollTo({ left: idx * el.clientWidth, behavior: 'instant' });
      }
    });
  }, []);

  const close = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => setCurrent(null), 200);
  }, []);

  /* programmatic navigation — no wrapping --------------------------- */
  const go = useCallback(
    (dir: -1 | 1) => {
      if (current === null) return;
      const len = entriesRef.current.length;
      if (len <= 1) return;
      const next = current + dir;
      if (next < 0 || next >= len) return;
      const el = scrollRef.current;
      if (el) {
        isScrollingToRef.current = true;
        el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
        setCurrent(next);
        setTimeout(() => {
          isScrollingToRef.current = false;
        }, 400);
      }
    },
    [current],
  );

  /* sync current index from native scroll position ------------------ */
  const onScroll = useCallback(() => {
    if (isScrollingToRef.current) return;
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.max(0, Math.min(idx, entriesRef.current.length - 1));
    setCurrent(clamped);
  }, []);

  /* keyboard -------------------------------------------------------- */
  useEffect(() => {
    if (current === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [current, close, go]);

  /* scroll lock ------------------------------------------------------ */
  useEffect(() => {
    if (current !== null) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [current]);

  /* derived --------------------------------------------------------- */
  const total = entriesRef.current.length;
  const showArrows = total > 1;
  const isOpen = current !== null;

  return (
    <LightboxContext.Provider value={{ register, unregister, openAt }}>
      {children}

      {isOpen && (
        <div className='fixed inset-0 z-50'>
          {/* backdrop */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-200 ${
              isAnimating ? 'opacity-90' : 'opacity-0'
            }`}
            onClick={close}
          />

          {/* close */}
          <button
            onClick={close}
            className='absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white'
            aria-label='Close lightbox'
          >
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
            >
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>

          {/* left arrow — hidden on first image */}
          {showArrows && current !== null && current > 0 && (
            <button
              onClick={() => go(-1)}
              className='absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white'
              aria-label='Previous image'
            >
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <polyline points='15 18 9 12 15 6' />
              </svg>
            </button>
          )}

          {/* right arrow — hidden on last image */}
          {showArrows && current !== null && current < total - 1 && (
            <button
              onClick={() => go(1)}
              className='absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white'
              aria-label='Next image'
            >
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <polyline points='9 6 15 12 9 18' />
              </svg>
            </button>
          )}

          {/* scroll-snap container — native swiping */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className='relative z-10 w-full h-full flex overflow-x-auto scrollbar-hide'
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {entriesRef.current.map((entry, i) => (
              <div
                key={entry.id}
                className='flex-none w-full h-full flex items-center justify-center'
                style={{ scrollSnapAlign: 'start' }}
              >
                <div
                  className={
                    i === current
                      ? `transition-all duration-200 ${
                          isAnimating
                            ? 'scale-100 opacity-100'
                            : 'scale-75 opacity-0'
                        }`
                      : ''
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={entry.src}
                    alt={entry.alt}
                    width={1920}
                    height={1080}
                    sizes='90vw'
                    className='max-h-[90vh] max-w-[90vw] w-auto h-auto object-contain rounded shadow-2xl'
                    priority={Math.abs(i - (current ?? 0)) <= 1}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* counter */}
          {showArrows && (
            <span className='absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-sm text-white/50'>
              {(current ?? 0) + 1} / {total}
            </span>
          )}
        </div>
      )}
    </LightboxContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Image                                                             */
/* ------------------------------------------------------------------ */

interface LightboxImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

let nextId = 0;

const LightboxImage: React.FC<LightboxImageProps> = ({
  src,
  alt,
  width = 800,
  height = 600,
  sizes,
  className = '',
  onLoad,
}) => {
  const ctx = useContext(LightboxContext);
  const idRef = useRef(`lb-${nextId++}`);

  useEffect(() => {
    ctx?.register({ id: idRef.current, src, alt });
    return () => ctx?.unregister(idRef.current);
  }, [ctx, src, alt]);

  const handleClick = () => {
    if (ctx) {
      ctx.openAt(idRef.current);
    }
  };

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      quality={60}
      className={`cursor-pointer ${className}`}
      onClick={handleClick}
      onLoad={onLoad}
    />
  );
};

export default LightboxImage;
