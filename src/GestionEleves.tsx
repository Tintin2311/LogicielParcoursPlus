// src/GestionEleves.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  UserPlus,
  Edit3,
  Trash2,
  Save,
  X,
  Copy,
  Check,
  Search,
} from "lucide-react";

/* =======================
   Types
   ======================= */
interface Eleve {
  id: string;
  name: string;
  code: string;
  group_id: string;
  teacher_id: string;
  genre: "M" | "F" | null;
}

interface Classe {
  id: string;
  name: string;
  teacher_id: string;
  color: string;
}

interface Professor {
  user_id: string;
  name: string;
  email: string;
}

type Props = {
  setPage: (page: string) => void;
  professeur: Professor;
  selectedGroup?: Classe;
};

const GestionEleves: React.FC<Props> = ({ setPage, professeur, selectedGroup }) => {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEleveId, setEditingEleveId] = useState<string | null>(null);
  const [editedEleveName, setEditedEleveName] = useState("");
  const [newEleveName, setNewEleveName] = useState("");
  const [newEleveGenre, setNewEleveGenre] = useState<"M" | "F" | null>("M");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Alerte si pas de groupe (la vraie redirection doit être gérée par le parent)
  useEffect(() => {
    if (!selectedGroup) {
      toast.error("Aucun groupe sélectionné. Retournez à la gestion des groupes.");
    }
  }, [selectedGroup]);

  /* ============ Fetch ============ */
  const fetchEleves = useCallback(async () => {
    if (!professeur?.user_id || !selectedGroup?.id) {
      setEleves([]);
      setIsLoaded(true);
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select("id, name, code, group_id, teacher_id, genre")
      .eq("teacher_id", professeur.user_id)
      .eq("group_id", selectedGroup.id);

    if (error) {
      console.error("Erreur lors du chargement des élèves :", error.message);
      toast.error("Erreur lors du chargement des élèves.");
      setEleves([]);
      setIsLoaded(true);
      return;
    }

    const mapped: Eleve[] =
      (data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        code: e.code,
        group_id: e.group_id,
        teacher_id: e.teacher_id,
        genre: (e.genre as "M" | "F" | null) ?? null,
      })) ?? [];

    setEleves(mapped);
    setIsLoaded(true);
  }, [professeur, selectedGroup]);

  useEffect(() => {
    setIsLoaded(false);
    if (selectedGroup) {
      fetchEleves();
    }
  }, [fetchEleves, selectedGroup]);

  /* ============ Utils ============ */
  const generateEleveCode = useCallback(() => {
    let newCode: string;
    do {
      newCode = Math.floor(100000 + Math.random() * 900000).toString();
    } while (eleves.some((e) => e.code === newCode));
    return newCode;
  }, [eleves]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copié !");
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredEleves = eleves.filter(
    (eleve) =>
      eleve.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleve.code.includes(searchTerm)
  );

  /* ============ CRUD ============ */
  const addEleveToSupabase = async () => {
    const trimmedName = newEleveName.trim();
    if (!trimmedName) {
      toast.error("Veuillez entrer un nom pour l'élève.");
      return;
    }
    if (!professeur?.user_id || !selectedGroup?.id) {
      toast.error("Erreur : professeur/groupe manquant.");
      return;
    }
    if (eleves.some((e) => e.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Un élève avec ce nom existe déjà dans ce groupe.");
      return;
    }

    const code = generateEleveCode();

    const { error } = await supabase.from("students").insert({
      name: trimmedName,
      code,
      group_id: selectedGroup.id,
      teacher_id: professeur.user_id,
      genre: newEleveGenre,
    });

    if (error) {
      console.error("Erreur ajout élève :", error.message);
      toast.error("Impossible d'ajouter l'élève.");
      return;
    }

    toast.success("Élève ajouté avec succès !");
    setNewEleveName("");
    setNewEleveGenre("M");
    await fetchEleves();
  };

  const updateEleveInSupabase = async (eleveId: string) => {
    const trimmedName = editedEleveName.trim();
    if (!trimmedName) {
      toast.error("Le nom de l'élève ne peut pas être vide.");
      return;
    }
    if (!professeur?.user_id || !selectedGroup?.id) {
      toast.error("Erreur : professeur/groupe manquant.");
      setEditingEleveId(null);
      return;
    }

    const others = eleves.filter((e) => e.id !== eleveId);
    if (others.some((e) => e.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Un autre élève avec ce nom existe déjà dans ce groupe.");
      setEditingEleveId(null);
      return;
    }

    const { error } = await supabase
      .from("students")
      .update({ name: trimmedName })
      .eq("id", eleveId)
      .eq("teacher_id", professeur.user_id)
      .eq("group_id", selectedGroup.id);

    if (error) {
      console.error("Erreur mise à jour élève :", error.message);
      toast.error("Impossible de mettre à jour l'élève.");
      return;
    }

    toast.success("Élève mis à jour avec succès !");
    setEditingEleveId(null);
    await fetchEleves();
  };

  const deleteEleveFromSupabase = async (eleveId: string) => {
    if (!professeur?.user_id || !selectedGroup?.id) {
      toast.error("Erreur : professeur/groupe manquant.");
      return;
    }

    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cet élève ? Cette action est irréversible."
      )
    ) {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", eleveId)
        .eq("teacher_id", professeur.user_id)
        .eq("group_id", selectedGroup.id);

      if (error) {
        console.error("Erreur suppression élève :", error.message);
        toast.error("Impossible de supprimer l'élève.");
        return;
      }

      toast.success("Élève supprimé avec succès !");
      await fetchEleves();
    }
  };

  /* ============ Rendering ============ */
  if (!selectedGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 text-center">
        <p className="text-xl">
          Chargement du groupe… Si cela prend trop de temps, retournez à la page
          des groupes et sélectionnez-en un.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <p className="text-xl animate-pulse">Chargement des élèves…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            padding: "16px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,.2)",
            background: "linear-gradient(to right,#6D28D9,#9333EA)",
          },
          success: { style: { background: "linear-gradient(to right,#06B6D4,#10B981)" } },
          error: { style: { background: "linear-gradient(to right,#DC2626,#EF4444)" } },
        }}
      />

      {/* Décor */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2"
          style={{ animationDelay: "4s" }}
        />
      </div>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rotate-45 rounded-lg" />
        <div className="absolute bottom-40 right-20 w-24 h-24 border-2 border-white rotate-12 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-white rotate-45" />
      </div>

      {/* Contenu */}
      <div
        className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40"
            onClick={() => setPage("gestionGroupes")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux groupes
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              <span
                style={{ color: selectedGroup.color || "#FFFFFF" }}
                className="font-bold"
              >
                {selectedGroup.name}
              </span>
            </h1>
            <p className="text-white/80 mt-2">Gérez les élèves de ce groupe.</p>
          </div>

          <div className="w-24" />
        </div>

        {/* Recherche */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un élève par nom ou code..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white placeholder-white/40 border border-white/20 focus:border-white/40 focus:outline-none transition-all"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.currentTarget.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Ajout d'un élève */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <UserPlus className="w-6 h-6 mr-2 text-green-400" />
            Ajouter un nouvel élève
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="col-span-2">
              <label
                htmlFor="eleveName"
                className="block text-white/70 text-sm font-medium mb-1"
              >
                Nom de l'élève
              </label>
              <input
                id="eleveName"
                type="text"
                placeholder="Ex: Jean Dupont"
                className="w-full px-4 py-3 bg-white/10 rounded-lg text-white placeholder-white/50 border border-white/20 focus:border-green-400 focus:outline-none"
                value={newEleveName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewEleveName(e.currentTarget.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") addEleveToSupabase();
                }}
              />
            </div>

            <div>
              <label
                htmlFor="eleveGenre"
                className="block text-white/70 text-sm font-medium mb-1"
              >
                Genre
              </label>
              <select
                id="eleveGenre"
                value={newEleveGenre || "M"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setNewEleveGenre(e.currentTarget.value as "M" | "F")
                }
                className="w-full px-4 py-3 bg-white/10 rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none"
              >
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </div>

            <div className="col-span-full md:col-span-1 flex justify-end md:justify-start">
              <button
                onClick={addEleveToSupabase}
                className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl text-white font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-md"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Ajouter l'élève
              </button>
            </div>
          </div>
        </div>

        {/* Liste des élèves */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Liste des élèves ({filteredEleves.length})
        </h2>

        {filteredEleves.length === 0 ? (
          <div className="p-8 text-center text-white/60 bg-white/5 backdrop-blur-sm rounded-xl border border-white/20">
            <p>Aucun élève trouvé dans ce groupe. Ajoutez-en un nouveau !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEleves.map((eleve) => (
              <div
                key={eleve.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {editingEleveId === eleve.id ? (
                    <input
                      type="text"
                      value={editedEleveName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditedEleveName(e.currentTarget.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") updateEleveInSupabase(eleve.id);
                      }}
                      onBlur={() => updateEleveInSupabase(eleve.id)}
                      className="w-full px-3 py-2 mb-2 bg-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-xl font-semibold text-white mb-2 truncate">
                      {eleve.name}
                      {eleve.genre && (
                        <span
                          className={`ml-2 text-sm font-normal px-2 py-0.5 rounded-full ${
                            eleve.genre === "M"
                              ? "bg-blue-600/50"
                              : "bg-pink-600/50"
                          }`}
                        >
                          {eleve.genre === "M" ? "Garçon" : "Fille"}
                        </span>
                      )}
                    </h3>
                  )}

                  <p className="text-white/70 text-sm flex items-center">
                    Code élève:{" "}
                    <span className="font-mono bg-white/5 rounded-md px-2 py-1 ml-2 text-white/90">
                      {eleve.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(eleve.code)}
                      className={`ml-2 p-1 rounded-full text-white ${
                        copiedCode === eleve.code
                          ? "bg-green-500/30"
                          : "hover:bg-white/20"
                      } transition-all`}
                      title="Copier le code"
                    >
                      {copiedCode === eleve.code ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </p>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  {editingEleveId === eleve.id ? (
                    <>
                      <button
                        onClick={() => updateEleveInSupabase(eleve.id)}
                        className="p-2 bg-blue-600/50 rounded-full text-blue-300 hover:bg-blue-600/70 transition-all"
                        title="Sauvegarder"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingEleveId(null)}
                        className="p-2 bg-red-600/50 rounded-full text-red-300 hover:bg-red-600/70 transition-all"
                        title="Annuler"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingEleveId(eleve.id);
                          setEditedEleveName(eleve.name);
                        }}
                        className="p-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 transition-all"
                        title="Modifier l'élève"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteEleveFromSupabase(eleve.id)}
                        className="p-2 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500/40 transition-all"
                        title="Supprimer l'élève"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionEleves;
