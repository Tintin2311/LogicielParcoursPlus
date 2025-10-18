import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Target, Award, Tag, Settings, Users, Palette, Star, Search, Info } from "lucide-react";
import { supabase } from "./supabaseClient";

type PageSetter = (page: string) => void;

/* ============ Types ============ */
type Folder = { id: string; nom: string | null; parent_id: string | null };
type GroupRow = { id: string; name: string | null; folder_id: string | null };

type ModesActifs = {
  tentatives: boolean;
  balises: boolean;
  parcours: boolean;
  personnalise: boolean;
};

type PerGroupConfig = {
  modes: ModesActifs;
  pointsParParcours: number | null;
  updatedAt: string;
};

const LS_EVAL_CONFIGS = "EVAL_CONFIGS_V3";

/* ============ Helpers UI ============ */
const palettes = [
  { chip: "bg-purple-500", selectedCard: "bg-purple-500/15 border-purple-400", ring: "ring-purple-300/80", glow: "shadow-[0_0_34px_rgba(192,132,252,0.75)]", overlayFrom: "from-purple-500/35" },
  { chip: "bg-orange-500", selectedCard: "bg-orange-500/15 border-orange-400", ring: "ring-orange-300/80", glow: "shadow-[0_0_34px_rgba(251,146,60,0.75)]", overlayFrom: "from-orange-500/35" },
  { chip: "bg-emerald-500", selectedCard: "bg-emerald-500/15 border-emerald-400", ring: "ring-emerald-300/80", glow: "shadow-[0_0_34px_rgba(16,185,129,0.75)]", overlayFrom: "from-emerald-500/35" },
  { chip: "bg-blue-500", selectedCard: "bg-blue-500/15 border-blue-400", ring: "ring-sky-300/80", glow: "shadow-[0_0_34px_rgba(56,189,248,0.75)]", overlayFrom: "from-sky-500/35" },
  { chip: "bg-pink-500", selectedCard: "bg-pink-500/15 border-pink-400", ring: "ring-pink-300/80", glow: "shadow-[0_0_34px_rgba(244,114,182,0.75)]", overlayFrom: "from-pink-500/35" },
  { chip: "bg-cyan-500", selectedCard: "bg-cyan-500/15 border-cyan-400", ring: "ring-cyan-300/80", glow: "shadow-[0_0_34px_rgba(34,211,238,0.75)]", overlayFrom: "from-cyan-500/35" },
];
const hashIndex = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % palettes.length;
};
const shortCode = (name?: string | null) => {
  const n = (name || "").trim();
  const m = n.match(/(\d+\s*[A-Z])|(\d+[A-Z])/i);
  if (m) return m[0].replace(/\s+/g, "").toUpperCase();
  const letters = n.replace(/[^\p{L}\p{N}]/gu, "");
  return letters.slice(0, 3).toUpperCase() || "GP";
};

