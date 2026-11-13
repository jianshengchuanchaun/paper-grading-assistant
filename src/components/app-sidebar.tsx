// Adapted from satnaing/shadcn-admin AppSidebar and NavGroup (MIT).
// GradeFlow uses local view actions instead of TanStack routes or user accounts.
import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Download,
  FolderClock,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { translate, type Snapshot } from "@/types";

export const navigation = [
  { key: "workspace", icon: LayoutDashboard },
  { key: "library", icon: FolderClock },
  { key: "rubrics", icon: BookOpen },
  { key: "comments", icon: MessageSquareText },
  { key: "insights", icon: ChartNoAxesCombined },
  { key: "settings", icon: Settings2 },
];

export function AppSidebar({ snapshot }: { snapshot: Snapshot }) {
  const t = translate(snapshot.lang);
  const { setOpenMobile, isMobile } = useSidebar();
  const act = (action: string, data?: Record<string, string>) => {
    setOpenMobile(false);
    snapshot.onAction(action, data);
  };
  return (
    <Sidebar
      collapsible="icon"
      className="gradeflow-sidebar"
      mobileTitle={t("tools")}
      mobileDescription={t("navigationDescription")}
    >
      <SidebarHeader className="app-sidebar-header">
        <div className="brand-row">
          <button
            className="app-brand"
            aria-label={t("workspace")}
            onClick={() => act("view", { view: "workspace" })}
          >
            <img src={snapshot.logo} alt="" />
            <span className="brand-copy">
              <strong>{t("brand")}</strong>
              <small>GRADEFLOW</small>
            </span>
          </button>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("closeNavigation")}
              onClick={() => setOpenMobile(false)}
            >
              <X />
            </Button>
          )}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="class-switcher"
              size="lg"
              tooltip={t("switchBatch")}
              onClick={() => act("view", { view: "library" })}
            >
              <span className="class-icon">
                <GraduationCap />
              </span>
              <span className="class-copy">
                <strong>{snapshot.className}</strong>
                <small>{t("switchBatch")}</small>
              </span>
              <ChevronDown className="switch-chevron" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("tools")}</SidebarGroupLabel>
          <SidebarMenu>
            {navigation.map(({ key, icon: Icon }) => (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton
                  className={`nav-item ${snapshot.view === key ? "active" : ""}`}
                  data-view={key}
                  isActive={snapshot.view === key}
                  aria-current={snapshot.view === key ? "page" : undefined}
                  tooltip={t(key)}
                  onClick={() => act("view", { view: key })}
                >
                  <Icon />
                  <span>{t(key)}</span>
                  {key === "workspace" && snapshot.total > 0 && (
                    <span className="nav-count">{snapshot.total}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="support-group">
          <SidebarGroupLabel>{t("resources")}</SidebarGroupLabel>
          <SidebarMenu>
            {[
              { key: "help", action: "view", icon: CircleHelp },
              { key: "backup", action: "backup", icon: Download },
              { key: "restore", action: "restore", icon: Upload },
            ].map(({ key, action, icon: Icon }) => (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton
                  className={`nav-item ${snapshot.view === key ? "active" : ""}`}
                  data-view={key === "help" ? "help" : undefined}
                  data-action={action}
                  tooltip={t(key)}
                  onClick={(event) => {
                    event.stopPropagation();
                    act(action, action === "view" ? { view: key } : undefined);
                  }}
                >
                  <Icon />
                  <span>{t(key)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="app-sidebar-footer">
        <div className="device-note">
          <ShieldCheck />
          <div>
            <strong>{t("localFirst")}</strong>
            <p>{t("localNote")}</p>
          </div>
        </div>
        <div className="teacher-profile">
          <span className="teacher-avatar">
            <GraduationCap />
          </span>
          <div>
            <strong>{t("teacherSpace")}</strong>
            <span>{t("personalWorkspace")}</span>
          </div>
          <span className="profile-dot" />
        </div>
        <div className="side-footer">
          GRADEFLOW <span>v2.3.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
