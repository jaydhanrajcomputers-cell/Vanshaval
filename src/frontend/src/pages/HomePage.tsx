import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  TreePine,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  useGalleryPhotosByCategory,
  usePatriarchInfo,
} from "../hooks/useQueries";

const HERO_PHOTO_KEY = "vatavriksha_hero_photo";
const DEFAULT_HERO_PHOTO =
  "/assets/generated/patriarch-placeholder.dim_400x500.jpg";

function useHeroPhoto() {
  const [heroPhoto] = useState<string>(() => {
    try {
      return localStorage.getItem(HERO_PHOTO_KEY) ?? DEFAULT_HERO_PHOTO;
    } catch {
      return DEFAULT_HERO_PHOTO;
    }
  });
  return heroPhoto;
}

const CATEGORY_COLORS: Record<string, string> = {
  recent: "bg-amber-100/90 text-amber-800",
  pandharpur: "bg-orange-100/90 text-orange-800",
};

// ── Gallery Slideshow ─────────────────────────────────────────────

function GallerySlideshow() {
  const { language } = useLanguage();
  const recentQuery = useGalleryPhotosByCategory("recent");
  const pandharpurQuery = useGalleryPhotosByCategory("pandharpur");

  const recentPhotos = recentQuery.data ?? [];
  const pandharpurPhotos = pandharpurQuery.data ?? [];
  const slideshowPhotos = [...recentPhotos, ...pandharpurPhotos];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (slideshowPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slideshowPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slideshowPhotos.length]);

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) =>
      prev === 0 ? slideshowPhotos.length - 1 : prev - 1,
    );
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slideshowPhotos.length);
  };

  const isLoading = recentQuery.isLoading || pandharpurQuery.isLoading;

  // Loading state
  if (isLoading) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        data-ocid="home.gallery_slideshow"
      >
        <Skeleton className="w-full aspect-video rounded-2xl" />
      </div>
    );
  }

  // Fallback: static placeholder grid if no photos
  if (slideshowPhotos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        data-ocid="home.gallery_slideshow"
      >
        {[
          { label: "लग्न", en: "Wedding" },
          { label: "साखरपुडा", en: "Engagement" },
          { label: "वाढदिवस", en: "Birthday" },
          { label: "सामाजिक", en: "Social" },
          { label: "ट्रिप", en: "Trip" },
          { label: "पंढरपूर", en: "Pandharpur" },
          { label: "कुटुंब", en: "Family" },
          { label: "उत्सव", en: "Festival" },
        ].map((cat) => (
          <div
            key={cat.label}
            className="aspect-square rounded-xl bg-gradient-to-br from-saffron-light/30 to-cream-dark/50 border border-border flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed"
          >
            <Camera className="h-8 w-8 text-saffron/60" />
            <span className="font-body text-sm text-foreground/60">
              {cat.label}
            </span>
            <span className="font-ui text-xs text-muted-foreground">
              {language === "mr" ? "लवकरच येत आहे" : "Coming Soon"}
            </span>
          </div>
        ))}
      </motion.div>
    );
  }

  const currentPhoto = slideshowPhotos[currentIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-heritage-lg"
      data-ocid="home.gallery_slideshow"
    >
      {/* Slide container */}
      <div className="relative aspect-video sm:aspect-[16/9] lg:aspect-[21/9] bg-secondary overflow-hidden rounded-2xl">
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={currentPhoto.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {currentPhoto.photoData ? (
              <img
                src={currentPhoto.photoData}
                alt={currentPhoto.caption || "Gallery"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <Camera className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}

            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Caption & Category overlay */}
            <div className="absolute bottom-4 left-4 right-16 flex flex-col gap-1.5">
              <Badge
                className={`self-start text-xs font-ui ${
                  CATEGORY_COLORS[currentPhoto.category] ??
                  "bg-white/80 text-foreground"
                }`}
              >
                {currentPhoto.category === "recent"
                  ? language === "mr"
                    ? "अलीकडील फोटो"
                    : "Recent Photos"
                  : currentPhoto.category === "pandharpur"
                    ? language === "mr"
                      ? "पंढरपुरातील ठिकाणे"
                      : "Pandharpur Places"
                    : currentPhoto.category}
              </Badge>
              {currentPhoto.caption && (
                <p className="font-ui text-sm text-white/90 line-clamp-1 drop-shadow">
                  {currentPhoto.caption}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev Button */}
        {slideshowPhotos.length > 1 && (
          <button
            type="button"
            onClick={goToPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
            data-ocid="home.slideshow_prev_button"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Next Button */}
        {slideshowPhotos.length > 1 && (
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
            data-ocid="home.slideshow_next_button"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {slideshowPhotos.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {slideshowPhotos.map((_, i) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: slide indicators are positional
              key={i}
              type="button"
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                setCurrentIndex(i);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-6 bg-saffron"
                  : "w-2 bg-saffron/30 hover:bg-saffron/50"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────────

export function HomePage() {
  const { t, language } = useLanguage();
  const { data: patriarch, isLoading } = usePatriarchInfo();
  const heroPhoto = useHeroPhoto();

  return (
    <main className="min-h-screen heritage-bg">
      {/* ── Hero Section ── */}
      <section
        className="relative overflow-hidden hero-gradient min-h-[90vh] flex items-center"
        data-ocid="home.hero_section"
      >
        {/* Mandala overlay */}
        <div className="absolute inset-0 mandala-overlay opacity-40 pointer-events-none" />

        {/* Decorative circles */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text content */}
            <div className="text-center lg:text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                  <TreePine className="h-4 w-4 text-white" />
                  <span className="text-white/90 text-sm font-ui tracking-wide">
                    अभंगराव घराणे
                  </span>
                </div>

                <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-white leading-none tracking-tight drop-shadow-2xl">
                  {t("siteName")}
                </h1>

                <p className="font-body text-xl sm:text-2xl text-white/85 mt-4 leading-relaxed">
                  {t("siteTagline")}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                className="flex flex-wrap gap-3 justify-center lg:justify-start"
              >
                <Link to="/family-tree">
                  <Button
                    size="lg"
                    data-ocid="home.view_tree_button"
                    className="bg-white text-saffron-deep hover:bg-white/90 font-ui font-semibold px-8 shadow-heritage"
                  >
                    <TreePine className="mr-2 h-5 w-5" />
                    {t("viewFamilyTree")}
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right: Patriarch card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="flex justify-center lg:justify-end"
            >
              <div
                className="patriarch-card rounded-2xl overflow-hidden max-w-xs w-full"
                data-ocid="home.patriarch_card"
              >
                {/* Photo */}
                <div className="relative">
                  <img
                    src={heroPhoto}
                    alt={patriarch?.name ?? t("siteName")}
                    className="w-full object-cover"
                    style={{ height: "320px" }}
                    loading="eager"
                  />
                  {/* Gradient overlay at bottom of image */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
                </div>

                {/* Info */}
                <div className="p-5 text-center space-y-2">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4 mx-auto" />
                      <Skeleton className="h-4 w-2/3 mx-auto" />
                      <Skeleton className="h-4 w-full mx-auto" />
                    </div>
                  ) : (
                    <>
                      <h2 className="font-display text-lg font-bold text-foreground leading-snug">
                        {patriarch?.name ?? "श्री गणेश सावळाराम अभंगराव"}
                      </h2>
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-px w-8 bg-gold" />
                        <p className="font-ui text-xs text-saffron uppercase tracking-widest font-semibold">
                          {patriarch?.title ?? t("patriarchTitle")}
                        </p>
                        <div className="h-px w-8 bg-gold" />
                      </div>
                      <blockquote className="font-body italic text-base text-foreground/80 leading-relaxed pt-1">
                        "
                        {patriarch?.inspirationalMessage ??
                          t("inspirationalMessage")}
                        "
                      </blockquote>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-16"
            role="presentation"
            aria-hidden="true"
          >
            <path
              d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
              fill="oklch(0.974 0.012 80)"
            />
          </svg>
        </div>
      </section>

      {/* ── About Preview Section ── */}
      <section className="py-20 bg-background" data-ocid="home.about_section">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 text-saffron">
              <div className="h-px w-12 bg-saffron" />
              <span className="font-ui text-sm uppercase tracking-widest font-semibold">
                {t("aboutTitle")}
              </span>
              <div className="h-px w-12 bg-saffron" />
            </div>

            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              {t("siteName")}
            </h2>

            <p className="font-body text-lg text-muted-foreground leading-relaxed">
              {t("aboutText")}
            </p>

            <Button
              variant="outline"
              size="lg"
              disabled
              className="font-ui border-saffron text-saffron hover:bg-saffron hover:text-white gap-2 cursor-not-allowed opacity-70"
            >
              {t("learnMore")}
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16"
          >
            {[
              { value: "१९२०", label: "स्थापना वर्ष", sublabel: "Founded" },
              { value: "५+", label: "पिढ्या", sublabel: "Generations" },
              { value: "पंढरपूर", label: "मूळ गाव", sublabel: "Origin" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-xl bg-card border border-border shadow-card heritage-card"
              >
                <div className="font-display text-3xl font-bold text-saffron mb-1">
                  {stat.value}
                </div>
                <div className="font-body text-base text-foreground font-semibold">
                  {stat.label}
                </div>
                <div className="font-ui text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Gallery Preview Section ── */}
      <section
        className="py-20 bg-secondary/50"
        data-ocid="home.gallery_preview"
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-4 mb-10"
          >
            <div className="inline-flex items-center gap-2 text-saffron">
              <div className="h-px w-12 bg-saffron" />
              <span className="font-ui text-sm uppercase tracking-widest font-semibold">
                {t("galleryTitle")}
              </span>
              <div className="h-px w-12 bg-saffron" />
            </div>
            <h2 className="font-display text-4xl font-bold text-foreground">
              {language === "mr" ? "गॅलरी / Gallery" : "Gallery"}
            </h2>
            <p className="font-body text-muted-foreground text-lg max-w-xl mx-auto">
              {language === "mr"
                ? "अभंगराव कुटुंबाच्या अलीकडील फोटो व पंढरपुरातील ठिकाणे"
                : "Recent photos and places of Pandharpur"}
            </p>
          </motion.div>

          {/* Slideshow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GallerySlideshow />
          </motion.div>

          {/* Link to full gallery */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-center mt-8"
          >
            <Link to="/gallery">
              <Button
                variant="outline"
                className="font-ui border-saffron text-saffron hover:bg-saffron hover:text-white gap-2"
                data-ocid="home.gallery_link"
              >
                <Camera className="h-4 w-4" />
                {language === "mr" ? "पूर्ण गॅलरी पहा" : "View Full Gallery"}
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