/* ============ Page ============ */
const GestionPoints: React.FC<{ setPage: PageSetter }> = ({ setPage }) => {
  /* Modes */
  const [modesActifs, setModesActifs] = useState<ModesActifs>({ tentatives: false, balises: false, parcours: false, personnalise: true });
  const [pointsParParcours, setPointsParParcours] = useState<number>(10);

  /* Data */
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* Sélection */
  const [selected, setSelected] = useState<string[]>([]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  /* Recherche & filtres */
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  type FilterMode = "all" | "configured" | "unconfigured";
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [showInfo, setShowInfo] = useState(false);

  /* Config locales (étoiles) */
  const [perGroupConfigs, setPerGroupConfigs] = useState<Record<string, PerGroupConfig>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_EVAL_CONFIGS);
      if (raw) setPerGroupConfigs(JSON.parse(raw));
    } catch {}
  }, []);
  const persistConfigs = (next: Record<string, PerGroupConfig>) => {
    setPerGroupConfigs(next);
    try {
      localStorage.setItem(LS_EVAL_CONFIGS, JSON.stringify(next));
    } catch {}
  };

  /* Chargement Supabase */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [fRes, gRes] = await Promise.all([
          supabase.from("folders").select("id,nom,parent_id"),
          supabase.from("groups").select("id,name,folder_id").order("name", { ascending: true }),
        ]);
        if (fRes.error) throw fRes.error;
        if (gRes.error) throw gRes.error;

        if (!cancelled) {
          setFolders((fRes.data || []).map((r: any) => ({ id: String(r.id), nom: r.nom ?? null, parent_id: r.parent_id ?? null })));
          setGroups((gRes.data || []).map((r: any) => ({ id: String(r.id), name: r.name ?? null, folder_id: r.folder_id ?? null })));
        }
      } catch (e: any) {
        if (!cancelled) setErrorMsg(e?.message || "Erreur chargement groupes / dossiers.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Chemins dossiers */
  const folderById = useMemo(() => Object.fromEntries(folders.map((f) => [f.id, f] as const)), [folders]);
  const pathOf = (folderId: string | null): string => {
    if (!folderId) return "Sans dossier";
    const names: string[] = [];
    let cur: Folder | undefined = folderById[folderId];
    while (cur) {
      names.unshift(cur.nom || "Dossier");
      cur = cur.parent_id ? folderById[cur.parent_id] : undefined;
    }
    return names.join(" / ") || "Sans dossier";
  };

  /* Liste filtrée par recherche + filtres */
  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = groups;
    if (q) {
      list = list.filter((g) => {
        const name = (g.name || "").toLowerCase();
        const code = shortCode(g.name).toLowerCase();
        const path = pathOf(g.folder_id).toLowerCase();
        return name.includes(q) || code.includes(q) || path.includes(q);
      });
    }
    if (filterMode === "configured") list = list.filter((g) => !!perGroupConfigs[g.id]);
    else if (filterMode === "unconfigured") list = list.filter((g) => !perGroupConfigs[g.id]);
    return list;
  }, [groups, query, filterMode, folders, perGroupConfigs]);

  /* Sélection groupe */
  const toggleGroup = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (next.length === 1) {
        const cfg = perGroupConfigs[next[0]];
        if (cfg) {
          setModesActifs(cfg.modes);
          setPointsParParcours(cfg.pointsParParcours ?? 10);
        }
      }
      return next;
    });
  };

  /* Carte Groupe */
  const GroupCard: React.FC<{ g: GroupRow }> = ({ g }) => {
    const isSel = selectedSet.has(g.id);
    const p = palettes[hashIndex(g.id)];
    const code = shortCode(g.name);
    const path = pathOf(g.folder_id);
    const isConfigured = !!perGroupConfigs[g.id];

    return (
      <button
        onClick={() => toggleGroup(g.id)}
        className={`relative p-3 rounded-xl border-2 transition-all text-left overflow-visible ${
          isSel
            ? `${p.selectedCard} text-white hover:brightness-110 ring-4 ${p.ring} ring-offset-2 ring-offset-slate-900 ${p.glow}`
            : "bg-gray-800/30 border-gray-600 text-white/80 hover:border-gray-500"
        }`}
      >
        {isSel && <div className={`pointer-events-none absolute -inset-6 rounded-2xl blur-2xl opacity-70 bg-gradient-to-br ${p.overlayFrom} to-transparent`} />}

        {isConfigured && (
          <Star
            className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]"
            fill="currentColor"
            aria-label="Configuration enregistrée"
          />
        )}

        <div className="relative z-[1] flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full grid place-items-center text-white font-bold text-sm ${p.chip}`}>{code}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate">{g.name || "Groupe"}</div>
            <div className="text-[10px] text-white/60 truncate">{path}</div>
          </div>
          {isSel && <div className="w-3.5 h-3.5 rounded-full bg-green-500 ring-2 ring-white/60" aria-hidden />}
        </div>
      </button>
    );
  };

  /* Modes */
  const toggleMode = (modeId: keyof ModesActifs) => {
    if (modeId === "personnalise") {
      setModesActifs((p) => ({ tentatives: false, balises: false, parcours: false, personnalise: !p.personnalise }));
    } else {
      setModesActifs((p) => ({ ...p, [modeId]: !p[modeId], personnalise: false }));
    }
  };

  /* Enregistrer */
  const canSave =
    selected.length > 0 &&
    (modesActifs.tentatives || modesActifs.balises || modesActifs.parcours || modesActifs.personnalise) &&
    (!modesActifs.parcours || (Number.isFinite(pointsParParcours) && pointsParParcours >= 0));

  const handleSave = async () => {
    if (!canSave) return;
    const payload: PerGroupConfig = {
      modes: modesActifs,
      pointsParParcours: modesActifs.parcours ? pointsParParcours : null,
      updatedAt: new Date().toISOString(),
    };
    const next = { ...perGroupConfigs };
    selected.forEach((gid) => (next[gid] = payload));
    persistConfigs(next);
    alert(
      selected.length === 1
        ? `Configuration enregistrée pour "${groups.find((g) => g.id === selected[0])?.name || selected[0]}".`
        : `Configuration enregistrée pour ${selected.length} groupes.`
    );
  };

  /* Chip de filtre exclusif */
  const FilterChip: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition ${
        active
          ? "bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_18px_rgba(245,158,11,0.45)]"
          : "bg-white/5 text-white/70 border-white/15 hover:bg-white/10"
      }`}
      aria-pressed={active}
    >
      <span className={`inline-block w-3 h-3 rounded-full ${active ? "bg-amber-400" : "bg-white/30"}`} />
      {label}
    </button>
  );

  /* Sélecteur Groupes */
  const renderGroupSelector = () => (
    <div className="max-w-5xl mx-auto mb-8">
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-xl rounded-xl p-6 border border-white/10">
        {/* En-tête + contrôles */}
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Sélection des Groupes</h3>

          {/* Rechercher */}
          <button
            type="button"
            onClick={() => {
              setShowSearch((s) => !s);
              setTimeout(() => {
                const el = document.getElementById("group-search-input");
                if (el) (el as HTMLInputElement).focus();
              }, 0);
            }}
            className="ml-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                       bg-blue-600 hover:bg-blue-700 text-white border border-blue-400/40 shadow transition active:scale-[0.98]"
            aria-expanded={showSearch}
          >
            <Search className="w-4 h-4" />
            Rechercher un groupe
          </button>

          {/* Filtres exclusifs */}
          <div className="ml-2 flex items-center gap-2">
            <FilterChip
              active={filterMode === "configured"}
              label="Déjà configurés"
              onClick={() => setFilterMode(filterMode === "configured" ? "all" : "configured")}
            />
            <FilterChip
              active={filterMode === "unconfigured"}
              label="À configurer"
              onClick={() => setFilterMode(filterMode === "unconfigured" ? "all" : "unconfigured")}
            />
          </div>
        </div>

        {/* Panneau de recherche */}
        {showSearch && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                <input
                  id="group-search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher par nom, code (ex : 6B) ou dossier…"
                  className="w-full pl-9 pr-9 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50
                             focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-white/70 hover:text-white"
                    aria-label="Effacer la recherche"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white border border-white/10"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Espace pour aérer sous la barre */}
        <div className="mt-4" />

        {loading && <div className="text-white/80">Chargement des groupes…</div>}
        {errorMsg && <div className="text-red-300">❌ {errorMsg}</div>}

        {!loading && !errorMsg && (
          <>
            {visibleGroups.length === 0 ? (
              <div className="text-white/70">Aucun groupe à afficher.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {visibleGroups.map((g) => (
                  <GroupCard key={g.id} g={g} />
                ))}
              </div>
            )}

            {selected.length > 0 && (
              <div className="mt-4 text-center text-green-400 font-medium">
                {selected.length} groupe{selected.length > 1 ? "s" : ""} sélectionné
                {selected.length > 1 ? "s" : ""}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  /* Render */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: "4s" }} />
      </div>
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "50px 50px" }} />

      <div className="relative z-10 container mx-auto px-6 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => setPage("gestionResultats")}
            className="group flex items-center px-6 py-3 bg-white/5 backdrop-blur-sm rounded-xl text-white hover:bg-white/10 transition-all border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-2xl mb-5 shadow-2xl">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
              Attribution des points
            </h1>
          </div>

          {/* Bouton info — haut droite, bien visible */}
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            title="Informations"
            aria-label="Informations"
            className="grid place-items-center w-12 h-12 rounded-full
                       bg-white/10 hover:bg-white/15 border border-white/25 text-white
                       shadow-[0_0_24px_rgba(255,255,255,0.15)]"
          >
            <Info className="w-6 h-6" />
          </button>
        </div>

        {/* Groupes */}
        {renderGroupSelector()}

        {/* Cartes de modes */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tentatives */}
            <div
              onClick={() => toggleMode("tentatives")}
              className={`group relative bg-gradient-to-br from-purple-500/10 to-violet-600/10 backdrop-blur-xl rounded-xl border transition-all duration-500 overflow-hidden cursor-pointer ${
                modesActifs.tentatives
                  ? "border-purple-400/30 ring-4 ring-purple-300/80 ring-offset-2 ring-offset-slate-900 shadow-[0_0_36px_rgba(192,132,252,0.75)] scale-[1.02]"
                  : "border-white/10 hover:scale-[1.01]"
              }`}
              role="button"
              tabIndex={0}
            >
              {modesActifs.tentatives && <div className="pointer-events-none absolute -inset-8 rounded-2xl blur-2xl opacity-70 bg-gradient-to-br from-purple-500/35 to-transparent" />}
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div className={`flex items-center px-3 py-1 rounded-full border ${modesActifs.tentatives ? "bg-green-500/20 border-green-400/40 text-green-300" : "bg-gray-500/20 border-gray-400/40 text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${modesActifs.tentatives ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-sm font-semibold">{modesActifs.tentatives ? "Activé" : "Inactif"}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Points par Tentatives</h3>
                <p className="text-white/70 text-sm leading-relaxed">Attribuer des points selon l'efficacité (nb de tentatives).</p>
              </div>
            </div>

            {/* Balises */}
            <div
              onClick={() => toggleMode("balises")}
              className={`group relative bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-xl rounded-xl border transition-all duration-500 overflow-hidden cursor-pointer ${
                modesActifs.balises
                  ? "border-cyan-400/30 ring-4 ring-cyan-300/80 ring-offset-2 ring-offset-slate-900 shadow-[0_0_36px_rgba(34,211,238,0.75)] scale-[1.02]"
                  : "border-white/10 hover:scale-[1.01]"
              }`}
              role="button"
              tabIndex={0}
            >
              {modesActifs.balises && <div className="pointer-events-none absolute -inset-8 rounded-2xl blur-2xl opacity-70 bg-gradient-to-br from-cyan-500/35 to-transparent" />}
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Tag className="w-7 h-7 text-white" />
                  </div>
                  <div className={`flex items-center px-3 py-1 rounded-full border ${modesActifs.balises ? "bg-green-500/20 border-green-400/40 text-green-300" : "bg-gray-500/20 border-gray-400/40 text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${modesActifs.balises ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-sm font-semibold">{modesActifs.balises ? "Activé" : "Inactif"}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Points par Balises</h3>
                <p className="text-white/70 text-sm leading-relaxed">Utiliser les points configurés sur les balises.</p>
              </div>
            </div>

            {/* Points par Parcours */}
            <div
              onClick={() => toggleMode("parcours")}
              className={`group relative bg-gradient-to-br from-emerald-500/10 to-teal-600/10 backdrop-blur-xl rounded-xl border transition-all duration-500 overflow-hidden cursor-pointer ${
                modesActifs.parcours
                  ? "border-emerald-400/30 ring-4 ring-emerald-300/80 ring-offset-2 ring-offset-slate-900 shadow-[0_0_36px_rgba(16,185,129,0.75)] scale-[1.02]"
                  : "border-white/10 hover:scale-[1.01]"
              }`}
              role="button"
              tabIndex={0}
            >
              {modesActifs.parcours && <div className="pointer-events-none absolute -inset-8 rounded-2xl blur-2xl opacity-70 bg-gradient-to-br from-emerald-500/35 to-transparent" />}
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div className={`flex items-center px-3 py-1 rounded-full border ${modesActifs.parcours ? "bg-green-500/20 border-green-400/40 text-green-300" : "bg-gray-500/20 border-gray-400/40 text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${modesActifs.parcours ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-sm font-semibold">{modesActifs.parcours ? "Activé" : "Inactif"}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Points par Parcours</h3>
                <p className="text-white/70 text-sm leading-relaxed">Attribuer un nombre fixe de points à chaque parcours validé.</p>
                <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                  <label className="text-sm text-white/80">Valeur :</label>
                  <input
                    type="number"
                    min={0}
                    value={pointsParParcours}
                    onChange={(e) => setPointsParParcours(parseInt(e.target.value || "0", 10))}
                    disabled={!modesActifs.parcours}
                    className={`w-24 px-3 py-2 rounded-lg text-center border bg-white/10 text-white transition ${
                      modesActifs.parcours
                        ? "border-emerald-300/60 focus:outline-none focus:ring-4 focus:ring-emerald-300/60 shadow-[0_0_26px_rgba(16,185,129,0.55)]"
                        : "opacity-60 border-white/20 cursor-not-allowed"
                    }`}
                  />
                  <span className="text-white/70 text-sm">pts</span>
                </div>
              </div>
            </div>

            {/* Personnalisé */}
            <div
              onClick={() => toggleMode("personnalise")}
              className={`group relative bg-gradient-to-br from-orange-500/10 to-red-600/10 backdrop-blur-xl rounded-xl border transition-all duration-500 overflow-hidden cursor-pointer ${
                modesActifs.personnalise
                  ? "border-orange-400/30 ring-4 ring-orange-300/80 ring-offset-2 ring-offset-slate-900 shadow-[0_0_36px_rgba(251,146,60,0.75)] scale-[1.02]"
                  : "border-white/10 hover:scale-[1.01]"
              }`}
              role="button"
              tabIndex={0}
            >
              {modesActifs.personnalise && <div className="pointer-events-none absolute -inset-8 rounded-2xl blur-2xl opacity-70 bg-gradient-to-br from-orange-500/35 to-transparent" />}
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Palette className="w-7 h-7 text-white" />
                  </div>
                  <div className={`flex items-center px-3 py-1 rounded-full border ${modesActifs.personnalise ? "bg-green-500/20 border-green-400/40 text-green-300" : "bg-gray-500/20 border-gray-400/40 text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${modesActifs.personnalise ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-sm font-semibold">{modesActifs.personnalise ? "Activé" : "Inactif"}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Mode Personnalisé</h3>
                <p className="text-white/70 text-sm leading-relaxed">Configurer chaque parcours individuellement.</p>
                {modesActifs.personnalise && (
                  <div className="mt-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPage("configurationPersonnalisee");
                      }}
                      className="inline-flex items-center px-5 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-medium transition-all"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Configurer par parcours
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'action collante */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="backdrop-blur-md bg-slate-900/80 border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="w-full inline-flex items-center justify-center px-6 py-4 rounded-xl text-lg font-semibold text-white transition
                         bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                         disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50
                         ring-2 ring-white/10"
            >
              Enregistrer la configuration
            </button>
          </div>
        </div>
      </div>

    {/* Modale d'info */}
{showInfo && (
  <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm grid place-items-center px-4">
    <div className="max-w-2xl w-full bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-2xl border border-white/10 p-6 shadow-2xl">
      <h3 className="text-2xl font-bold mb-3">Comment fonctionne cette page&nbsp;?</h3>

      <ul className="space-y-2 text-white/90">
        <li>• Sélectionne un ou plusieurs <b>groupes</b>.</li>
        <li>• Active un ou plusieurs <b>modes de calcul des points</b> (cartes du bas).</li>
        <li>• Si <b>Points par parcours</b> est actif, saisis la valeur choisie dans le champ.</li>
        <li>• Tu peux créer des configurations uniques de calcul des points pour chaque parcours grâce au <b>Mode Personnalisé</b>.</li>
        <li>• Clique sur <b>Enregistrer la configuration</b> (bas de page).</li>
        <li>• Une <b>étoile jaune</b> ⭐ sur un groupe signifie qu’une configuration est enregistrée pour celui-ci.</li>
      </ul>

      <div className="mt-6 text-right">
        <button
          onClick={() => setShowInfo(false)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 border border-blue-400/40"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default GestionPoints;
