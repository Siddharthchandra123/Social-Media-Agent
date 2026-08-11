"use client";

import { useState } from "react";
import { Save, CheckCircle2, Sliders } from "lucide-react";
import { getBrandDefaults, setBrandDefaults } from "@/lib/preferences";
import { PageHeader } from "@/components/ui/page-header";

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
        description="Configure your default content generation preferences."
      />

      <div className="max-w-2xl space-y-6">
        {/* Brand defaults */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Sliders className="size-4 text-muted-foreground" aria-hidden="true" />
            Default generation settings
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="settings-tone"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Tone
              </label>
              <select
                id="settings-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
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
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Objective
              </label>
              <select
                id="settings-objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
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
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Default audience
              </label>
              <input
                id="settings-audience"
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Who is your content for?"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Save className="size-4" aria-hidden="true" />
                Save settings
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Saved
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Coming soon */}
        <section className="rounded-xl border border-dashed border-border bg-card/40 p-6">
          <h2 className="mb-2 text-sm font-semibold">Advanced settings</h2>
          <p className="text-sm text-muted-foreground">
            Team management, API keys, and publishing automation are coming soon.
          </p>
        </section>
      </div>
    </div>
  );
}