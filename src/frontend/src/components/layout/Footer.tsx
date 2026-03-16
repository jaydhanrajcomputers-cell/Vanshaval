import { Heart, Mail, MapPin, TreePine } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`;

  return (
    <footer
      className="border-t border-border bg-foreground text-background"
      data-ocid="footer.section"
    >
      {/* Saffron accent line */}
      <div className="saffron-divider" />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron text-white">
                <TreePine className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-xl font-semibold text-background">
                  {t("siteName")}
                </div>
                <div className="text-xs font-ui text-background/60">
                  {t("siteTagline")}
                </div>
              </div>
            </div>
            <p className="text-sm font-body text-background/70 leading-relaxed">
              {t("footerTagline")}
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-background text-base">
              {t("footerContact")}
            </h3>
            <div className="space-y-2">
              <a
                href={`mailto:${t("footerEmail")}`}
                className="flex items-center gap-2 text-sm text-background/70 hover:text-saffron transition-colors group"
              >
                <Mail className="h-4 w-4 text-saffron group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>{t("footerEmail")}</span>
              </a>
              <div className="flex items-start gap-2 text-sm text-background/70">
                <MapPin className="h-4 w-4 text-saffron flex-shrink-0 mt-0.5" />
                <span>{t("footerAddress")}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-background text-base">
              {t("siteName")}
            </h3>
            <p className="text-sm text-background/60 leading-relaxed font-body">
              {t("siteDescription")}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-background/50 font-ui text-center sm:text-left">
            {t("footerCopyright").replace("{year}", String(year))}
          </p>
          <p className="text-xs text-background/50 font-ui flex items-center gap-1">
            {t("builtWith")}{" "}
            <Heart className="h-3 w-3 text-saffron fill-saffron" />{" "}
            {t("builtUsing").split("caffeine.ai")[0]}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-saffron hover:text-saffron-light transition-colors underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
