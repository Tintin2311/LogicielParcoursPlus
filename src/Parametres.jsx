import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass, Settings, Lock, Edit3, Check, X, Shield, Zap, HelpCircle } from 'lucide-react';

const Parametres = ({
  professeur,
  setProfesseur,
  professeurs,
  setProfesseurs,
  supabase,
  ParametresProf,
  setParametresProf,
  setPage,
  modifierCode,
  setModifierCode,
  nouveauCodeUnique,
  setNouveauCodeUnique,
  messageErreurCode,
  setMessageErreurCode,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Geometric Patterns */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rotate-45 rounded-lg"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 border-2 border-white rotate-12 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-white rotate-45"></div>
      </div>

      <div
        className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
            Paramètres
          </h1>
          <p className="text-xl text-white/80 font-light">
            Configuration et préférences du compte
          </p>
        </div>

        {/* Bouton retour */}
        <div className="absolute top-8 left-8">
          <button 
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40"
            onClick={() => setPage('AccueilProf')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
        </div>

        {/* Contenu principal */}
        <div className="max-w-4xl mx-auto">
          {/* Section Code Unique */}
          <div className="group relative bg-gradient-to-br from-blue-400/20 to-cyan-600/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 hover:border-blue-400/50 shadow-2xl mb-8 transition-all duration-500 hover:scale-105 hover:shadow-blue-500/25">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Code Unique</h3>
                  <p className="text-white/70 text-sm">Code d'identification (6 à 20 caractères)</p>
                </div>
              </div>

              {!modifierCode ? (
                <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center">
                    <div className="text-2xl font-mono text-cyan-400 bg-cyan-400/20 px-4 py-2 rounded-lg mr-4">
                      {professeur?.code || ""}
                    </div>
                    <div className="text-white/60 text-sm">
                      Code actuel
                    </div>
                  </div>
                  <button
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
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
                        onChange={(e) => {
                          const code = e.target.value.toUpperCase();
                          if (code.length > 20) return;
                          setNouveauCodeUnique(code.replace(/[^A-Z0-9]/g, ""));
                        }}
                        maxLength={20}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white text-lg font-mono border border-white/20 focus:border-cyan-400 focus:outline-none transition-all duration-300 uppercase"
                        placeholder="ENTREZ VOTRE CODE"
                      />
                      <div className="text-white/60 text-sm mt-2">
                        {nouveauCodeUnique.length}/20 caractères
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (nouveauCodeUnique.length < 6) {
                          setMessageErreurCode(
                            "Le code doit contenir au moins 6 caractères."
                          );
                          return;
                        }

                        const { data, error } = await supabase
                          .from("professeurs")
                          .select("*")
                          .eq("code", nouveauCodeUnique);

                        if (error) {
                          console.error(error);
                          setMessageErreurCode(
                            "Erreur lors de la vérification du code."
                          );
                          return;
                        }

                        if (
                          data.length > 0 &&
                          data[0].user_id !== professeur?.user_id
                        ) {
                          setMessageErreurCode("Code déjà utilisé !");
                          return;
                        }

                        const { error: updateError } = await supabase
                          .from("professeurs")
                          .update({ code: nouveauCodeUnique })
                          .eq("user_id", professeur?.user_id);

                        if (updateError) {
                          console.error(updateError);
                          setMessageErreurCode(
                            "Erreur lors de la mise à jour du code."
                          );
                          return;
                        }

                        const updatedProf = {
                          ...professeur,
                          code: nouveauCodeUnique,
                        };
                        setProfesseur(updatedProf);
                        setModifierCode(false);
                        setMessageErreurCode("");
                        alert("✅ Code unique mis à jour avec succès !");
                      }}
                      className="flex items-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Valider
                    </button>
                  </div>
                </div>
              )}

              {messageErreurCode && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                  {messageErreurCode}
                </div>
              )}
            </div>
          </div>

          {/* Section Partage */}
          <div className="group relative bg-gradient-to-br from-purple-400/20 to-indigo-600/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-400/30 hover:border-purple-400/50 shadow-2xl mb-8 transition-all duration-500 hover:scale-105 hover:shadow-purple-500/25">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Préférences de partage</h3>
                  <p className="text-white/70 text-sm">Contrôlez les partages de contenu</p>
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={professeur?.refuserPartage || false}
                      onChange={() => {
                        const updatedProf = {
                          ...professeur,
                          refuserPartage: !(professeur?.refuserPartage || false),
                        };
                        setProfesseur(updatedProf);
                        setProfesseurs(
                          professeurs.map((p) =>
                            p.email === updatedProf.email ? updatedProf : p
                          )
                        );
                      }}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                      professeur?.refuserPartage ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 ${
                        professeur?.refuserPartage ? 'translate-x-6' : 'translate-x-0.5'
                      } translate-y-0.5`}></div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-white font-semibold">
                      {professeur?.refuserPartage ? 'Partages refusés' : 'Partages autorisés'}
                    </div>
                    <div className="text-white/60 text-sm">
                      {professeur?.refuserPartage 
                        ? 'Vous ne recevrez pas de partages de contenu'
                        : 'Vous pouvez recevoir des partages de contenu'
                      }
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section Mot de passe */}
          <div className="group relative bg-gradient-to-br from-red-400/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-8 border border-red-400/30 hover:border-red-400/50 shadow-2xl mb-8 transition-all duration-500 hover:scale-105 hover:shadow-red-500/25">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            
            <div className="relative z-10">
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
                  className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Modifier le mot de passe
                </button>
              </div>
            </div>
          </div>

          {/* Section Mode de création */}
          <div className="group relative bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 hover:border-green-400/50 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-green-500/25">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Mode de création des parcours</h3>
                  <p className="text-white/70 text-sm">Choisissez le mode de création par défaut</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { 
                    value: null, 
                    label: "Demander à chaque création", 
                    icon: HelpCircle, 
                    description: "Une fenêtre de choix apparaîtra à chaque création",
                    color: "from-gray-500 to-slate-500"
                  },
                  { 
                    value: "manuel", 
                    label: "Toujours en mode manuel", 
                    icon: Edit3, 
                    description: "Création manuelle avec contrôle total",
                    color: "from-blue-500 to-cyan-500"
                  },
                  { 
                    value: "automatique", 
                    label: "Toujours en mode automatique", 
                    icon: Zap, 
                    description: "Création automatique rapide",
                    color: "from-yellow-500 to-orange-500"
                  }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 bg-black/20 backdrop-blur-sm rounded-xl border transition-all duration-300 cursor-pointer hover:bg-black/30 ${
                      ParametresProf?.modeCreationParcours === option.value 
                        ? 'border-white/40 bg-white/10' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="radio"
                        name="modeCreationParcours"
                        checked={ParametresProf?.modeCreationParcours === option.value}
                        onChange={() =>
                          setParametresProf({
                            ...ParametresProf,
                            modeCreationParcours: option.value,
                          })
                        }
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                        ParametresProf?.modeCreationParcours === option.value 
                          ? 'border-white bg-white' 
                          : 'border-white/40'
                      }`}>
                        {ParametresProf?.modeCreationParcours === option.value && (
                          <div className="w-3 h-3 bg-purple-500 rounded-full m-0.5"></div>
                        )}
                      </div>
                    </div>
                    <div className={`w-10 h-10 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center mx-4 shadow-lg`}>
                      <option.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{option.label}</div>
                      <div className="text-white/60 text-sm">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm border-t border-white/10 py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm text-white/60">
            <div className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres du compte
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Synchronisé
              </div>
              <div>
                Dernière modification: Aujourd'hui
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;