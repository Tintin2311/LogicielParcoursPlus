// src/ConfigurationPersonnalisee.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  Save,
  Users,
  Search,
  Star,
  Info,
  Home,
  ChevronRight,
  Folder as FolderIcon,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ================= Types ================ */
type PageSetter = (p: string) => void;

type PF = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parent_folder_id: string | null;
  ordre: number | null;
};

type Course = { id: string; nom: string; folder_id: string | null };
type GroupRow = { id: string; name: string | null; folder_id: string | null };

type TentativesMode = "off" | "on" | "custom";
type RowConfig = {
  parcoursId: string;
  tentatives: TentativesMode;
  balises: boolean;
  pointsMode: "off" | "on";
  pointsValue: number;
};

/* =============== Small UI helpers =============== */
const palettes = [
  { chip: "bg-purple-500", selectedCard: "bg-purple-500/15 border-purple-400", ring: "ring-purple-300/80", glow: "shadow-[0_0_34px_rgba(192,132,252,0.75)]", overlayFrom: "from-purple-500/35" },
  { chip: "bg-orange-500", selectedCard: "bg-orange-500/15 border-orange-400", ring: "ring-orange-300/80", glow: "shadow-[0_0_34px_rgba(251,146,60,0.75)]", overlayFrom: "from-orange-500/35" },
  { chip: "bg-emerald-500", selectedCard: "bg-emerald-500/15 border-emerald-400", ring: "ring-emerald-300/80", glow: "shadow-[0_0_34px_rgba(16,185,129,0.75)]", overlayFrom: "from-emerald-500/35" },
  { chip: "bg-blue-500", selectedCard: "bg-blue-500/15 border-blue-400", ring: "ring-sky-300/80", glow: "shadow-[0_0_34px_rgba(56,189,248,0.75)]", overlayFrom: "from-sky-500/35" },
  { chip: "bg-pink-500", selectedCard: "bg-pink-500/15 border-pink-400", ring: "ring-pink-300/80", glow: "shadow-[0_0_34px_rgba(244,114,182,0.75)]", overlayFrom: "from-sky-500/35" },
  { chip: "bg-cyan-500", selectedCard: "bg-cyan-500/15 border-cyan-400", ring: "ring-cyan-300/80", glow: "shadow-[0_0_34px_rgba(34,211,238,0.75)]", overlayFrom: "from-cyan-500/35" },
];
const hashIndex = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % palettes.length;
};
const shortCode = (name?: string | null) => {
  const n = (name || "").trim();
  const m = n.match(/(\d+\s*[A-Za-z])|(\d+[A-Za-z])/);
  if (m) return m[0].replace(/\s+/g, "").toUpperCase();
  const letters = n.replace(/[^\p{L}\p{N}]/gu, "");
  return letters.slice(0, 3).toUpperCase() || "GP";
};

function ChipCheck({ checked }: { checked: boolean }) {
  return checked ? (
    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  ) : (
    <Circle className="w-4 h-4 text-white/60" />
  );
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${
        checked ? "bg-emerald-500/90 border-emerald-400" : "bg-white/10 border-white/20"
      } text-white`}
      aria-pressed={checked}
    >
      {checked ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 opacity-70" />}
    </button>
  );
}

function Switch({
  checked,
  onChange,
  onLabel = "On",
  offLabel = "Off",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-9 w-20 rounded-full transition-all shadow-inner ${
        checked ? "bg-emerald-500/80 hover:bg-emerald-500" : "bg-rose-500/70 hover:bg-rose-500"
      }`}
    >
      <span
        className={`absolute inset-y-1 ${checked ? "right-1" : "left-1"} w-6 h-6 rounded-full bg-white shadow transition-all`}
      />
      <span className={`absolute inset-y-0 flex items-center justify-center w-1/2 text-[11px] font-bold text-white/90 ${checked ? "left-0" : "right-0"}`}>
        {checked ? onLabel : offLabel}
      </span>
    </button>
  );
}

