// Adapted from satnaing/shadcn-admin CommandMenu (MIT), using local actions.
import { useEffect, useRef } from "react";
import { ArrowUpRight, CircleHelp, FilePlus2, Upload } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { navigation } from "./app-sidebar";
import { translate, type Snapshot } from "@/types";

export function CommandMenu({
  snapshot,
  open,
  onOpenChange,
}: {
  snapshot: Snapshot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = translate(snapshot.lang);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "k" &&
        (event.ctrlKey || event.metaKey) &&
        !document.querySelector("dialog[open]")
      ) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);
  const run = (action: string, data?: Record<string, string>) => {
    onOpenChange(false);
    // Let Radix restore focus before a native grading dialog or file picker opens.
    requestAnimationFrame(() => snapshot.onAction(action, data));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="command-palette"
        showCloseButton={false}
        onOpenAutoFocus={() => {
          returnFocus.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocus.current?.isConnected
            ? returnFocus.current
            : document.querySelector<HTMLButtonElement>(".command-trigger");
          target?.focus();
        }}
      >
        <DialogTitle className="sr-only">{t("commandTitle")}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("commandDescription")}
        </DialogDescription>
        <Command>
          <CommandInput
            placeholder={t("commandPlaceholder")}
            aria-label={t("commandTitle")}
          />
          <CommandList>
            <CommandEmpty>{t("noMatches")}</CommandEmpty>
            <CommandGroup heading={t("tools")}>
              {navigation.map(({ key, icon: Icon }) => (
                <CommandItem
                  key={key}
                  value={`${t(key)} ${key}`}
                  onSelect={() => run("view", { view: key })}
                >
                  <Icon />
                  <span>{t(key)}</span>
                  <ArrowUpRight className="command-arrow" />
                </CommandItem>
              ))}
              <CommandItem
                value={`${t("help")} help`}
                onSelect={() => run("view", { view: "help" })}
              >
                <CircleHelp />
                <span>{t("help")}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t("quickActions")}>
              <CommandItem
                disabled={snapshot.busy}
                onSelect={() => run("new-batch")}
              >
                <FilePlus2 />
                <span>{t("newBatch")}</span>
              </CommandItem>
              <CommandItem
                disabled={snapshot.busy}
                onSelect={() => run("upload")}
              >
                <Upload />
                <span>{t("upload")}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="command-footer">
          <span>↑ ↓ &nbsp;{t("commandMove")}</span>
          <span>↵ &nbsp;{t("commandOpen")}</span>
          <span>Esc &nbsp;{t("close")}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
