import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Home, TreePine } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

export function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen heritage-bg flex items-center justify-center py-20 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-md space-y-6"
      >
        <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-saffron-light/30 mb-2">
          <TreePine className="h-12 w-12 text-saffron/60" />
        </div>

        <div className="space-y-2">
          <div className="font-display text-8xl font-bold text-saffron/30">
            404
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t("notFound")}
          </h1>
          <p className="font-body text-muted-foreground text-base">
            {t("notFoundDesc")}
          </p>
        </div>

        <Link to="/">
          <Button className="bg-saffron hover:bg-saffron-deep text-white font-ui gap-2 mt-4">
            <Home className="h-4 w-4" />
            {t("goHome")}
          </Button>
        </Link>
      </motion.div>
    </main>
  );
}
