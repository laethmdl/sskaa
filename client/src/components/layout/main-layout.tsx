import { ReactNode, useEffect, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import Footer from "./footer";
import { LocaleProvider } from "@/hooks/use-locale";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const sidebarToggle = document.getElementById("open-sidebar");
      
      if (
        sidebar &&
        sidebarToggle &&
        !sidebar.contains(event.target as Node) &&
        !sidebarToggle.contains(event.target as Node) &&
        sidebarOpen
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Handle resize to show sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize on first render

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <LocaleProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col" dir="rtl">
        <div className="flex flex-1">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:mr-64" : ""}`}>
            <Header onSidebarOpen={() => setSidebarOpen(true)} />
            <main className="px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </LocaleProvider>
  );
};

export default MainLayout;