function SegmentedTriState({
  value,
  onChange,
}: {
  value: TentativesMode;
  onChange: (v: TentativesMode) => void;
}) {
  return (
    <div className="inline-flex rounded-xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur">
      <button type="button" onClick={() => onChange("off")} className={`px-3 py-2 text-sm font-semibold transition ${value === "off" ? "bg-rose-500/80 text-white" : "text-white/70 hover:text-white"}`}>Off</button>
      <button type="button" onClick={() => onChange("on")} className={`px-3 py-2 text-sm font-semibold border-x border-white/10 transition ${value === "on" ? "bg-emerald-500/80 text-white" : "text-white/70 hover:text-white"}`}>On</button>
      <button type="button" onClick={() => onChange("custom")} className={`px-3 py-2 text-sm font-semibold transition ${value === "custom" ? "bg-indigo-500/80 text-white" : "text-white/70 hover:text-white"}`}>Perso</button>
    </div>
  );
}

/* =============== Main =============== */
const ConfigurationPersonnalisee: React.FC<{ setPage: PageSetter }> = ({ setPage }) => {
  // Chargement supabase
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [folders, setFolders] = useState<PF[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Navigation dossiers
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Sélection
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());

  // Personnalisation
  const [rows, setRows] = useState<Record<string, RowConfig>>({});

  // UI groupes (style d’avant)
  const [query, setQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selectedGroups), [selectedGroups]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) throw new Error("Non connecté.");

        const [{ data: f }, { data: p }, { data: g }] = await Promise.all([
          supabase.from("parcours_folders").select("id, name, description, color, icon, parent_folder_id, ordre").order("ordre", { ascending: true }),
          supabase.from("parcours").select("id, nom, folder_id").order("nom", { ascending: true }),
          supabase.from("groups").select("id, name, folder_id, teacher_id").eq("teacher_id", userId).order("name", { ascending: true }),
        ]);

        setFolders(
          (f ?? []).map((r: any) => ({
            id: String(r.id),
            name: r.name ?? "Dossier",
            description: r.description ?? null,
            color: r.color ?? null,
            icon: r.icon ?? null,
            parent_folder_id: r.parent_folder_id ? String(r.parent_folder_id) : null,
            ordre: r.ordre ?? 0,
          }))
        );
        setCourses((p ?? []).map((r: any) => ({ id: String(r.id), nom: r.nom ?? "Parcours", folder_id: r.folder_id ? String(r.folder_id) : null })));
        setGroups((g ?? []).map((r: any) => ({ id: String(r.id), name: r.name ?? null, folder_id: r.folder_id ? String(r.folder_id) : null })));
      } catch (e: any) {
        setErr(e?.message || "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Index
  const folderById = useMemo(() => Object.fromEntries(folders.map((x) => [x.id, x] as const)), [folders]);
  const childrenByFolder = useMemo(() => {
    const map: Record<string, Course[]> = {};
    for (const c of courses) {
      const k = String(c.folder_id ?? "null");
      (map[k] ||= []).push(c);
    }
    return map;
  }, [courses]);
  const subfoldersByParent = useMemo(() => {
    const map: Record<string, PF[]> = {};
    for (const f of folders) {
      const k = String(f.parent_folder_id ?? "null");
      (map[k] ||= []).push(f);
    }
    return map;
  }, [folders]);

  // Contenu visible (un seul niveau)
  const visibleFolders = useMemo(
    () => (subfoldersByParent[String(currentFolderId ?? "null")] ?? []).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)),
    [subfoldersByParent, currentFolderId]
  );
  const visibleCourses = useMemo(
    () => (childrenByFolder[String(currentFolderId ?? "null")] ?? []).slice(),
    [childrenByFolder, currentFolderId]
  );

  // Fil d’Ariane
  const breadcrumb = useMemo(() => {
    const trail: PF[] = [];
    let cur = currentFolderId ? folderById[currentFolderId] : null;
    while (cur) {
      trail.unshift(cur);
      cur = cur.parent_folder_id ? folderById[cur.parent_folder_id] : null;
    }
    return trail;
  }, [currentFolderId, folderById]);

  // Descendants d’un dossier (cascade)
  const getDescendantFolderIds = useCallback((id: string) => {
    const out: string[] = [id];
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      const subs = subfoldersByParent[cur] ?? [];
      for (const f of subs) {
        out.push(f.id);
        stack.push(f.id);
      }
    }
    return out;
  }, [subfoldersByParent]);

  const getDescendantCourseIds = useCallback((folderId: string) => {
    const fIds = getDescendantFolderIds(folderId);
    const out: string[] = [];
    for (const fid of fIds) {
      for (const c of childrenByFolder[String(fid ?? "null")] ?? []) out.push(c.id);
    }
    return out;
  }, [childrenByFolder, getDescendantFolderIds]);

  // Toggle dossier / parcours
  const toggleFolder = (id: string, next?: boolean) => {
    const foldersToTouch = getDescendantFolderIds(id);
    const coursesToTouch = getDescendantCourseIds(id);

    setSelectedFolderIds(prev => {
      const s = new Set(prev);
      const on = typeof next === "boolean" ? next : !s.has(id);
      for (const fid of foldersToTouch) on ? s.add(fid) : s.delete(fid);
      return s;
    });

    setSelectedCourseIds(prev => {
      const s = new Set(prev);
      const on = typeof next === "boolean" ? next : !selectedFolderIds.has(id);
      for (const cid of coursesToTouch) on ? s.add(cid) : s.delete(cid);
      return s;
    });

    // init rows si besoin
    setRows(prev => {
      const n = { ...prev };
      for (const cid of coursesToTouch) {
        if (!n[cid]) n[cid] = { parcoursId: cid, tentatives: "off", balises: false, pointsMode: "off", pointsValue: 0 };
      }
      return n;
    });
  };

  const toggleCourse = (id: string, val?: boolean) => {
    setSelectedCourseIds(prev => {
      const s = new Set(prev);
      const on = typeof val === "boolean" ? val : !s.has(id);
      if (on) s.add(id); else s.delete(id);
      return s;
    });
    setRows(prev => prev[id] ? prev : { ...prev, [id]: { parcoursId: id, tentatives: "off", balises: false, pointsMode: "off", pointsValue: 0 } });
  };

  // Tableau global des parcours sélectionnés
  const selectedCoursesList = useMemo(
    () => courses.filter(c => selectedCourseIds.has(c.id)).sort((a,b)=>a.nom.localeCompare(b.nom)),
    [courses, selectedCourseIds]
  );

  const updateRow = (id: string, patch: Partial<RowConfig>) =>
    setRows(p => ({ ...p, [id]: { ...(p[id] || { parcoursId: id, tentatives: "off", balises: false, pointsMode: "off", pointsValue: 0 }), ...patch } }));

  // Save (mock)
  const canSave = selectedCoursesList.length > 0;
  const handleSave = async () => {
    const payload = {
      selectedGroups,
      selectedFolders: [...selectedFolderIds],
      selectedParcours: [...selectedCourseIds],
      rows: selectedCoursesList.map(c => rows[c.id]),
      savedAt: new Date().toISOString(),
    };
    console.log("CONFIG PAYLOAD", payload);
    alert("Configuration enregistrée (mock).");
  };

  /* ============== GroupCard (style d'avant, inchangé) ============== */
  const GroupCard: React.FC<{ g: GroupRow }> = ({ g }) => {
    const isSel = selectedSet.has(g.id);
    const p = palettes[hashIndex(g.id)];
    const code = shortCode(g.name);
    // bonus étoile locale si besoin
    const isStar = false;
    return (
      <button
        onClick={() =>
          setSelectedGroups((prev) => (prev.includes(g.id) ? prev.filter((x) => x !== g.id) : [...prev, g.id]))
        }
        className={`relative p-3 rounded-xl border-2 transition-all text-left overflow-visible ${
          isSel
            ? `${p.selectedCard} text-white hover:brightness-110 ring-4 ${p.ring} ring-offset-2 ring-offset-slate-900 ${p.glow}`
            : "bg-gray-800/30 border-gray-600 text-white/80 hover:border-gray-500"
        }`}
      >
        {isSel && <div className={`pointer-events-none absolute -inset-6 rounded-2xl blur-2xl opacity-70 bg-gradient-to-br ${p.overlayFrom} to-transparent`} />}
        {isStar && <Star className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-yellow-300" fill="currentColor" />}
        <div className="relative z-[1] flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full grid place-items-center text-white font-bold text-sm ${p.chip}`}>{code}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate">{g.name || "Groupe"}</div>
            <div className="text-[10px] text-white/60 truncate">{g.folder_id ? "Dossier" : "Sans dossier"}</div>
          </div>
          {isSel && <div className="w-3.5 h-3.5 rounded-full bg-green-500 ring-2 ring-white/60" aria-hidden />}
        </div>
      </button>
    );
  };

  /* ============== Render ============== */
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-950 via-purple-900/60 to-slate-900">
        <div className="text-white/90">Chargement…</div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-950 via-purple-900/60 to-slate-900">
        <div className="text-rose-300">{err}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900/60 to-slate-900 relative">
      {/* fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "42px 42px" }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8 pb-56">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setPage("GestionPoints")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/15 text-white hover:bg-white/12 transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-pink-300 to-fuchsia-300">
            Configuration Personnalisée
          </h1>

          <button onClick={handleSave} disabled={!canSave} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60">
            <Save className="w-5 h-5" />
            Enregistrer
          </button>
        </div>

        {/* Groupes — même style qu’avant */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Sélection des Groupes</h3>
            <div className="relative ml-auto w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un groupe…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {groups
              .filter((g) => (g.name || "").toLowerCase().includes(query.toLowerCase()))
              .map((g) => <GroupCard key={g.id} g={g} />)}
          </div>

          {selectedGroups.length > 0 && (
            <div className="mt-4 text-center text-green-400 font-medium">
              {selectedGroups.length} groupe{selectedGroups.length > 1 ? "s" : ""} sélectionné{selectedGroups.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 text-white/80 mb-4">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15"
          >
            <Home className="w-4 h-4" />
            Racine
          </button>
          {breadcrumb.map((f) => (
            <React.Fragment key={f.id}>
              <ChevronRight className="w-4 h-4 opacity-60" />
              <button
                onClick={() => setCurrentFolderId(f.id)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
              >
                {f.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Dossiers (grosses cartes + checkbox) */}
        <h3 className="text-white font-bold text-lg mb-3">Dossiers de parcours</h3>
        {visibleFolders.length === 0 ? (
          <div className="text-white/60 mb-6">Aucun sous-dossier ici.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {visibleFolders.map((f) => {
              const checked = selectedFolderIds.has(f.id);
              return (
                <div
                  key={f.id}
                  className={`relative overflow-hidden rounded-2xl border p-5 transition
                    ${checked ? "border-emerald-400 bg-emerald-400/10 shadow-[0_0_34px_rgba(16,185,129,0.35)]" : "border-white/12 bg-white/5 hover:bg-white/7"}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 grid place-items-center text-white">
                      <FolderIcon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-white font-extrabold text-lg truncate">{f.name}</h4>
                        <Checkbox checked={checked} onChange={(v) => toggleFolder(f.id, v)} />
                      </div>
                      <p className="text-white/70 text-sm mt-1 line-clamp-2">{f.description || "Dossier de parcours"}</p>
                      <div className="mt-4 text-xs text-white/60">
                        <Info className="inline w-3.5 h-3.5 mr-1 opacity-70" />
                        Cliquer sur le **nom** du dossier pour l’ouvrir.
                      </div>
                      <button
                        className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/80 hover:bg-white/15"
                        onClick={() => setCurrentFolderId(f.id)}
                      >
                        Ouvrir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Parcours du niveau courant (sélection locale) */}
        <h3 className="text-white font-bold text-lg mb-2">
          Parcours — {currentFolderId ? folderById[currentFolderId]?.name : "Racine"}
        </h3>

        <div className="overflow-hidden rounded-2xl border border-white/12 bg-white/5 backdrop-blur mb-12">
          <div className="grid grid-cols-12 px-6 py-3 text-xs md:text-sm font-semibold text-white/80 bg-white/5 border-b border-white/10">
            <div className="col-span-7 md:col-span-6">Parcours</div>
            <div className="col-span-5 md:col-span-6">Action</div>
          </div>

          {visibleCourses.length === 0 ? (
            <div className="p-6 text-white/60">Aucun parcours à ce niveau.</div>
          ) : (
            visibleCourses.map((p, i) => {
              const checked = selectedCourseIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-12 items-center px-6 py-3 border-b border-white/8 ${i % 2 ? "bg-white/5" : ""}`}
                >
                  <div className="col-span-7 md:col-span-6 flex items-center gap-3">
                    <ChipCheck checked={checked} />
                    <div>
                      <div className="text-white font-semibold">{p.nom}</div>
                      <div className="text-white/40 text-xs">ID: {p.id}</div>
                    </div>
                  </div>
                  <div className="col-span-5 md:col-span-6 flex items-center gap-3">
                    <button
                      className={`px-3 py-1.5 rounded-lg border ${checked ? "bg-emerald-500/20 border-emerald-400 text-emerald-200" : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"}`}
                      onClick={() => toggleCourse(p.id)}
                    >
                      {checked ? "Retirer de la sélection" : "Ajouter à la sélection"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ======= Tableau GLOBAL des parcours sélectionnés ======= */}
        <h3 className="text-white font-bold text-lg mb-2">Tous les parcours sélectionnés</h3>
        <div className="overflow-hidden rounded-2xl border border-white/12 bg-white/5 backdrop-blur">
          <div className="grid grid-cols-12 px-6 py-3 text-xs md:text-sm font-semibold text-white/80 bg-white/5 border-b border-white/10">
            <div className="col-span-4 md:col-span-4">Parcours</div>
            <div className="col-span-4 md:col-span-4">Points par tentatives</div>
            <div className="col-span-2 md:col-span-2">Balises</div>
            <div className="col-span-2 md:col-span-2">Points / parcours</div>
          </div>

          {selectedCoursesList.length === 0 ? (
            <div className="p-6 text-white/60">Aucun parcours sélectionné. Coche un dossier ou ajoute des parcours.</div>
          ) : (
            selectedCoursesList.map((p, i) => {
              const r = rows[p.id] || { parcoursId: p.id, tentatives: "off" as TentativesMode, balises: false, pointsMode: "off" as const, pointsValue: 0 };
              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-12 items-center px-6 py-4 border-b border-white/5 hover:bg-white/[0.06] transition ${i % 2 ? "bg-white/[0.03]" : "bg-transparent"}`}
                >
                  <div className="col-span-12 md:col-span-4 mb-3 md:mb-0">
                    <div className="text-white font-semibold">{p.nom}</div>
                    <div className="text-white/40 text-xs">ID: {p.id}</div>
                  </div>

                  <div className="col-span-12 md:col-span-4 mb-3 md:mb-0">
                    <SegmentedTriState value={r.tentatives} onChange={(v) => updateRow(p.id, { tentatives: v })} />
                    {r.tentatives === "custom" && <div className="text-[11px] text-indigo-300 mt-1">Barème personnalisé pour ce parcours.</div>}
                  </div>

                  <div className="col-span-6 md:col-span-2 mb-3 md:mb-0">
                    <Switch checked={r.balises} onChange={(v) => updateRow(p.id, { balises: v })} onLabel="On" offLabel="Off" />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={r.pointsMode === "on"}
                        onChange={(v) => updateRow(p.id, { pointsMode: v ? "on" : "off" })}
                        onLabel="On"
                        offLabel="Off"
                      />
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          value={r.pointsValue}
                          disabled={r.pointsMode !== "on"}
                          onChange={(e) => updateRow(p.id, { pointsValue: Number(e.target.value || "0") })}
                          className={`w-20 px-3 py-2 rounded-lg text-right text-white font-semibold outline-none border transition ${
                            r.pointsMode === "on" ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 opacity-60"
                          }`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 text-xs">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Résumé */}
        <div className="text-white/70 text-sm mt-4">
          {selectedCoursesList.length} parcours sélectionné{selectedCoursesList.length > 1 ? "s" : ""}.
        </div>
      </div>

      {/* Footer collant */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="backdrop-blur-md bg-slate-900/80 border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="w-full inline-flex items-center justify-center px-6 py-4 rounded-xl text-lg font-semibold text-white transition
                         bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                         disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 ring-2 ring-white/10"
            >
              Enregistrer la configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPersonnalisee;
