import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/protected-route";
import { AuthProvider } from "./context/auth";

const Dashboard=lazy(()=>import("./pages/dashboard").then(m=>({default:m.DashboardPage})));
const Registrations=lazy(()=>import("./pages/registrations").then(m=>({default:m.RegistrationsPage})));
const Events=lazy(()=>import("./pages/events").then(m=>({default:m.EventsPage})));
const Login=lazy(()=>import("./pages/login").then(m=>({default:m.LoginPage})));
const loader=<div className="grid min-h-[60vh] place-items-center"><div className="size-9 animate-spin rounded-full border-3 border-slate-200 border-t-lime-400"/></div>;
const router=createBrowserRouter([
  {path:"/login",element:<Login/>},
  {element:<ProtectedRoute><Layout/></ProtectedRoute>,children:[
    {path:"/",element:<Dashboard/>},{path:"/registrations",element:<Registrations/>},{path:"/events",element:<Events/>}
  ]}
]);
export const App=()=> <AuthProvider><Suspense fallback={loader}><RouterProvider router={router}/><Toaster richColors closeButton position="top-right"/></Suspense></AuthProvider>;
