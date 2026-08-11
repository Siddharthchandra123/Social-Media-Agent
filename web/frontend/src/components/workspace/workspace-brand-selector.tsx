"use client";

import { useWorkspaceBrand } from "@/state/workspace-brand-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Building2, Sparkles, Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function WorkspaceBrandSelector() {
  const {
    workspaces,
    activeWorkspace,
    brands,
    activeBrand,
    setActiveWorkspaceId,
    setActiveBrandId,
    createBrand,
    createWorkspace,
  } = useWorkspaceBrand();

  const [newBrandModal, setNewBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newWsModal, setNewWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    await createBrand(newBrandName.trim());
    setNewBrandName("");
    setNewBrandModal(false);
  };

  const handleCreateWs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    await createWorkspace(newWsName.trim());
    setNewWsName("");
    setNewWsModal(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Workspace Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-normal text-foreground shadow-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <Building2 className="size-3.5 text-muted-foreground" />
          <span className="max-w-[120px] truncate">{activeWorkspace?.name || "Workspace"}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => setActiveWorkspaceId(ws.id)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{ws.name}</span>
              {activeWorkspace?.id === ws.id && <span className="size-1.5 rounded-full bg-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setNewWsModal(true)} className="gap-2 text-primary">
            <Plus className="size-3.5" />
            <span>New Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Brand Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-normal text-foreground shadow-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <Sparkles className="size-3.5 text-primary" />
          <span className="max-w-[120px] truncate">{activeBrand?.name || "Brand"}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Brands in {activeWorkspace?.name}</DropdownMenuLabel>
          {brands.map((b) => (
            <DropdownMenuItem
              key={b.id}
              onClick={() => setActiveBrandId(b.id)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{b.name}</span>
              {activeBrand?.id === b.id && <span className="size-1.5 rounded-full bg-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setNewBrandModal(true)} className="gap-2 text-primary">
            <Plus className="size-3.5" />
            <span>New Brand</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick modal forms */}
      {newBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg border border-border">
            <h3 className="mb-4 text-lg font-medium">Create New Brand</h3>
            <form onSubmit={handleCreateBrand} className="space-y-4">
              <Input
                placeholder="Brand Name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                autoFocus
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNewBrandModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg border border-border">
            <h3 className="mb-4 text-lg font-medium">Create New Workspace</h3>
            <form onSubmit={handleCreateWs} className="space-y-4">
              <Input
                placeholder="Workspace Name"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                autoFocus
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNewWsModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
