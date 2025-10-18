// src/PartageParcours.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  ArrowLeft,
  Send,
  Mail,
  CheckCircle,
  XCircle,
  FolderOpen,
  MapPin,
  Search,
} from "lucide-react";

// ---- Types locaux ----
type Parcours = {
  id: string;
  nom: string;
  description?: string | null;
  balises_ordre?: string[] | null;
  folder_id?: string | null;
};

type ProfesseurMinimal = {
  id_uuid: string;
  nom?: string | null;
  prenom?: string | null;
  email: string;
};

type PartageRecu = {
  id: string;
  accepte: boolean;
  rejete: boolean;
  parcours: Parcours;
  // alias "professeurs" = expéditeur (cf. select plus bas)
  professeurs: {
    nom?: string | null;
    prenom?: string | null;
    email: string;
  };
};

type Props = {
  setPage: (p: string) => void;
  professeur: {
    id_uuid: string;  // UUID dans ta table professeurs
    user_id: string;  // id user supabase (auth)
    email?: string;
  };
};

const PartageParcours: React.FC<Props> = ({ setPage, professeur }) => {
  const [ongletActif, setOngletActif] = useState<"envoyer" | "recevoir">(
    "envoyer"
  );

  // État "Envoyer"
  const [rechercheEmail, setRechercheEmail] = useState("");
  const [resultatsRecherche, setResultatsRecherche] = useState<
    ProfesseurMinimal[]
  >([]);
  const [professeurSelectionne, setProfesseurSelectionne] =
    useState<ProfesseurMinimal | null>(null);
  const [mesParcours, setMesParcours] = useState<Parcours[]>([]);
  const [parcoursSelectionnes, setParcoursSelectionnes] = useState<string[]>(
    []
  );

  // État "Recevoir"
  const [partagesRecus, setPartagesRecus] = useState<PartageRecu[]>([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ---------- Chargements ----------
  useEffect(() => {
    if (!professeur) return;

    const fetchMesParcours = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("parcours")
          .select("id, nom, description, balises_ordre, folder_id")
          .eq("owner_id", professeur.user_id);
        if (error) throw error;
        setMesParcours((data ?? []) as Parcours[]);
      } catch (e: any) {
        console.error("Erreur chargement mes parcours:", e);
        setError("Erreur lors du chargement de vos parcours.");
      } finally {
        setLoading(false);
      }
    };

    const fetchPartagesRecus = async () => {
      setLoading(true);
      setError("");
      try {
        // alias "professeurs:expediteur_prof_id" = colonnes du professeur expéditeur
        const { data, error } = await supabase
          .from("partages_parcours")
          .select(
            `
            id,
            accepte,
            rejete,
            parcours:parcours ( id, nom, description, balises_ordre, folder_id ),
            professeurs:expediteur_prof_id ( nom, prenom, email )
          `
          )
          .eq("destinataire_prof_id", professeur.id_uuid)
          .eq("accepte", false)
          .eq("rejete", false);

        if (error) throw error;
        setPartagesRecus((data ?? []) as unknown as PartageRecu[]);
      } catch (e: any) {
        console.error("Erreur chargement partages reçus:", e);
        setError("Erreur lors du chargement des partages reçus.");
      } finally {
        setLoading(false);
      }
    };

    // On recharge selon l’onglet actif (utile si on vient d’envoyer/recevoir)
    if (ongletActif === "envoyer") fetchMesParcours();
    if (ongletActif === "recevoir") fetchPartagesRecus();
  }, [professeur, ongletActif]);

  // ---------- Recherche professeur par email ----------
  const handleRechercheProfesseur = async () => {
    setLoading(true);
    setResultatsRecherche([]);
    setError("");
    setMessage("");

    try {
      const email = rechercheEmail.trim();
      if (!email) {
        setError("Veuillez entrer un email pour rechercher.");
        return;
      }
      if (
        professeur?.email &&
        email.toLowerCase() === professeur.email.toLowerCase()
      ) {
        setError("Vous ne pouvez pas vous envoyer de parcours à vous-même.");
        return;
      }

      const { data, error } = await supabase
        .from("professeurs")
        .select("id_uuid, nom, prenom, email")
        .ilike("email", `%${email}%`);

      if (error) throw error;
      if (data && data.length) {
        setResultatsRecherche(data as ProfesseurMinimal[]);
      } else {
        setMessage("Aucun professeur trouvé avec cet email.");
      }
    } catch (e: any) {
      console.error("Erreur recherche professeur:", e);
      setError("Erreur lors de la recherche du professeur.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Envoi de partages ----------
  const handleEnvoyerPartage = async () => {
    if (!professeurSelectionne || parcoursSelectionnes.length === 0) {
      setError("Veuillez sélectionner un professeur et au moins un parcours.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const lignes = parcoursSelectionnes.map((parcoursId) => ({
        parcours_id: parcoursId,
        expediteur_prof_id: professeur.id_uuid,
        destinataire_prof_id: professeurSelectionne.id_uuid,
        accepte: false,
        rejete: false,
      }));

      const { error } = await supabase.from("partages_parcours").insert(lignes);
      if (error) {
        // 23505 = violation unique (si contrainte posée)
        if ((error as any).code === "23505") {
          setError(
            "Un ou plusieurs de ces parcours ont déjà été partagés avec ce professeur."
          );
        } else {
          throw error;
        }
      } else {
        setMessage(
          `Parcours partagé(s) avec succès avec ${professeurSelectionne.nom ?? ""} ${
            professeurSelectionne.prenom ?? ""
          } !`
        );
        setParcoursSelectionnes([]);
        setProfesseurSelectionne(null);
        setRechercheEmail("");
        setResultatsRecherche([]);
      }
    } catch (e: any) {
      console.error("Erreur envoi partage:", e);
      setError("Erreur lors de l'envoi du partage.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Réception : accepter / rejeter ----------
  const handleAccepterPartage = async (partageId: string, p: Parcours) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // 1) marquer accepté
      const { error: upErr } = await supabase
        .from("partages_parcours")
        .update({ accepte: true })
        .eq("id", partageId);
      if (upErr) throw upErr;

      // 2) dupliquer le parcours chez le destinataire
      const { error: dupErr } = await supabase.from("parcours").insert({
        nom: `${p.nom} (copie)`,
        description: p.description ?? null,
        balises_ordre: p.balises_ordre ?? null,
        folder_id: null,
        owner_id: professeur.user_id,
      });
      if (dupErr) throw dupErr;

      setMessage(`Parcours « ${p.nom} » accepté et ajouté à vos parcours !`);
      setPartagesRecus((prev) => prev.filter((x) => x.id !== partageId));
    } catch (e: any) {
      console.error("Erreur acceptation partage:", e);
      setError("Erreur lors de l'acceptation du partage.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejeterPartage = async (partageId: string) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase
        .from("partages_parcours")
        .update({ rejete: true })
        .eq("id", partageId);
      if (error) throw error;

      setMessage("Partage rejeté.");
      setPartagesRecus((prev) => prev.filter((x) => x.id !== partageId));
    } catch (e: any) {
      console.error("Erreur rejet partage:", e);
      setError("Erreur lors du rejet du partage.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden text-white p-8">
      {/* Décor de fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-40 h-40 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rotate-45 rounded-lg"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 border-2 border-white rotate-12 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-white rotate-45"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400 mb-8 drop-shadow-lg">
          Partage de Parcours
        </h1>

        <div className="absolute top-8 left-8">
          <button
            onClick={() => setPage("AccueilProf")}
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </button>
        </div>

        {/* Onglets */}
        <div className="flex justify-center mb-8">
          <button
            className={`px-6 py-3 rounded-l-lg font-semibold transition-all duration-300 ${
              ongletActif === "envoyer"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/70"
            }`}
            onClick={() => setOngletActif("envoyer")}
          >
            <Send className="inline-block w-5 h-5 mr-2" /> Envoyer un parcours
          </button>
          <button
            className={`px-6 py-3 rounded-r-lg font-semibold transition-all duration-300 ${
              ongletActif === "recevoir"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/70"
            }`}
            onClick={() => setOngletActif("recevoir")}
          >
            <Mail className="inline-block w-5 h-5 mr-2" /> Partages reçus
            {partagesRecus.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {partagesRecus.length}
              </span>
            )}
          </button>
        </div>

        {message && (
          <div className="bg-green-500/20 text-green-300 p-4 rounded-lg mb-4 text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-center text-blue-300 mb-4">Chargement...</div>
        )}

        {/* ---- Onglet ENVOYER ---- */}
        {ongletActif === "envoyer" && (
          <div className="max-w-4xl mx-auto bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Send className="w-6 h-6 mr-3 text-blue-300" /> Partager vos
              parcours
            </h2>

            {/* 1) Choisir le destinataire */}
            <div className="mb-8 p-6 bg-white/10 rounded-xl border border-white/20 shadow-inner">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-200" /> 1. Rechercher
                le professeur destinataire
              </h3>
              <div className="flex space-x-3 mb-4">
                <input
                  type="email"
                  placeholder="Email du professeur destinataire"
                  value={rechercheEmail}
                  onChange={(e) => {
                    setRechercheEmail(e.target.value);
                    setProfesseurSelectionne(null);
                    setResultatsRecherche([]);
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 rounded-lg text-white border border-white/20 focus:border-blue-400 focus:outline-none placeholder-white/40"
                />
                <button
                  onClick={handleRechercheProfesseur}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors shadow-md"
                >
                  Rechercher
                </button>
              </div>

              {resultatsRecherche.length > 0 && (
                <div className="mt-4">
                  <p className="text-white/70 mb-2">
                    Sélectionnez un professeur :
                  </p>
                  <div className="space-y-2">
                    {resultatsRecherche.map((prof) => (
                      <div
                        key={prof.id_uuid}
                        className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 ${
                          professeurSelectionne?.id_uuid === prof.id_uuid
                            ? "bg-blue-600/50 border-blue-400"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                        onClick={() => setProfesseurSelectionne(prof)}
                      >
                        <span className="font-medium">
                          {prof.nom} {prof.prenom} ({prof.email})
                        </span>
                        {professeurSelectionne?.id_uuid === prof.id_uuid && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {professeurSelectionne && (
                <p className="mt-4 text-green-300 text-sm">
                  Destinataire sélectionné : {professeurSelectionne.nom}{" "}
                  {professeurSelectionne.prenom} ({professeurSelectionne.email})
                </p>
              )}
            </div>

            {/* 2) Choisir les parcours */}
            <div className="p-6 bg-white/10 rounded-xl border border-white/20 shadow-inner">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-pink-200" /> 2. Sélectionner
                les parcours à envoyer
              </h3>

              {mesParcours.length === 0 ? (
                <p className="text-white/70">
                  Vous n'avez pas encore de parcours à partager.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                  {mesParcours.map((parcours) => {
                    const checked = parcoursSelectionnes.includes(parcours.id);
                    return (
                      <div
                        key={parcours.id}
                        className={`p-4 rounded-lg flex items-center cursor-pointer transition-all duration-200 ${
                          checked
                            ? "bg-purple-600/50 border-purple-400"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                        onClick={() =>
                          setParcoursSelectionnes((prev) =>
                            prev.includes(parcours.id)
                              ? prev.filter((id) => id !== parcours.id)
                              : [...prev, parcours.id]
                          )
                        }
                      >
                        {checked ? (
                          <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                        ) : (
                          <FolderOpen className="w-5 h-5 mr-3 text-white/50" />
                        )}
                        <span className="font-medium">{parcours.nom}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Envoyer */}
            <div className="mt-8 text-center">
              <button
                onClick={handleEnvoyerPartage}
                disabled={
                  !professeurSelectionne ||
                  parcoursSelectionnes.length === 0 ||
                  loading
                }
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl text-white font-bold text-xl uppercase tracking-wider hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-6 h-6 mr-3" /> Envoyer le(s) parcours
              </button>
            </div>
          </div>
        )}

        {/* ---- Onglet RECEVOIR ---- */}
        {ongletActif === "recevoir" && (
          <div className="max-w-4xl mx-auto bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 shadow-2xl mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Mail className="w-6 h-6 mr-3 text-green-300" /> Partages en
              attente
            </h2>

            {partagesRecus.length === 0 ? (
              <p className="text-center text-white/70 text-lg py-10 bg-white/5 rounded-xl border border-white/20">
                Vous n'avez aucun partage de parcours en attente.
              </p>
            ) : (
              <div className="space-y-6">
                {partagesRecus.map((partage) => (
                  <div
                    key={partage.id}
                    className="bg-white/10 rounded-xl p-6 border border-white/20 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-teal-300 mb-2">
                        {partage.parcours.nom}
                      </h3>
                      <p className="text-white/80 text-sm mb-2">
                        {partage.parcours.description || "Pas de description."}
                      </p>
                      <p className="text-white/60 text-xs">
                        De : {partage.professeurs.nom ?? ""}{" "}
                        {partage.professeurs.prenom ?? ""} (
                        {partage.professeurs.email})
                      </p>
                    </div>

                    <div className="flex space-x-3 mt-4 md:mt-0">
                      <button
                        onClick={() =>
                          handleAccepterPartage(
                            partage.id,
                            partage.parcours as Parcours
                          )
                        }
                        className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors"
                        disabled={loading}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Accepter
                      </button>
                      <button
                        onClick={() => handleRejeterPartage(partage.id)}
                        className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                        disabled={loading}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartageParcours;
