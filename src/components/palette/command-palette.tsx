"use client";

import { Command as CommandIcon, Keyboard, Layers, Moon, Share2, Sun, SunMoon, Upload, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { CyberChefImportDialog } from "@/components/share/cyberchef-import-dialog";
import { ShareDialog } from "@/components/share/share-dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listOperations } from "@/core/registry";
import { matchShortcut } from "@/lib/shortcuts";
import { useRecipeStore } from "@/stores/recipe";
import { useUiStore } from "@/stores/ui";

const operations = listOperations().sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name));
const themeCommands = [
  { theme: "dark", label: "Use dark theme", icon: Moon },
  { theme: "light", label: "Use light theme", icon: Sun },
  { theme: "system", label: "Use system theme", icon: SunMoon },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<"share" | "import">();
  const { setTheme } = useTheme();
  const saved = useRecipeStore((state) => state.saved);
  const add = useRecipeStore((state) => state.add);
  const load = useRecipeStore((state) => state.load);
  const autoBake = useUiStore((state) => state.autoBake);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || !matchShortcut(event, "mod+k")) return;
      event.preventDefault();
      setOpen((value) => !value);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function select(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Open command palette"
          title="Commands (Ctrl/⌘ K)"
        >
          <CommandIcon aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>Add operations, load saved recipes, or change workspace settings.</DialogDescription>
        </DialogHeader>
        <Command label="Search commands">
          <CommandInput
            aria-label="Search commands"
            placeholder="Search commands or operations…"
            className="h-11 pr-9"
          />
          <CommandList className="max-h-[min(55dvh,24rem)] p-1.5">
            <CommandEmpty>No matching commands.</CommandEmpty>
            <CommandGroup heading="Add operation">
              {operations.map(({ id, name, category, description }) => (
                <CommandItem
                  key={id}
                  value={name}
                  keywords={[category, description]}
                  className="text-base font-semibold"
                  onSelect={() => select(() => add(id))}
                >
                  <Layers aria-hidden="true" />
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
            {saved.length > 0 && (
              <CommandGroup heading="Saved recipes">
                {saved.map(({ name, recipe }) => (
                  <CommandItem key={name} value={`Load ${name}`} onSelect={() => select(() => load(recipe))}>
                    <Keyboard aria-hidden="true" />
                    Load {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading="Workspace">
              {themeCommands.map(({ theme, label, icon: Icon }) => (
                <CommandItem key={theme} value={label} onSelect={() => select(() => setTheme(theme))}>
                  <Icon aria-hidden="true" />
                  {label}
                </CommandItem>
              ))}
              <CommandItem onSelect={() => select(() => useUiStore.setState({ autoBake: !autoBake }))}>
                <Zap aria-hidden="true" /> {autoBake ? "Disable auto-bake" : "Enable auto-bake"}
              </CommandItem>
              <CommandItem onSelect={() => select(() => setActiveDialog("share"))}>
                <Share2 aria-hidden="true" /> Share recipe
              </CommandItem>
              <CommandItem onSelect={() => select(() => setActiveDialog("import"))}>
                <Upload aria-hidden="true" /> Import CyberChef recipe
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
      {activeDialog === "share" && <ShareDialog onClose={() => setActiveDialog(undefined)} />}
      {activeDialog === "import" && <CyberChefImportDialog onClose={() => setActiveDialog(undefined)} />}
    </Dialog>
  );
}
