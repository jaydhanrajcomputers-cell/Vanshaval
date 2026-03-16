import { Toaster } from "@/components/ui/sonner";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AdminPage } from "./pages/AdminPage";
import { FamilyTreePage } from "./pages/FamilyTreePage";
import { GalleryPage } from "./pages/GalleryPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { RelationshipRequestPage } from "./pages/RelationshipRequestPage";
import { SearchPage } from "./pages/SearchPage";

// Export routing utilities so child components can use them
export { Link, useNavigate, useRouterState };

// ─── Root layout ───────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  ),
  notFoundComponent: () => <NotFoundPage />,
});

// ─── Route definitions ──────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <ProtectedRoute adminOnly>
      <AdminPage />
    </ProtectedRoute>
  ),
});

const familyTreeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/family-tree",
  component: FamilyTreePage,
});

const relationshipRequestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/relationship-request",
  component: () => (
    <ProtectedRoute>
      <RelationshipRequestPage />
    </ProtectedRoute>
  ),
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: GalleryPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

// ─── Router ────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  adminRoute,
  familyTreeRoute,
  relationshipRequestRoute,
  searchRoute,
  galleryRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </LanguageProvider>
  );
}
