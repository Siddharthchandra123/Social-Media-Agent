"use client";

import { useState } from "react";
import { Save, CheckCircle2, Sliders, Moon, Sun } from "lucide-react";
import { getBrandDefaults, setBrandDefaults } from "@/lib/preferences";
import { PageHeader } from "@/components/ui/page-header";
import { useTheme } from "@/state/theme-provider";
import { cn } from "@/lib/utils";

const TONES = [
  "Professional & Authoritative",
  "Witty & Energetic",
  "Educational & Actionable",
  "Empathetic & Storytelling",
];

const OBJECTIVES = [
  "Engagement & Comments",
  "Lead Generation & Conversions",
  "Brand Awareness & Reach",
  "Thought Leadership",
];

export default function SettingsPage() {
  const defaults = getBrandDefaults();
  const [tone, setTone] = useState(defaults.tone);
  const [objective, setObjective] = useState(defaults.objective);
  const [audience, setAudience] = useState(defaults.audience);
  const [saved, setSaved] = useState(false);

  const { theme, setTheme } = useTheme();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setBrandDefaults({ tone, objective, audience });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Settings"
        description="Configure your account and default content generation preferences."
      />

      <div className="max-w-2xl space-y-6">
        {/* Appearance */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Moon className="size-4 text-muted-foreground" aria-hidden="true" />
            Appearance
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              className={cn(
                "flex flex-col items-start gap-2.5 rounded-md border p-4 text-left transition-colors",
                theme === "light"
                  ? "border-ring/50 bg-accent shadow-soft"
                  : "border-border bg-background hover:border-input"
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-background text-foreground ring-1 ring-inset ring-border">
                <Sun className="size-4.5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Light
                </span>
                <span className="block text-xs text-muted-foreground">
                  Bright and clean for daytime work
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              className={cn(
                "flex flex-col items-start gap-2.5 rounded-md border p-4 text-left transition-colors",
                theme === "dark"
                  ? "border-ring/50 bg-accent shadow-soft"
                  : "border-border bg-background hover:border-input"
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-foreground text-background ring-1 ring-inset ring-border">
                <Moon className="size-4.5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Dark
                </span>
                <span className="block text-xs text-muted-foreground">
                  Deep, low-glare surfaces for focus
                </span>
              </span>
            </button>
          </div>
        </section>

        {/* Brand defaults */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Sliders className="size-4 text-muted-foreground" aria-hidden="true" />
            Default generation settings
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="settings-tone"
                className="text-label"
              >
                Tone
              </label>
              <select
                id="settings-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="settings-objective"
                className="text-label"
              >
                Objective
              </label>
              <select
                id="settings-objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {OBJECTIVES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="settings-audience"
                className="text-label"
              >
                Default audience
              </label>
              <input
                id="settings-audience"
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Who is your content for?"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 active:translate-y-px"
              >
                <Save className="size-4" aria-hidden="true" />
                Save settings
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Saved
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Coming soon */}
        <section className="rounded-lg border border-dashed border-border bg-card/40 p-6">
          <h2 className="mb-2 text-sm font-semibold">Advanced settings</h2>
          <p className="text-sm text-muted-foreground">
            Team management, API keys, and publishing automation are coming soon.
          </p>
        </section>
      </div>
    </div>
  );
}