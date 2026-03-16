import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  TreePine,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function LoginPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setIsPendingApproval(false);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "PENDING_APPROVAL") {
        setIsPendingApproval(true);
      } else {
        setError(t("loginError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen heritage-bg flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-heritage-lg overflow-hidden">
          {/* Header */}
          <div className="hero-gradient px-8 pt-8 pb-6 text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <TreePine className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              {t("loginTitle")}
            </h1>
            <p className="font-body text-white/80 mt-1 text-sm">
              {t("loginSubtitle")}
            </p>
          </div>

          <div className="saffron-divider" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Error state */}
            {error && (
              <Alert
                variant="destructive"
                data-ocid="login.error_state"
                className="border-destructive/30 bg-destructive/10"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-ui text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Pending approval state */}
            {isPendingApproval && (
              <Alert
                data-ocid="login.pending_state"
                className="border-amber-300 bg-amber-50 text-amber-900"
              >
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="font-ui text-sm space-y-1">
                  <p className="font-semibold">नोंदणी मंजुरीच्या प्रतीक्षेत आहे</p>
                  <p>
                    तुमची नोंदणी अद्याप ॲडमिनने मंजूर केलेली नाही. ॲडमिनने मंजुरी दिल्यानंतर
                    तुम्ही लॉगिन करू शकाल.
                  </p>
                  <p className="text-xs text-amber-700">
                    Your registration is pending admin approval. You can login
                    once the admin approves your registration.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="login-email"
                className="font-ui text-sm font-medium text-foreground"
              >
                {t("emailLabel")}
              </Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                autoComplete="email"
                data-ocid="login.email_input"
                className="font-ui text-sm border-border focus:border-saffron focus:ring-saffron"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="login-password"
                className="font-ui text-sm font-medium text-foreground"
              >
                {t("passwordLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  required
                  autoComplete="current-password"
                  data-ocid="login.password_input"
                  className="font-ui text-sm border-border focus:border-saffron focus:ring-saffron pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              data-ocid="login.submit_button"
              className="w-full bg-saffron hover:bg-saffron-deep text-white font-ui font-semibold py-2.5 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-ocid="login.loading_state"
                  />
                  {t("loginLoading")}
                </>
              ) : (
                t("loginButton")
              )}
            </Button>

            {/* Register link */}
            <p className="text-center font-ui text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link
                to="/register"
                data-ocid="login.register_link"
                className="text-saffron hover:text-saffron-deep font-semibold underline underline-offset-2 transition-colors"
              >
                {t("registerLink")}
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
