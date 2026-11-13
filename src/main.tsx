import "./styles.css";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { ChevronRight, CircleHelp, Languages, Search } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenu } from "@/components/command-menu";
import { WorkspaceContent } from "@/components/workspace-content";
import { translate, type Snapshot } from "@/types";

function readSidebarPreference() {
  try {
    return localStorage.getItem("gradeflow-sidebar-open") !== "false";
  } catch {
    return true;
  }
}

function App({ snapshot }: { snapshot: Snapshot }) {
  const t = translate(snapshot.lang);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarPreference);
  const changeSidebar = (open: boolean) => {
    setSidebarOpen(open);
    try {
      localStorage.setItem("gradeflow-sidebar-open", String(open));
    } catch {
      /* Optional preference. */
    }
  };
  return (
    <TooltipProvider delayDuration={250}>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={changeSidebar}
        style={
          {
            "--sidebar-width": "15.5rem",
            "--sidebar-width-icon": "4rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar snapshot={snapshot} />
        <SidebarInset className="shell">
          <header className="topbar">
            <div className="topbar-start">
              <SidebarTrigger
                aria-label={t("toggleNavigation")}
                title={t("toggleNavigation")}
              />
              <div className="topbar-divider" />
              <div className="breadcrumb">
                <span>{t("teacherSpace")}</span>
                <ChevronRight />
                <b>{t(snapshot.view)}</b>
              </div>
            </div>
            <div className="top-actions">
              <Button
                className="command-trigger"
                variant="outline"
                onClick={() => setSearchOpen(true)}
                aria-label={t("commandTitle")}
              >
                <Search />
                <span>{t("commandTitle")}</span>
                <kbd>{navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} K</kbd>
              </Button>
              <span className="save-state" id="save-state" role="status" />
              <Button
                className="language"
                variant="ghost"
                onClick={() => snapshot.onAction("language")}
              >
                <Languages />
                <span>{t("language")}</span>
              </Button>
              <Button
                className="header-help"
                variant="ghost"
                size="icon"
                aria-label={t("help")}
                onClick={() => snapshot.onAction("view", { view: "help" })}
              >
                <CircleHelp />
              </Button>
            </div>
          </header>
          <main id="main" className="main" tabIndex={-1}>
            <WorkspaceContent html={snapshot.html} />
          </main>
        </SidebarInset>
        <CommandMenu
          snapshot={snapshot}
          open={searchOpen}
          onOpenChange={setSearchOpen}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
window.GradeUI = {
  render(snapshot: Snapshot) {
    flushSync(() => root.render(<App snapshot={snapshot} />));
  },
};
