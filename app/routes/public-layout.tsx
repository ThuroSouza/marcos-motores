import { Outlet } from "react-router";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="conteudo" className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
