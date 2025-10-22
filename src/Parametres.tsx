// src/Parametres.tsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Check,
  Edit3,
  Globe,
  Lock,
  Palette,
  Settings,
  Shield,
  Share2,
  User,
  Users,
} from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Professeur = {
  user_id: string;
  nom?: string | null;
  prenom?: string | null;
  email?: string | null;
  code?: string | null;
  refuserPartage?: boolean | null;
};

type Props = {
  professeur: Professeur;
  setProfesseur: (p: Professeur) => void;
  supabase: SupabaseClient;
  setPage: (p: string) => void;
};

const Parametres: React.FC<Props> = ({
  professeur,
  setProfesseur,
  supabase,
  setPage,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // ====== NAV ======
  type TabId =
    | "account"
    | "personal"
    | "appearance"
    | "content"
    | "shares"
    | "notifications"
    | "language";
  const [selectedMenu, setSelectedMenu] = useState<TabId>("account");

  // ====== CODE UNIQUE ======
  const [modifierCode, setModifierCode] = useState(false);
  const [nouveauCodeUnique, setNouveauCodeUnique] = useState(
    professeur?.code || ""
  );
  const [messageErreurCode, setMessageErreurCode] = useState("");
  const [savingCode, setSavingCode] = useState(false);

  // ====== PARTAGES ======
  const [savingRefuser, setSavingRefuser] = useState(false);

  useEffect(() => setIsLoaded(true), []);

  // (Optionnel) Refresh “professeur” depuis la table pour être 100% à jour
  useEffect(() => {
    const fetchMe = async () => {
      if (!professeur?.user_id) return;
      const { data, error } = await supabase
        .from("professeurs")
        .select("*")
        .eq("user_id", professeur.user_id)
        .maybeSingle();
      if (!error && data) {
        setProfesseur({
          user_id: data.user_id,
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          code: data.code,
          refuserPartage: data.refuserPartage,
        });
      }
    };
    fetchMe();
  }, [supabase, professeur?.user_id, setProfesseur]);

  // ====== Helper UPDATE générique (optimiste + rollback) ======
  const updateProfField = async (
    field: keyof Professeur,
    value: string | boolean
  ) => {
    if (!professeur?.user_id) return false;

    const prev = professeur;
    const next = { ...professeur, [field]: value } as Professeur;
    setProfesseur(next);

    const { error } = await supabase
      .from("professeurs")
      .update({ [field]: value })
      .eq("user_id", professeur.user_id);

    if (error) {
      console.error(`Update failed for ${String(field)}`, error);
      alert("❌ Erreur lors de l’enregistrement. Réessaie.");
      setProfesseur(prev);
      return false;
    }
    return true;
  };

  // ====== Toggle Refuser Partage ======
  const onToggleRefuserPartage = async () => {
    if (!professeur?.user_id || savingRefuser) return;
    setSavingRefuser(true);
    const newVal = !(professeur.refuserPartage ?? false);
    await updateProfField("refuserPartage", newVal);
    setSavingRefuser(false);
  };

  // ====== Sauvegarde Code Unique ======
  const onSaveCode = async () => {
    if (!professeur?.user_id || savingCode) return;

    const code = (nouveauCodeUnique || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (code.length < 6) {
      setMessageErreurCode("Le code doit contenir au moins 6 caractères.");
      return;
    }
    setSavingCode(true);
    setMessageErreurCode("");

    // Vérifier l’unicité
    const { data: exists, error: checkErr } = await supabase
      .from("professeurs")
      .select("user_id")
      .eq("code", code);

    if (checkErr) {
      console.error(checkErr);
      setMessageErreurCode("Erreur lors de la vérification du code.");
      setSavingCode(false);
      return;
    }
    if (
      exists &&
      exists.length > 0 &&
      exists.some((r: any) => r.user_id !== professeur.user_id)
    ) {
      setMessageErreurCode("Code déjà utilisé !");
      setSavingCode(false);
      return;
    }

    const ok = await updateProfField("code", code);
    if (ok) {
      setModifierCode(false);
      alert("✅ Code unique mis à jour !");
    }
    setSavingCode(false);
  };

  // ====== Nom / Prénom ======
  const onChangeNom = (v: string) => updateProfField("nom", v);
  const onChangePrenom = (v: string) => updateProfField("prenom", v);

  // ====== NAV items ======
  const menuItems: Array<{
    id: TabId;
    label: string;
    desc: string;
    icon: React.ComponentType<any>;
  }> = [
    {
      id: "account",
      label: "Compte",
      desc: "Gérer les informations du compte et la sécurité",
      icon: User,
    },
    {
      id: "personal",
      label: "Données Personnelles",
      desc: "Mettre à jour votre profil et vos préférences",
      icon: Users,
    },
    {
      id: "appearance",
      label: "Apparence",
      desc: "Personnaliser l'interface utilisateur et les couleurs",
      icon: Palette,
    },
    {
      id: "content",
      label: "Contenu Pédagogique",
      desc: "Gérer les parcours, les leçons et les créations",
      icon: BookOpen,
    },
    {
      id: "shares",
      label: "Partages",
      desc: "Autoriser / refuser les partages reçus",
      icon: Share2,
    },
    {
      id: "notifications",
      label: "Notifications",
      desc: "Gérer les alertes et les préférences de communication",
      icon: Bell,
    },
    {
      id: "language",
      label: "Langue et Région",
      desc: "Définir la langue et les formats régionaux",
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
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

      <div
        className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Header + retour */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => setPage("AccueilProf")}
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              Paramètres
            </h1>
            <p className="text-white/80 mt-1">
              Configuration et préférences du compte
            </p>
          </div>

          <div className="w-24" />
        </div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* MENU */}
          <div className="lg:w-1/4 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Navigation</h2>
            <nav>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedMenu(item.id)}
                  className={`flex items-center w-full px-5 py-3 mb-3 rounded-xl text-left transition-all duration-300 transform ${
                    selectedMenu === item.id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                      : "text-white/70 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <span className="block font-semibold text-lg">
                      {item.label}
                    </span>
                    <span className="block text-sm opacity-80">
                      {item.desc}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* CONTENU */}
          <div className="lg:w-3/4 space-y-8">
            {/* Onglet COMPTE: Code unique + Sécurité */}
            {selectedMenu === "account" && (
              <>
                {/* Code unique */}
                <div className="group relative bg-gradient-to-br from-blue-400/20 to-cyan-600/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 hover:border-blue-400/50 shadow-2xl transition-all">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        Code Unique
                      </h3>
                      <p className="text-white/70 text-sm">
                        Code d’identification (6 à 20 caractères)
                      </p>
                    </div>
                  </div>

                  {!modifierCode ? (
                    <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center">
                        <div className="text-2xl font-mono text-cyan-400 bg-cyan-400/20 px-4 py-2 rounded-lg mr-4">
                          {professeur?.code || ""}
                        </div>
                        <div className="text-white/60 text-sm">Code actuel</div>
                      </div>
                      <button
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl transition-all hover:scale-105 shadow-lg"
                        onClick={() => {
                          setModifierCode(true);
                          setNouveauCodeUnique(professeur?.code || "");
                        }}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Modifier le code
                      </button>
                    </div>
                  ) : (
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            value={nouveauCodeUnique}
                            onChange={(e) =>
                              setNouveauCodeUnique(
                                e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                              )
                            }
                            maxLength={20}
                            className="w-full px-4 py-3 bg-white/10 rounded-xl text-white text-lg font-mono border border-white/20 focus:border-cyan-400 focus:outline-none uppercase"
                            placeholder="ENTREZ VOTRE CODE"
                          />
                          <div className="text-white/60 text-sm mt-2">
                            {(nouveauCodeUnique || "").length}/20 caractères
                          </div>
                        </div>
                        <button
                          onClick={onSaveCode}
                          disabled={savingCode}
                          className="flex items-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all hover:scale-105 shadow-lg disabled:opacity-60"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Valider
                        </button>
                      </div>
                      {messageErreurCode && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                          {messageErreurCode}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sécurité */}
                <div className="group relative bg-gradient-to-br from-red-400/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-8 border border-red-400/30 hover:border-red-400/50 shadow-2xl transition-all">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Sécurité</h3>
                      <p className="text-white/70 text-sm">Gestion du mot de passe</p>
                    </div>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <button
                      onClick={() => setPage("nouveauMotDePasse")}
                      className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all hover:scale-105 shadow-lg"
                    >
                      <Lock className="w-5 h-5 mr-2" />
                      Modifier le mot de passe
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Onglet DONNÉES PERSONNELLES */}
            {selectedMenu === "personal" && (
              <div className="group relative bg-gradient-to-br from-purple-400/20 to-indigo-600/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-400/30 hover:border-purple-400/50 shadow-2xl transition-all">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Données Personnelles
                    </h3>
                    <p className="text-white/70 text-sm">
                      Mettre à jour vos informations de profil.
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm font-semibold mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={professeur?.nom || ""}
                      onChange={(e) => onChangeNom(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 rounded-xl text-white border border-white/20 focus:border-purple-400 focus:outline-none"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-semibold mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={professeur?.prenom || ""}
                      onChange={(e) => onChangePrenom(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 rounded-xl text-white border border-white/20 focus:border-purple-400 focus:outline-none"
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Onglet APPARENCE */}
            {selectedMenu === "appearance" && (
              <div className="group relative bg-gradient-to-br from-emerald-400/20 to-lime-600/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-400/30 hover:border-emerald-400/50 shadow-2xl transition-all">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Apparence</h3>
                    <p className="text-white/70 text-sm">
                      Personnaliser l’interface (bientôt).
                    </p>
                  </div>
                </div>
                <div className="text-white/70">
                  Rien à configurer ici pour l’instant 🙂
                </div>
              </div>
            )}

            {/* Onglet CONTENU PÉDAGOGIQUE */}
            {selectedMenu === "content" && (
              <div className="group relative bg-gradient-to-br from-orange-400/20 to-red-600/20 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/30 hover:border-orange-400/50 shadow-2xl transition-all">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Contenu Pédagogique
                    </h3>
                    <p className="text-white/70 text-sm">
                      Gérer les parcours, les leçons et les créations.
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <button
                    onClick={() =>
                      alert("Fonctionnalités de gestion de contenus à implémenter.")
                    }
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all hover:scale-105 shadow-lg"
                  >
                    Gérer mes contenus
                  </button>
                </div>
              </div>
            )}

            {/* Onglet PARTAGES */}
            {selectedMenu === "shares" && (
              <div className="group relative bg-gradient-to-br from-emerald-400/20 to-teal-600/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-400/30 hover:border-emerald-400/50 shadow-2xl transition-all">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Partages</h3>
                    <p className="text-white/70 text-sm">
                      Autorisez ou refusez les partages d’autres enseignants.
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={!!professeur?.refuserPartage}
                        onChange={onToggleRefuserPartage}
                        disabled={savingRefuser}
                      />
                      <div
                        className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          professeur?.refuserPartage ? "bg-red-500" : "bg-green-500"
                        } ${savingRefuser ? "opacity-60" : ""}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 ${
                            professeur?.refuserPartage
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          } translate-y-0.5`}
                        />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-white font-semibold">
                        {professeur?.refuserPartage
                          ? "Refuser les partages (désactivé)"
                          : "Autoriser les partages (activé)"}
                      </div>
                      <div className="text-white/60 text-sm">
                        {professeur?.refuserPartage
                          ? "Vous ne recevrez pas de partages entrants."
                          : "Vous pouvez recevoir des partages d’autres professeurs."}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Onglet NOTIFICATIONS */}
            {selectedMenu === "notifications" && (
              <div className="group relative bg-gradient-to-br from-yellow-400/20 to-amber-600/20 backdrop-blur-xl rounded-3xl p-8 border border-yellow-400/30 hover:border-yellow-400/50 shadow-2xl transition-all">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Notifications</h3>
                    <p className="text-white/70 text-sm">
                      Gérer vos préférences de notification (bientôt).
                    </p>
                  </div>
                </div>
                <div className="text-white/70">
                  Options à venir (email / in-app).
                </div>
              </div>
            )}

            {/* Onglet LANGUE & RÉGION */}
            {selectedMenu === "language" && (
              <div className="group relative bg-gradient-to-br from-indigo-400/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-8 border border-indigo-400/30 hover:border-indigo-400/50 shadow-2xl transition-all">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Langue & Région
                    </h3>
                    <p className="text-white/70 text-sm">
                      Définir la langue et les formats régionaux (bientôt).
                    </p>
                  </div>
                </div>
                <div className="text-white/70">
                  Paramètres à venir 🙂
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;
