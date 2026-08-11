"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getAccessToken } from "@/lib/api";

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
}

export interface Brand {
  id: string;
  workspace_id: string;
  name: string;
  tone: string;
  target_audience: string;
}

export interface SocialAccount {
  id: string;
  brand_id: string;
  platform: string;
  platform_user_id: string;
  display_name: string | null;
  status: string;
}

interface WorkspaceBrandContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  brands: Brand[];
  activeBrand: Brand | null;
  socialAccounts: SocialAccount[];
  loading: boolean;
  error: string | null;
  setActiveWorkspaceId: (id: string) => void;
  setActiveBrandId: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  createBrand: (name: string, tone?: string, targetAudience?: string) => Promise<Brand>;
  refreshContext: () => Promise<void>;
  refreshSocialAccounts: () => Promise<void>;
}

const WorkspaceBrandContext = createContext<WorkspaceBrandContextType | undefined>(undefined);

export function WorkspaceBrandProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrandId, setActiveBrandIdState] = useState<string | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;
  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0] || null;

  const refreshContext = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const wsRes = await api.get<Workspace[]>("/workspaces");
      const wsList = wsRes.data;
      setWorkspaces(wsList);

      let currentWsId = activeWorkspaceId;
      if (!currentWsId || !wsList.some((w) => w.id === currentWsId)) {
        currentWsId = wsList[0]?.id || null;
        setActiveWorkspaceIdState(currentWsId);
      }

      if (currentWsId) {
        const brandRes = await api.get<Brand[]>(`/workspaces/${currentWsId}/brands`);
        const brandList = brandRes.data;
        setBrands(brandList);

        let currentBrandId = activeBrandId;
        if (!currentBrandId || !brandList.some((b) => b.id === currentBrandId)) {
          currentBrandId = brandList[0]?.id || null;
          setActiveBrandIdState(currentBrandId);
        }

        if (currentBrandId) {
          const accRes = await api.get<SocialAccount[]>(`/brands/${currentBrandId}/social-accounts`);
          setSocialAccounts(accRes.data);
        } else {
          setSocialAccounts([]);
        }
      } else {
        setBrands([]);
        setSocialAccounts([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, activeBrandId]);

  const refreshSocialAccounts = useCallback(async () => {
    if (!activeBrand) return;
    try {
      const accRes = await api.get<SocialAccount[]>(`/brands/${activeBrand.id}/social-accounts`);
      setSocialAccounts(accRes.data);
    } catch (err) {
      console.error("Failed to fetch social accounts", err);
    }
  }, [activeBrand]);

  useEffect(() => {
    refreshContext();
  }, []);

  // When active workspace changes, fetch brands and pick first brand
  useEffect(() => {
    if (!activeWorkspaceId) return;
    api.get<Brand[]>(`/workspaces/${activeWorkspaceId}/brands`).then((res) => {
      const brandList = res.data;
      setBrands(brandList);
      const firstBrand = brandList[0]?.id || null;
      setActiveBrandIdState(firstBrand);
    }).catch(console.error);
  }, [activeWorkspaceId]);

  // When active brand changes, fetch social accounts
  useEffect(() => {
    if (!activeBrandId) {
      setSocialAccounts([]);
      return;
    }
    api.get<SocialAccount[]>(`/brands/${activeBrandId}/social-accounts`).then((res) => {
      setSocialAccounts(res.data);
    }).catch(console.error);
  }, [activeBrandId]);

  const setActiveWorkspaceId = (id: string) => {
    setActiveWorkspaceIdState(id);
    localStorage.setItem("active_workspace_id", id);
  };

  const setActiveBrandId = (id: string) => {
    setActiveBrandIdState(id);
    localStorage.setItem("active_brand_id", id);
  };

  const createWorkspace = async (name: string): Promise<Workspace> => {
    const res = await api.post<Workspace>("/workspaces", { name });
    await refreshContext();
    setActiveWorkspaceId(res.data.id);
    return res.data;
  };

  const createBrand = async (name: string, tone?: string, targetAudience?: string): Promise<Brand> => {
    if (!activeWorkspace) throw new Error("No active workspace");
    const res = await api.post<Brand>(`/workspaces/${activeWorkspace.id}/brands`, {
      name,
      tone: tone || "Professional, engaging, authoritative",
      target_audience: targetAudience || "Professionals, founders, and creators",
    });
    await refreshContext();
    setActiveBrandId(res.data.id);
    return res.data;
  };

  return (
    <WorkspaceBrandContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        brands,
        activeBrand,
        socialAccounts,
        loading,
        error,
        setActiveWorkspaceId,
        setActiveBrandId,
        createWorkspace,
        createBrand,
        refreshContext,
        refreshSocialAccounts,
      }}
    >
      {children}
    </WorkspaceBrandContext.Provider>
  );
}

export function useWorkspaceBrand() {
  const context = useContext(WorkspaceBrandContext);
  if (!context) {
    throw new Error("useWorkspaceBrand must be used within a WorkspaceBrandProvider");
  }
  return context;
}
