import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import { Globe, Menu, TreePine, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export function Header() {
  const { t, toggleLanguage, language } = useLanguage();
  const { isLoggedIn, currentUser, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-cream/95 backdrop-blur-sm shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            data-ocid="header.home_link"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron text-white shadow-sm group-hover:bg-saffron-deep transition-colors">
              <TreePine className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-semibold text-foreground tracking-tight">
                {t("siteName")}
              </span>
              <span className="hidden sm:block text-xs font-ui text-muted-foreground leading-none">
                {t("siteTagline")}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`nav-link px-3 py-2 rounded-md text-sm transition-colors hover:text-primary hover:bg-secondary ${
                isActive("/")
                  ? "text-primary font-semibold bg-secondary"
                  : "text-foreground"
              }`}
              data-ocid="header.home_link"
            >
              {t("home")}
            </Link>

            <Link
              to="/family-tree"
              className={`nav-link px-3 py-2 rounded-md text-sm transition-colors hover:text-primary hover:bg-secondary ${
                isActive("/family-tree")
                  ? "text-primary font-semibold bg-secondary"
                  : "text-foreground"
              }`}
              data-ocid="header.familytree_link"
            >
              {t("familyTree")}
            </Link>

            <Link
              to="/gallery"
              className={`nav-link px-3 py-2 rounded-md text-sm transition-colors hover:text-primary hover:bg-secondary ${
                isActive("/gallery")
                  ? "text-primary font-semibold bg-secondary"
                  : "text-foreground"
              }`}
              data-ocid="header.gallery_link"
            >
              {t("gallery")}
            </Link>

            <Link
              to="/search"
              className={`nav-link px-3 py-2 rounded-md text-sm transition-colors hover:text-primary hover:bg-secondary ${
                isActive("/search")
                  ? "text-primary font-semibold bg-secondary"
                  : "text-foreground"
              }`}
              data-ocid="header.search_link"
            >
              {t("search")}
            </Link>

            {isLoggedIn && !isAdmin && (
              <Link
                to="/profile"
                className={`nav-link px-3 py-2 rounded-md text-sm transition-colors hover:text-primary hover:bg-secondary ${
                  isActive("/profile")
                    ? "text-primary font-semibold bg-secondary"
                    : "text-foreground"
                }`}
                data-ocid="header.profile_link"
              >
                माझे प्रोफाइल
              </Link>
            )}
          </nav>

          {/* Right side controls */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              data-ocid="header.language_toggle"
              className="gap-1.5 font-ui text-xs border-border hover:border-saffron hover:text-saffron"
            >
              <Globe className="h-3.5 w-3.5" />
              {language === "mr" ? "EN" : "मराठी"}
            </Button>

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-ui text-muted-foreground">
                  {currentUser?.name}
                  {isAdmin && (
                    <span className="ml-1.5 text-xs bg-saffron text-white px-1.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </span>
                {isAdmin && (
                  <Link to="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-ui text-xs"
                    >
                      {t("adminPanel")}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  data-ocid="header.logout_button"
                  className="font-ui text-xs hover:text-destructive"
                >
                  {t("logout")}
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="header.login_button"
                    className="font-ui text-sm border-saffron text-saffron hover:bg-saffron hover:text-white"
                  >
                    {t("login")}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    data-ocid="header.register_button"
                    className="font-ui text-sm bg-saffron hover:bg-saffron-deep text-white"
                  >
                    {t("register")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-cream px-4 py-4 space-y-2">
          <Link
            to="/"
            className="block nav-link py-2 text-sm text-foreground hover:text-primary"
            data-ocid="header.home_link"
            onClick={() => setMobileOpen(false)}
          >
            {t("home")}
          </Link>

          <Link
            to="/family-tree"
            className="block nav-link py-2 text-sm text-foreground hover:text-primary"
            data-ocid="header.familytree_link"
            onClick={() => setMobileOpen(false)}
          >
            {t("familyTree")}
          </Link>

          <Link
            to="/gallery"
            className="block nav-link py-2 text-sm text-foreground hover:text-primary"
            data-ocid="header.gallery_link"
            onClick={() => setMobileOpen(false)}
          >
            {t("gallery")}
          </Link>

          <Link
            to="/search"
            className="block nav-link py-2 text-sm text-foreground hover:text-primary"
            data-ocid="header.search_link"
            onClick={() => setMobileOpen(false)}
          >
            {t("search")}
          </Link>

          {isLoggedIn && !isAdmin && (
            <Link
              to="/profile"
              className="block nav-link py-2 text-sm text-foreground hover:text-primary"
              data-ocid="header.profile_link"
              onClick={() => setMobileOpen(false)}
            >
              माझे प्रोफाइल / My Profile
            </Link>
          )}

          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              data-ocid="header.language_toggle"
              className="w-full justify-center gap-1.5 font-ui text-xs"
            >
              <Globe className="h-3.5 w-3.5" />
              {language === "mr" ? "English" : "मराठी"}
            </Button>

            {isLoggedIn ? (
              <>
                <div className="text-sm font-ui text-center text-muted-foreground py-1">
                  {currentUser?.name}
                </div>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-ui text-xs"
                    >
                      {t("adminPanel")}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  data-ocid="header.logout_button"
                  className="w-full font-ui text-xs text-destructive hover:bg-destructive/10"
                >
                  {t("logout")}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="header.login_button"
                    className="w-full font-ui text-sm border-saffron text-saffron hover:bg-saffron hover:text-white"
                  >
                    {t("login")}
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button
                    size="sm"
                    data-ocid="header.register_button"
                    className="w-full font-ui text-sm bg-saffron hover:bg-saffron-deep text-white"
                  >
                    {t("register")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
