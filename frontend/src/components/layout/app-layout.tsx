import { Outlet, ScrollRestoration } from "react-router-dom";
import { Footer } from "./footer";
import { Header } from "./header";

export const AppLayout = () => (
  <div className="min-h-screen overflow-x-hidden">
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
    <ScrollRestoration />
  </div>
);
