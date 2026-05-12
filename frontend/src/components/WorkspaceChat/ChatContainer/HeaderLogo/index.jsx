import { useState, useEffect } from "react";
import useLogo from "@/hooks/useLogo";
import { Link } from "react-router-dom";
import paths from "@/utils/paths";
import { isMobile } from "react-device-detect";
import { SIDEBAR_TOGGLE_EVENT } from "@/components/Sidebar/SidebarToggle";

export default function HeaderLogo() {
  const { logo } = useLogo();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.localStorage.getItem("anythingllm_sidebar_toggle") !== "closed"
  );

  useEffect(() => {
    const handleToggle = (e) => setSidebarOpen(e.detail.open);
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, handleToggle);
    return () => window.removeEventListener(SIDEBAR_TOGGLE_EVENT, handleToggle);
  }, []);

  if (isMobile) return null;

  return (
    <div
      className={`hidden md:block absolute top-4 z-30 transition-all duration-500 ${
        sidebarOpen ? "left-4" : "left-12"
      }`}
    >
      <Link to={paths.home()} aria-label="Home">
        <img
          src={logo}
          alt="Logo"
          className="max-h-[35px] object-contain"
        />
      </Link>
    </div>
  );
}
