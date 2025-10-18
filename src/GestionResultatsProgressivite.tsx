// src/GestionResultatsProgressivite.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Save, Plus, Trash2, ChevronDown, BookOpen, Layers,
  Users, CheckCircle, Award, Folder, Edit2, LayoutDashboard,
  AlertCircle, Search
} from "lucide-react";

/* =========================
          TYPES
========================= */
type ConditionType =
  | "pointsTotal"
  | "parcoursValidesPourcent"
  | "parcoursValidesNb"
  | "parcoursDossierSpecificNb";

interface ConditionDePassageNiveau {
  id: string;
  type: ConditionType;
  valeur: number;
  dossierCibleId?: string;
  descriptionDisplay: string;
}

interface NiveauProgressivite {
  id: string;
  nom: string;
  parcoursIds: string[]; // IDs des parcours
  dossierIds: string[];  // IDs des dossiers (inclut tous leurs parcours)
}

interface Progressivite {
  id: string;
  nom: string;
  description?: string;
  groupesCiblesIds: string[];
  niveaux: NiveauProgressivite[];
  // clé = index du niveau débloqué (2 débloqué par 1, etc.)
  conditionsDePassage: Record<number, ConditionDePassageNiveau[]>;
  createdAt: string;
  updatedAt: string;
}

interface Parcours {
  id: string;
  nom: string;
  dossierId?: string | null;
}

interface Dossier {
  id: string;
  nom: string;
}

interface Groupe {
  id: string;
  nom: string;
  couleur: "blue" | "green" | "purple" | "orange" | "red" | "cyan";
}

/* =========================
      DONNÉES LÉGÈRES
========================= */
const GROUPES_MOCK: Groupe[] = [
  { id: "6A", nom: "6ème A", couleur: "blue" },
  { id: "6B", nom: "6ème B", couleur: "green" },
  { id: "5A", nom: "5ème A", couleur: "purple" },
  { id: "5B", nom: "5ème B", couleur: "orange" },
  { id: "4A", nom: "4ème A", couleur: "red" },
  { id: "3A", nom: "3ème A", couleur: "cyan" },
];

const CONDITION_UI = [
  { type: "pointsTotal" as ConditionType, label: "Atteindre X points", icon: Award, color: "from-yellow-500 to-orange-500" },
  { type: "parcoursValidesPourcent" as ConditionType, label: "Valider X% des parcours", icon: CheckCircle, color: "from-green-500 to-emerald-500" },
  { type: "parcoursValidesNb" as ConditionType, label: "Valider X parcours", icon: CheckCircle, color: "from-blue-500 to-cyan-500" },
  { type: "parcoursDossierSpecificNb" as ConditionType, label: "Valider X parcours d'un dossier", icon: Folder, color: "from-purple-500 to-violet-500" },
];

const uid = (p = "id") => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const describeCond = (
  type: ConditionType,
  valeur: number,
  dossierId: string | undefined,
  dossiers: Dossier[]
) => {
  switch (type) {
    case "pointsTotal": return `Atteindre ${valeur} points`;
    case "parcoursValidesPourcent": return `Valider ${valeur}% des parcours`;
    case "parcoursValidesNb": return `Valider ${valeur} parcours`;
    case "parcoursDossierSpecificNb": {
      const nom = dossiers.find(d => d.id === dossierId)?.nom ?? "dossier ?";
      return `Valider ${valeur} parcours du dossier "${nom}"`;
    }
  }
};

/* =========================
  SELECTEUR PARCOURS/DOSSIERS
========================= */
type ParcoursSelectorProps = {
  niveau: NiveauProgressivite;
  allParcours: Parcours[];
  allDossiers: Dossier[];
  addParcours: (id: string) => void;
  removeParcours: (id: string) => void;
  addDossier: (id: string) => void;
  removeDossier: (id: string) => void;
  // Pour éviter les doublons entre niveaux :
  usedParcoursOutside: Set<string>;
  usedDossiersOutside: Set<string>;
};

