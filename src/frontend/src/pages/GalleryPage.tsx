import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  Info,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { GalleryPhoto } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  useAddGalleryPhoto,
  useGalleryPhotosByCategory,
} from "../hooks/useQueries";

// ── Category config ──────────────────────────────────────────────

const CATEGORIES = [
  { key: "recent", mr: "अलीकडील फोटो", en: "Recent Photos", public: true },
  { key: "wedding", mr: "लग्न", en: "Wedding", public: false },
  { key: "engagement", mr: "साखरपुडा", en: "Engagement", public: false },
  { key: "birthday", mr: "वाढदिवस", en: "Birthday", public: false },
  { key: "trip", mr: "ट्रिप", en: "Trip", public: false },
  {
    key: "socialEvent",
    mr: "सामाजिक कार्यक्रम",
    en: "Social Events",
    public: false,
  },
  {
    key: "pandharpur",
    mr: "पंढरपुरातील ठिकाणे",
    en: "Pandharpur Places",
    public: true,
  },
  { key: "oldMemories", mr: "जुन्या आठवणी", en: "Old Memories", public: false },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const CATEGORY_COLORS: Record<string, string> = {
  recent: "bg-amber-100 text-amber-800 border-amber-200",
  wedding: "bg-pink-100 text-pink-800 border-pink-200",
  engagement: "bg-purple-100 text-purple-800 border-purple-200",
  birthday: "bg-yellow-100 text-yellow-800 border-yellow-200",
  trip: "bg-blue-100 text-blue-800 border-blue-200",
  socialEvent: "bg-green-100 text-green-800 border-green-200",
  pandharpur: "bg-orange-100 text-orange-800 border-orange-200",
  oldMemories: "bg-stone-100 text-stone-700 border-stone-200",
};

function getCategoryLabel(key: string, language: string) {
  const cat = CATEGORIES.find((c) => c.key === key);
  if (!cat) return key;
  return language === "mr" ? cat.mr : cat.en;
}

// ── Upload Modal ──────────────────────────────────────────────────

function UploadModal() {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const addPhotoMutation = useAddGalleryPhoto();

  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>("");
  const [photoData, setPhotoData] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileSizeError, setFileSizeError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("कृपया फक्त image file निवडा / Please select an image file");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileSizeError(true);
      setPhotoData("");
      setPhotoPreview("");
      return;
    }

    setFileSizeError(false);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      setPhotoData(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!photoData) {
      toast.error("कृपया फोटो निवडा / Please select a photo");
      return;
    }
    if (!category) {
      toast.error("कृपया श्रेणी निवडा / Please select a category");
      return;
    }
    if (!currentUser) return;

    try {
      const photo: GalleryPhoto = {
        id: crypto.randomUUID(),
        photoData,
        approvedStatus: "approved",
        uploaderName: currentUser.name,
        createdAt: BigInt(Date.now()),
        caption,
        category,
        uploadedBy: currentUser.email,
      };
      await addPhotoMutation.mutateAsync(photo);
      setUploadSuccess(true);
      toast.success(
        language === "mr"
          ? "फोटो यशस्वीरित्या अपलोड केला!"
          : "Photo uploaded successfully!",
      );
    } catch {
      toast.error("अपलोड अयशस्वी / Upload failed");
    }
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setCaption("");
      setCategory("");
      setPhotoData("");
      setPhotoPreview("");
      setUploadSuccess(false);
      setFileSizeError(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button
          data-ocid="gallery.upload_button"
          className="bg-saffron hover:bg-saffron-deep text-white font-ui gap-2"
        >
          <Upload className="h-4 w-4" />
          {language === "mr" ? "फोटो अपलोड करा" : "Upload Photo"}
        </Button>
      </DialogTrigger>

      <DialogContent data-ocid="gallery.upload.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-saffron" />
            {language === "mr" ? "फोटो अपलोड करा" : "Upload Photo"}
          </DialogTitle>
        </DialogHeader>

        {uploadSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 flex flex-col items-center text-center gap-3"
            data-ocid="gallery.upload.success_state"
          >
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <ImageIcon className="h-7 w-7 text-green-600" />
            </div>
            <p className="font-display text-base font-semibold text-foreground">
              {language === "mr"
                ? "फोटो यशस्वीरित्या अपलोड केला!"
                : "Photo uploaded successfully!"}
            </p>
            <p className="font-ui text-sm text-muted-foreground">
              {language === "mr"
                ? "फोटो गॅलरीमध्ये जोडला आहे"
                : "Photo added to gallery"}
            </p>
            <Button
              onClick={() => handleClose(false)}
              className="mt-2 bg-saffron hover:bg-saffron-deep text-white font-ui"
            >
              {language === "mr" ? "बंद करा" : "Close"}
            </Button>
          </motion.div>
        ) : (
          <div className="py-2 space-y-4">
            {/* File picker */}
            <div className="space-y-2">
              <Label className="font-ui text-sm font-medium">
                {language === "mr" ? "फोटो निवडा" : "Select Photo"}
              </Label>
              <button
                type="button"
                className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-saffron/50 transition-colors bg-transparent"
                onClick={() => fileInputRef.current?.click()}
                data-ocid="gallery.upload.dropzone"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-40 rounded-lg object-cover"
                  />
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                    <p className="font-ui text-sm text-muted-foreground">
                      {language === "mr"
                        ? "फोटो निवडण्यासाठी क्लिक करा"
                        : "Click to select image"}
                    </p>
                    <p className="font-ui text-xs text-muted-foreground/60">
                      {language === "mr"
                        ? "Click to select image"
                        : "JPG, PNG, WebP supported"}
                    </p>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Size warning note – always visible */}
              <div
                className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200"
                data-ocid="gallery.upload.size_warning"
              >
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="font-ui text-xs text-amber-700 leading-relaxed">
                  {language === "mr"
                    ? "फोटो अपलोड करत असताना सदर फोटो हा 1 MB पेक्षा जास्त मोठा नसावा"
                    : "Photo must not exceed 1 MB while uploading"}
                </p>
              </div>

              {/* File size error */}
              <AnimatePresence>
                {fileSizeError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-ui text-xs text-red-700 font-medium">
                          {language === "mr"
                            ? "हा फोटो 1 MB पेक्षा मोठा आहे. कृपया साईज कमी करा."
                            : "This photo exceeds 1 MB. Please reduce the size."}
                        </p>
                        <a
                          href="https://www.reduceimages.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-ui text-xs text-saffron hover:text-saffron-deep underline underline-offset-2"
                          data-ocid="gallery.upload.reduce_link"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {language === "mr"
                            ? "फोटो साईज कमी करण्यासाठी https://www.reduceimages.com/ या लिंकचा उपयोग करा"
                            : "Use https://www.reduceimages.com/ to reduce image size"}
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Caption */}
            <div className="space-y-1.5">
              <Label
                htmlFor="gallery-caption"
                className="font-ui text-sm font-medium"
              >
                {language === "mr" ? "शीर्षक" : "Caption"}
              </Label>
              <Input
                id="gallery-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={
                  language === "mr" ? "फोटोचे शीर्षक" : "Photo caption"
                }
                data-ocid="gallery.upload.caption_input"
                className="font-ui text-sm"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="font-ui text-sm font-medium">
                {language === "mr" ? "श्रेणी निवडा" : "Select Category"}
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  data-ocid="gallery.upload.category_select"
                  className="font-ui text-sm"
                >
                  <SelectValue
                    placeholder={
                      language === "mr" ? "श्रेणी निवडा" : "Select Category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {language === "mr" ? cat.mr : cat.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!uploadSuccess && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              data-ocid="gallery.upload.cancel_button"
              className="font-ui"
            >
              {language === "mr" ? "रद्द करा" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                addPhotoMutation.isPending ||
                !photoData ||
                !category ||
                fileSizeError
              }
              data-ocid="gallery.upload.submit_button"
              className="bg-saffron hover:bg-saffron-deep text-white font-ui"
            >
              {addPhotoMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {addPhotoMutation.isPending
                ? language === "mr"
                  ? "अपलोड होत आहे..."
                  : "Uploading..."
                : language === "mr"
                  ? "फोटो अपलोड करा"
                  : "Upload Photo"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Photo Card ────────────────────────────────────────────────────

function PhotoCard({
  photo,
  index,
  language,
  onClick,
}: {
  photo: GalleryPhoto;
  index: number;
  language: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.03 }}
      data-ocid={`gallery.photo.item.${index + 1}`}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left w-full"
      onClick={onClick}
      aria-label={photo.caption || `Photo ${index + 1}`}
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        {photo.photoData ? (
          <img
            src={photo.photoData}
            alt={photo.caption || "Family photo"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        {photo.caption && (
          <p className="font-ui text-sm text-foreground font-medium line-clamp-2">
            {photo.caption}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Badge
            className={`font-ui text-xs ${CATEGORY_COLORS[photo.category] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
          >
            {getCategoryLabel(photo.category, language)}
          </Badge>
          <span className="font-ui text-xs text-muted-foreground truncate">
            {photo.uploaderName}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ── Photo Lightbox ────────────────────────────────────────────────

function PhotoLightbox({
  photo,
  photos,
  language,
  onClose,
  onPrev,
  onNext,
}: {
  photo: GalleryPhoto;
  photos: GalleryPhoto[];
  language: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const currentIndex = photos.findIndex((p) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      data-ocid="gallery.lightbox.dialog"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        data-ocid="gallery.lightbox.close_button"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev button */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          data-ocid="gallery.lightbox.prev_button"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          data-ocid="gallery.lightbox.next_button"
          aria-label="Next photo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Photo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {photo.photoData && (
          <img
            src={photo.photoData}
            alt={photo.caption || "Gallery photo"}
            className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl"
          />
        )}
        <div className="flex flex-col items-center gap-2">
          {photo.caption && (
            <p className="font-ui text-sm text-white/90 text-center max-w-lg leading-relaxed">
              {photo.caption}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Badge
              className={`font-ui text-xs ${CATEGORY_COLORS[photo.category] ?? "bg-gray-700 text-gray-200"}`}
            >
              {getCategoryLabel(photo.category, language)}
            </Badge>
            <span className="font-ui text-xs text-white/50">
              {photo.uploaderName}
            </span>
            {photos.length > 1 && (
              <span className="font-ui text-xs text-white/40">
                {currentIndex + 1} / {photos.length}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────

function PhotoSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      data-ocid="gallery.photos.loading_state"
    >
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Category-filtered Photos Component ───────────────────────────

function FilteredPhotos({
  category,
  language,
}: {
  category: CategoryKey;
  language: string;
}) {
  const catPhotos = useGalleryPhotosByCategory(category);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  const photos = catPhotos.data ?? [];

  const currentIndex = lightboxPhoto
    ? photos.findIndex((p) => p.id === lightboxPhoto.id)
    : -1;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setLightboxPhoto(photos[currentIndex - 1]);
  }, [currentIndex, photos]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1)
      setLightboxPhoto(photos[currentIndex + 1]);
  }, [currentIndex, photos]);

  if (catPhotos.isLoading) {
    return <PhotoSkeleton />;
  }

  if (photos.length === 0) {
    return (
      <div
        className="flex flex-col items-center py-16 text-center"
        data-ocid="gallery.photos.empty_state"
      >
        <div className="h-16 w-16 rounded-full bg-saffron/10 flex items-center justify-center mb-4">
          <Camera className="h-8 w-8 text-saffron/40" />
        </div>
        <p className="font-display text-base font-semibold text-foreground mb-1">
          {language === "mr"
            ? "या श्रेणीत कोणतेही फोटो नाहीत"
            : "No photos found in this category"}
        </p>
        <p className="font-ui text-sm text-muted-foreground">
          {language === "mr" ? "गॅलरी रिकामी आहे" : "Gallery is empty"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {photos.map((photo, idx) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={idx}
              language={language}
              onClick={() => setLightboxPhoto(photo)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <PhotoLightbox
            photo={lightboxPhoto}
            photos={photos}
            language={language}
            onClose={() => setLightboxPhoto(null)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main GalleryPage ──────────────────────────────────────────────

export function GalleryPage() {
  const { language } = useLanguage();
  const { isLoggedIn } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("recent");

  // Determine which categories to show
  const visibleCategories = isLoggedIn
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.public);

  // If current active category is not visible (e.g., user logged out), reset
  const isActiveVisible = visibleCategories.some(
    (c) => c.key === activeCategory,
  );
  const resolvedCategory = isActiveVisible ? activeCategory : "recent";

  return (
    <main className="min-h-screen heritage-bg py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="container mx-auto max-w-6xl"
        data-ocid="gallery.page"
      >
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl shadow-heritage-lg overflow-hidden mb-6">
          <div className="hero-gradient px-8 pt-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
                  <Camera className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">
                    {language === "mr" ? "गॅलरी" : "Gallery"}
                  </h1>
                  <p className="font-body text-white/80 text-sm mt-0.5">
                    {language === "mr"
                      ? "अभंगराव कुटुंबाच्या आठवणी"
                      : "Family Memories"}
                  </p>
                </div>
              </div>
              {isLoggedIn && <UploadModal />}
            </div>
          </div>
          <div className="saffron-divider" />
        </div>

        {/* Public user info banner */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6"
            data-ocid="gallery.public_banner"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="font-ui text-sm text-amber-800">
                {language === "mr"
                  ? "लॉगिन केल्यानंतर सर्व गॅलरी पाहता येईल"
                  : "Login to view all gallery categories"}
              </p>
            </div>
            <Link to="/login">
              <Button
                size="sm"
                data-ocid="gallery.login_from_banner_button"
                className="bg-saffron hover:bg-saffron-deep text-white font-ui text-xs px-4 whitespace-nowrap"
              >
                {language === "mr" ? "लॉगिन करा" : "Login"}
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Category Filter Tabs */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 mb-6">
          <div
            className="flex gap-2 flex-wrap"
            data-ocid="gallery.category_tab"
          >
            {visibleCategories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                data-ocid="gallery.category_tab"
                className={`px-4 py-2 rounded-lg text-sm font-ui font-medium transition-all ${
                  resolvedCategory === cat.key
                    ? "bg-saffron text-white shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-saffron/10 hover:text-saffron"
                }`}
              >
                {language === "mr" ? cat.mr : cat.en}
              </button>
            ))}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <FilteredPhotos category={resolvedCategory} language={language} />
        </div>
      </motion.div>
    </main>
  );
}
