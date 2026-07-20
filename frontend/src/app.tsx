import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "./components/layout/app-layout";
import { RouteErrorPage } from "./pages/route-error";

const HomePage = lazy(() => import("./pages/home").then((module) => ({ default: module.HomePage })));
const EventsPage = lazy(() => import("./pages/events").then((module) => ({ default: module.EventsPage })));
const RegisterPage = lazy(() => import("./pages/register").then((module) => ({ default: module.RegisterPage })));
const RegistrationSuccessPage = lazy(() => import("./pages/registration-success").then((module) => ({ default: module.RegistrationSuccessPage })));
const TrackPage = lazy(() => import("./pages/track").then((module) => ({ default: module.TrackPage })));
const AboutPage = lazy(() => import("./pages/about").then((module) => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import("./pages/contact").then((module) => ({ default: module.ContactPage })));
const NotFoundPage = lazy(() => import("./pages/not-found").then((module) => ({ default: module.NotFoundPage })));

const PageLoader = () => (
  <div className="page-shell grid min-h-[70vh] place-items-center" role="status">
    <div className="text-center"><span className="mx-auto block size-9 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600 dark:border-white/10 dark:border-t-mint-300" /><p className="mt-4 text-sm font-semibold text-slate-500">Loading EventPass…</p></div>
  </div>
);

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/events", element: <EventsPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/registration-success", element: <RegistrationSuccessPage /> },
      { path: "/track", element: <TrackPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);

export const App = () => (
  <Suspense fallback={<PageLoader />}>
    <RouterProvider router={router} />
    <Toaster position="top-right" richColors closeButton />
  </Suspense>
);