const ParcoursSelectorDansNiveau: React.FC<ParcoursSelectorProps> = ({
  niveau,
  allParcours,
  allDossiers,
  addParcours,
  removeParcours,
  addDossier,
  removeDossier,
  usedParcoursOutside,
  usedDossiersOutside,
}) => {
  const [q, setQ] = useState("");

  // éléments déjà ajoutés
  const addedParcours = useMemo(
    () => niveau.parcoursIds.map(id => allParcours.find(p => p.id === id)).filter(Boolean) as Parcours[],
    [niveau.parcoursIds, allParcours]
  );
  const addedDossiers = useMemo(
    () => niveau.dossierIds.map(id => allDossiers.find(d => d.id === id)).filter(Boolean) as Dossier[],
    [niveau.dossierIds, allDossiers]
  );

  // éléments disponibles (on masque ceux utilisés dans d'autres niveaux)
  const availableDossiers = useMemo(
    () => allDossiers
      .filter(d => !usedDossiersOutside.has(d.id) || niveau.dossierIds.includes(d.id))
      .filter(d => d.nom.toLowerCase().includes(q.toLowerCase())),
    [allDossiers, usedDossiersOutside, q, niveau.dossierIds]
  );

  const availableParcours = useMemo(
    () => allParcours
      .filter(p => !usedParcoursOutside.has(p.id) || niveau.parcoursIds.includes(p.id))
      .filter(p => p.nom.toLowerCase().includes(q.toLowerCase())),
    [allParcours, usedParcoursOutside, q, niveau.parcoursIds]
  );

  return (
    <div className="space-y-6">
      {/* Ajout */}
      <div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
          <input
            placeholder="Rechercher un parcours ou un dossier…"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar p-1">
          {/* Dossiers */}
          {availableDossiers.map(d => {
            const already = niveau.dossierIds.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => (already ? removeDossier(d.id) : addDossier(d.id))}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition
                  ${already ? "bg-indigo-600/40 border-indigo-400" : "bg-indigo-600/20 border-indigo-400/40 hover:bg-indigo-600/30"}
                `}
              >
                <span className="flex items-center gap-2">
                  <Folder className="w-4 h-4" /> {d.nom}
                  <span className="text-xs opacity-70">(Dossier)</span>
                </span>
                {already ? <Trash2 className="w-4 h-4 opacity-80" /> : <Plus className="w-4 h-4 opacity-80" />}
              </button>
            );
          })}

          {/* Parcours */}
          {availableParcours.map(p => {
            const already = niveau.parcoursIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => (already ? removeParcours(p.id) : addParcours(p.id))}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition
                  ${already ? "bg-emerald-600/40 border-emerald-400" : "bg-emerald-600/20 border-emerald-400/40 hover:bg-emerald-600/30"}
                `}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> {p.nom}
                  {p.dossierId && (
                    <span className="text-xs opacity-70">
                      ({allDossiers.find(d => d.id === p.dossierId)?.nom})
                    </span>
                  )}
                </span>
                {already ? <Trash2 className="w-4 h-4 opacity-80" /> : <Plus className="w-4 h-4 opacity-80" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Déjà ajoutés */}
      <div>
        <h5 className="text-white/90 font-semibold mb-2">Contenu actuel du {niveau.nom}</h5>
        {addedParcours.length === 0 && addedDossiers.length === 0 ? (
          <div className="text-center text-white/60 py-6 border border-dashed border-white/20 rounded-lg">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            Aucun contenu ajouté pour l’instant.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addedDossiers.map(d => (
              <div key={d.id} className="px-3 py-2 rounded-lg border bg-indigo-600/30 border-indigo-400/50 flex items-center justify-between">
                <span className="flex items-center gap-2"><Folder className="w-4 h-4" /> {d.nom} <span className="text-xs opacity-70">(Dossier)</span></span>
                <button onClick={() => removeDossier(d.id)} className="p-1 hover:bg-white/10 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {addedParcours.map(p => (
              <div key={p.id} className="px-3 py-2 rounded-lg border bg-emerald-600/30 border-emerald-400/50 flex items-center justify-between">
                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {p.nom}</span>
                <button onClick={() => removeParcours(p.id)} className="p-1 hover:bg-white/10 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(147,197,253,.3); border-radius: 10px; border: 2px solid rgba(255,255,255,.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(147,197,253,.5); }
      `}</style>
    </div>
  );
};

/* =========================
   PAGE CRÉER/MODIFIER
========================= */
type CreateEditProps = {
  setInternalPage: (p: "mesProgressivites") => void;
  progressiviteToEditId: string | null;
  onSave: (p: Progressivite) => void;

  // Catalogue partagé (local pour l’instant)
  dossiers: Dossier[];
  setDossiers: React.Dispatch<React.SetStateAction<Dossier[]>>;
  parcours: Parcours[];
  setParcours: React.Dispatch<React.SetStateAction<Parcours[]>>;
};

const CreerModifierProgressivite: React.FC<CreateEditProps> = ({
  setInternalPage,
  progressiviteToEditId,
  onSave,
  dossiers, setDossiers,
  parcours, setParcours,
}) => {
  const [progressivite, setProgressivite] = useState<Progressivite>(() => ({
    id: uid("prog"),
    nom: "",
    description: "",
    groupesCiblesIds: [],
    niveaux: [{ id: uid("niv"), nom: "Niveau 1", parcoursIds: [], dossierIds: [] }],
    conditionsDePassage: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState("");

  // CHARGER si édition (dans une vraie app, on vient d’un store/BDD)
  useEffect(() => {
    if (!progressiviteToEditId) return;
    // Ici tu brancheras ton chargement depuis Supabase / store global
    // Pour la démo, on laisse tel quel (sinon on injecterait via props).
  }, [progressiviteToEditId]);

  /* ----- Gestion catalogue local (dossiers/parcours) ----- */
  const [newDossierName, setNewDossierName] = useState("");
  const [newParcoursName, setNewParcoursName] = useState("");
  const [newParcoursDossierId, setNewParcoursDossierId] = useState<string>("");

  const addDossierLocal = () => {
    if (!newDossierName.trim()) return;
    setDossiers(prev => [...prev, { id: uid("dos"), nom: newDossierName.trim() }]);
    setNewDossierName("");
  };
  const removeDossierLocal = (id: string) => {
    // suppression + enlève des sélections dans les niveaux
    setDossiers(prev => prev.filter(d => d.id !== id));
    setParcours(prev => prev.map(p => p.dossierId === id ? { ...p, dossierId: null } : p));
    setProgressivite(prev => ({
      ...prev,
      niveaux: prev.niveaux.map(n => ({ ...n, dossierIds: n.dossierIds.filter(did => did !== id) }))
    }));
  };

  const addParcoursLocal = () => {
    if (!newParcoursName.trim()) return;
    setParcours(prev => [...prev, { id: uid("par"), nom: newParcoursName.trim(), dossierId: newParcoursDossierId || null }]);
    setNewParcoursName("");
  };
  const removeParcoursLocal = (id: string) => {
    setParcours(prev => prev.filter(p => p.id !== id));
    setProgressivite(prev => ({
      ...prev,
      niveaux: prev.niveaux.map(n => ({ ...n, parcoursIds: n.parcoursIds.filter(pid => pid !== id) }))
    }));
  };

  /* ----- Infos générales ----- */
  const onField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProgressivite(s => ({ ...s, [e.target.name]: e.target.value }));

  const toggleGroupe = (gid: string) =>
    setProgressivite(s => ({
      ...s,
      groupesCiblesIds: s.groupesCiblesIds.includes(gid)
        ? s.groupesCiblesIds.filter(x => x !== gid)
        : [...s.groupesCiblesIds, gid]
    }));

  /* ----- Niveaux ----- */
  const addNiveau = () =>
    setProgressivite(s => ({
      ...s,
      niveaux: [...s.niveaux, { id: uid("niv"), nom: `Niveau ${s.niveaux.length + 1}`, parcoursIds: [], dossierIds: [] }]
    }));

  const removeNiveau = (index: number) => {
    setProgressivite(s => {
      if (s.niveaux.length <= 1) return s;
      const nv = s.niveaux.filter((_, i) => i !== index)
        .map((n, i) => ({ ...n, nom: `Niveau ${i + 1}` }));
      // recaler conditions (indices)
      const newConds: Record<number, ConditionDePassageNiveau[]> = {};
      Object.entries(s.conditionsDePassage).forEach(([k, arr]) => {
        const idx = parseInt(k, 10);
        if (idx > index) newConds[idx - 1] = arr;
        if (idx < index) newConds[idx] = arr;
      });
      return { ...s, niveaux: nv, conditionsDePassage: newConds };
    });
  };

  const renameNiveau = (index: number, name: string) =>
    setProgressivite(s => {
      const nv = [...s.niveaux];
      nv[index] = { ...nv[index], nom: name };
      return { ...s, niveaux: nv };
    });

  const addParcoursTo = (nivIdx: number, pid: string) =>
    setProgressivite(s => {
      const nv = s.niveaux.map((n, i) =>
        i === nivIdx
          ? { ...n, parcoursIds: n.parcoursIds.includes(pid) ? n.parcoursIds : [...n.parcoursIds, pid] }
          : { ...n, parcoursIds: n.parcoursIds.filter(x => x !== pid) } // unique sur tous les niveaux
      );
      return { ...s, niveaux: nv };
    });

  const removeParcoursFrom = (nivIdx: number, pid: string) =>
    setProgressivite(s => {
      const nv = [...s.niveaux];
      nv[nivIdx] = { ...nv[nivIdx], parcoursIds: nv[nivIdx].parcoursIds.filter(x => x !== pid) };
      return { ...s, niveaux: nv };
    });

  const addDossierTo = (nivIdx: number, did: string) =>
    setProgressivite(s => {
      const nv = s.niveaux.map((n, i) =>
        i === nivIdx
          ? { ...n, dossierIds: n.dossierIds.includes(did) ? n.dossierIds : [...n.dossierIds, did] }
          : { ...n, dossierIds: n.dossierIds.filter(x => x !== did) } // unique également
      );
      return { ...s, niveaux: nv };
    });

  const removeDossierFrom = (nivIdx: number, did: string) =>
    setProgressivite(s => {
      const nv = [...s.niveaux];
      nv[nivIdx] = { ...nv[nivIdx], dossierIds: nv[nivIdx].dossierIds.filter(x => x !== did) };
      return { ...s, niveaux: nv };
    });

  // calcul pour empêcher les doublons entre niveaux
  const usedParcoursByOther = (nivIdx: number) =>
    new Set(progressivite.niveaux.flatMap((n, i) => (i === nivIdx ? [] : n.parcoursIds)));
  const usedDossiersByOther = (nivIdx: number) =>
    new Set(progressivite.niveaux.flatMap((n, i) => (i === nivIdx ? [] : n.dossierIds)));

  const countParcoursIn = (n: NiveauProgressivite) => {
    const viaDossiers = new Set(
      n.dossierIds.flatMap(did => parcours.filter(p => p.dossierId === did).map(p => p.id))
    );
    const direct = new Set(n.parcoursIds);
    return new Set([...viaDossiers, ...direct]).size;
  };

  /* ----- Conditions ----- */
  const addCondition = (unlockIndex: number, type: ConditionType) =>
    setProgressivite(s => {
      const cond: ConditionDePassageNiveau = {
        id: uid("cond"),
        type,
        valeur: type === "parcoursValidesPourcent" ? 80 : 1,
        dossierCibleId: type === "parcoursDossierSpecificNb" ? (dossiers[0]?.id ?? undefined) : undefined,
        descriptionDisplay: "", // rempli après
      };
      cond.descriptionDisplay = describeCond(cond.type, cond.valeur, cond.dossierCibleId, dossiers);
      const all = { ...s.conditionsDePassage };
      all[unlockIndex] = [...(all[unlockIndex] ?? []), cond];
      return { ...s, conditionsDePassage: all };
    });

  const updateCondition = (unlockIndex: number, condId: string, patch: Partial<ConditionDePassageNiveau>) =>
    setProgressivite(s => {
      const list = (s.conditionsDePassage[unlockIndex] ?? []).map(c =>
        c.id === condId ? { ...c, ...patch } : c
      );
      const fixed = list.map(c => ({
        ...c,
        descriptionDisplay: describeCond(c.type, c.valeur, c.dossierCibleId, dossiers),
      }));
      return { ...s, conditionsDePassage: { ...s.conditionsDePassage, [unlockIndex]: fixed } };
    });

  const removeCondition = (unlockIndex: number, condId: string) =>
    setProgressivite(s => {
      const kept = (s.conditionsDePassage[unlockIndex] ?? []).filter(c => c.id !== condId);
      const next = { ...s.conditionsDePassage };
      if (kept.length) next[unlockIndex] = kept; else delete next[unlockIndex];
      return { ...s, conditionsDePassage: next };
    });

  /* ----- Submit ----- */
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!progressivite.nom.trim()) return setErr("Le nom de la progressivité est requis.");
    if (progressivite.groupesCiblesIds.length === 0) return setErr("Sélectionne au moins une classe/groupe.");
    if (progressivite.niveaux.length === 0) return setErr("Ajoute au moins un niveau.");

    setIsLoading(true);
    const saved = { ...progressivite, updatedAt: new Date().toISOString() };
    onSave(saved);
    setIsLoading(false);
    setInternalPage("mesProgressivites");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => setInternalPage("mesProgressivites")}
            className="group flex items-center px-6 py-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" />
            Retour à Mes Progressivités
          </button>

          <div className="text-center flex-1">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              {progressiviteToEditId ? "Modifier" : "Créer"} une Progressivité
            </h1>
            <p className="text-white/70">Définis les étapes et les conditions de déblocage.</p>
          </div>

          <div className="w-40" />
        </div>

        {err && (
          <div className="bg-red-600/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" /> {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-10">
          {/* 0) Catalogue local (dossiers & parcours) */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-2xl font-bold mb-4">Catalogue (local)</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Folder className="w-4 h-4" /> Dossiers</h3>
                <div className="flex gap-2 mb-3">
                  <input value={newDossierName} onChange={e => setNewDossierName(e.target.value)} placeholder="Nom du dossier" className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20" />
                  <button type="button" onClick={addDossierLocal} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500">Ajouter</button>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto custom-scrollbar">
                  {dossiers.length === 0 && <p className="text-white/60 text-sm">Aucun dossier.</p>}
                  {dossiers.map(d => (
                    <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded border bg-white/10 border-white/20">
                      <span className="flex items-center gap-2"><Folder className="w-4 h-4" /> {d.nom}</span>
                      <button type="button" onClick={() => removeDossierLocal(d.id)} className="p-1 hover:bg-white/10 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Parcours</h3>
                <div className="flex gap-2 mb-3">
                  <input value={newParcoursName} onChange={e => setNewParcoursName(e.target.value)} placeholder="Nom du parcours" className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20" />
                  <select value={newParcoursDossierId} onChange={e => setNewParcoursDossierId(e.target.value)} className="px-3 py-2 rounded bg-white/10 border border-white/20">
                    <option value="">(sans dossier)</option>
                    {dossiers.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                  </select>
                  <button type="button" onClick={addParcoursLocal} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500">Ajouter</button>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto custom-scrollbar">
                  {parcours.length === 0 && <p className="text-white/60 text-sm">Aucun parcours.</p>}
                  {parcours.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded border bg-white/10 border-white/20">
                      <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {p.nom}
                        {p.dossierId && <span className="text-xs opacity-70">({dossiers.find(d => d.id === p.dossierId)?.nom})</span>}
                      </span>
                      <button type="button" onClick={() => removeParcoursLocal(p.id)} className="p-1 hover:bg-white/10 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 1) Informations générales */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-2xl font-bold mb-6">1. Informations générales</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2">Nom *</label>
                <input name="nom" value={progressivite.nom} onChange={onField} className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" placeholder="Ex : Progression Course d’orientation 5e" />
              </div>
              <div>
                <label className="block mb-2">Description</label>
                <input name="description" value={progressivite.description} onChange={onField} className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" placeholder="Optionnel" />
              </div>
            </div>

            <div className="mt-5">
              <label className="block mb-2 flex items-center gap-2"><Users className="w-4 h-4" />Classes/Groupes *</label>
              <div className="flex flex-wrap gap-2">
                {GROUPES_MOCK.map(g => {
                  const active = progressivite.groupesCiblesIds.includes(g.id);
                  const color = {
                    blue: "bg-blue-500/30 border-blue-400",
                    green: "bg-green-500/30 border-green-400",
                    purple: "bg-purple-500/30 border-purple-400",
                    orange: "bg-orange-500/30 border-orange-400",
                    red: "bg-red-500/30 border-red-400",
                    cyan: "bg-cyan-500/30 border-cyan-400",
                  }[g.couleur];
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroupe(g.id)}
                      className={`px-3 py-1.5 rounded border ${active ? color : "bg-white/10 border-white/20"}`}
                    >
                      {g.nom}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2) Niveaux & Contenu */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-2xl font-bold mb-6">2. Niveaux & contenu</h2>

            <div className="space-y-8">
              {progressivite.niveaux.map((niv, idx) => (
                <div key={niv.id} className="bg-white/10 rounded-lg border border-white/20 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-orange-300" />
                      <input
                        value={niv.nom}
                        onChange={e => renameNiveau(idx, e.target.value)}
                        className="bg-transparent border-b border-white/40 focus:border-cyan-400 outline-none text-lg"
                      />
                    </div>
                    {progressivite.niveaux.length > 1 && (
                      <button type="button" onClick={() => removeNiveau(idx)} className="p-2 rounded hover:bg-red-500/20 text-red-300">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Contenu ({countParcoursIn(niv)} parcours)
                  </h4>

                  <ParcoursSelectorDansNiveau
                    niveau={niv}
                    allParcours={parcours}
                    allDossiers={dossiers}
                    addParcours={(pid) => addParcoursTo(idx, pid)}
                    removeParcours={(pid) => removeParcoursFrom(idx, pid)}
                    addDossier={(did) => addDossierTo(idx, did)}
                    removeDossier={(did) => removeDossierFrom(idx, did)}
                    usedParcoursOutside={usedParcoursByOther(idx)}
                    usedDossiersOutside={usedDossiersByOther(idx)}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addNiveau}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
              >
                <Plus className="w-5 h-5" /> Ajouter un niveau
              </button>
            </div>
          </div>

          {/* 3) Conditions entre niveaux */}
          {progressivite.niveaux.length > 1 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-2xl font-bold mb-6">3. Conditions de déblocage</h2>

              {progressivite.niveaux.slice(0, -1).map((niv, i) => (
                <div key={niv.id} className="bg-white/10 rounded-lg border border-white/20 p-5 mb-5">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-yellow-300" />
                    Pour débloquer le <span className="font-bold">{progressivite.niveaux[i + 1].nom}</span>
                    <span className="text-white/60 text-sm ml-2">après {niv.nom}</span>
                  </h3>

                  <div className="space-y-3 mb-3">
                    {(progressivite.conditionsDePassage[i + 1] ?? []).map(c => (
                      <div key={c.id} className="bg-white/10 rounded border border-white/20 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                              {React.createElement(CONDITION_UI.find(x => x.type === c.type)!.icon, { className: "w-3 h-3" })}
                            </div>
                            <span className="font-medium">
                              {CONDITION_UI.find(x => x.type === c.type)!.label.replace("X", "").trim()}
                            </span>
                          </div>
                          <button type="button" onClick={() => removeCondition(i + 1, c.id)} className="p-1 hover:bg-white/10 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          {["pointsTotal", "parcoursValidesPourcent", "parcoursValidesNb"].includes(c.type) && (
                            <>
                              <span className="text-white/70">{c.type === "pointsTotal" ? "Atteindre" : "Valider"}</span>
                              <input
                                type="number"
                                className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-center"
                                value={c.valeur}
                                min={1}
                                max={c.type === "parcoursValidesPourcent" ? 100 : undefined}
                                onChange={e => updateCondition(i + 1, c.id, { valeur: parseInt(e.target.value || "0", 10) })}
                              />
                              <span className="text-white/70">
                                {c.type === "pointsTotal" ? "points" : c.type === "parcoursValidesPourcent" ? "%" : "parcours"}
                              </span>
                            </>
                          )}

                          {c.type === "parcoursDossierSpecificNb" && (
                            <>
                              <span className="text-white/70">Valider</span>
                              <input
                                type="number"
                                className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-center"
                                value={c.valeur}
                                min={1}
                                onChange={e => updateCondition(i + 1, c.id, { valeur: parseInt(e.target.value || "0", 10) })}
                              />
                              <span className="text-white/70">parcours du dossier</span>
                              <select
                                value={c.dossierCibleId ?? ""}
                                onChange={e => updateCondition(i + 1, c.id, { dossierCibleId: e.target.value })}
                                className="px-2 py-1 bg-white/10 border border-white/20 rounded"
                              >
                                {dossiers.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                              </select>
                            </>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-white/70 bg-white/5 rounded p-1 border border-white/10">
                          {c.descriptionDisplay}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {CONDITION_UI.map(ct => (
                      <button
                        key={ct.type}
                        type="button"
                        onClick={() => addCondition(i + 1, ct.type)}
                        className={`flex items-center gap-2 px-3 py-2 rounded bg-gradient-to-r ${ct.color} opacity-90 hover:opacity-100`}
                      >
                        {React.createElement(ct.icon, { className: "w-4 h-4" })}
                        <span className="text-sm">{ct.label.replace("X", "").trim()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enregistrer */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 disabled:opacity-60"
            >
              <Save className="w-6 h-6" />
              {isLoading ? "Sauvegarde…" : "Enregistrer la progressivité"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================
       MES PROGRESSIVITÉS
========================= */
type MesProps = {
  // ⚠️ setPage de l'App pour revenir à la page des barèmes
  setAppPage: (p: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  progressivites: Progressivite[];
};

const MesProgressivites: React.FC<MesProps> = ({
  setAppPage, onCreate, onEdit, onDelete, progressivites
}) => {
  const groupsToText = (ids: string[]) => ids.join(", ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Bouton retour (vers App.tsx) */}
      <div className="absolute top-8 left-8 z-50">
        <button
          onClick={() => setAppPage("gestionResultats")}
          className="flex items-center px-6 py-3 bg-white/10 rounded-full border border-white/20 hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour Accueil
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-600 rounded-2xl mb-6 shadow-2xl">
            <LayoutDashboard className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-3">
            Mes Progressivités
          </h1>
          <p className="text-xl text-white/70">Gérez vos parcours par niveaux et conditions.</p>
        </div>

        <div className="flex justify-center mb-10">
          <button onClick={onCreate} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
            <Plus className="w-5 h-5" /> Nouvelle Progressivité
          </button>
        </div>

        {progressivites.length === 0 ? (
          <div className="text-center text-white/60 py-16 border border-dashed border-white/20 rounded-xl">
            <BookOpen className="w-16 h-16 mx-auto mb-6 opacity-70" />
            <p className="text-2xl font-semibold mb-2">Aucune progressivité pour l’instant.</p>
            <p>Crée ta première progressivité pour démarrer.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {progressivites.map(p => (
              <div key={p.id} className="bg-white/10 rounded-2xl border border-white/20 p-6 hover:scale-[1.01] transition">
                <h3 className="text-2xl font-bold mb-1">{p.nom}</h3>
                <p className="text-white/70 text-sm mb-3">{p.description || "—"}</p>
                <p className="text-sm mb-1"><span className="opacity-70">Classes:</span> {groupsToText(p.groupesCiblesIds)}</p>
                <p className="text-sm mb-4"><span className="opacity-70">Niveaux:</span> {p.niveaux.length}</p>

                {Object.keys(p.conditionsDePassage).length > 0 && (
                  <div className="text-xs text-white/80 mb-4">
                    <span className="font-semibold flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-green-400" /> Conditions:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(p.conditionsDePassage).map(([i, arr]) => (
                        <li key={i}>
                          Pour niveau {parseInt(i) + 1} :
                          <ul className="ml-4 list-none">
                            {arr.map(c => <li key={c.id}>{c.descriptionDisplay}</li>)}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button onClick={() => onEdit(p.id)} className="px-3 py-2 rounded bg-blue-600/60 hover:bg-blue-600">
                    <Edit2 className="w-4 h-4 inline mr-1" /> Modifier
                  </button>
                  <button onClick={() => onDelete(p.id)} className="px-3 py-2 rounded bg-red-600/60 hover:bg-red-600">
                    <Trash2 className="w-4 h-4 inline mr-1" /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================
     COMPOSANT RACINE
========================= */
type RootProps = {
  // <<— Vient de App.tsx pour que "Retour Accueil" renvoie à la bonne page
  setPage: (page: string) => void;
};

const GestionResultatsProgressivite: React.FC<RootProps> = ({ setPage }) => {
  const [internalPage, setInternalPage] = useState<"mesProgressivites" | "creerModifier">("mesProgressivites");
  const [toEditId, setToEditId] = useState<string | null>(null);
  const [progressivites, setProgressivites] = useState<Progressivite[]>([]);

  // Catalogue local partagé (tu pourras remplacer par tes fetch Supabase)
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [parcours, setParcours] = useState<Parcours[]>([]);

  const saveProgressivite = (p: Progressivite) => {
    setProgressivites(prev => prev.some(x => x.id === p.id)
      ? prev.map(x => x.id === p.id ? p : x)
      : [...prev, p]
    );
  };

  const deleteProgressivite = (id: string) => {
    if (!window.confirm("Supprimer cette progressivité ?")) return;
    setProgressivites(prev => prev.filter(p => p.id !== id));
  };

  const createNew = () => { setToEditId(null); setInternalPage("creerModifier"); };
  const editExisting = (id: string) => { setToEditId(id); setInternalPage("creerModifier"); };

  return internalPage === "mesProgressivites" ? (
    <MesProgressivites
      setAppPage={setPage} // pour Retour Accueil -> "gestionResultats"
      onCreate={createNew}
      onEdit={editExisting}
      onDelete={deleteProgressivite}
      progressivites={progressivites}
    />
  ) : (
    <CreerModifierProgressivite
      setInternalPage={setInternalPage}
      progressiviteToEditId={toEditId}
      onSave={saveProgressivite}
      dossiers={dossiers}
      setDossiers={setDossiers}
      parcours={parcours}
      setParcours={setParcours}
    />
  );
};

export default GestionResultatsProgressivite;
