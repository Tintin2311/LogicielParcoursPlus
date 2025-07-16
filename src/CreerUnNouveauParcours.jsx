import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass, Pencil, Zap, CheckCircle, Plus } from 'lucide-react';
import { supabase } from "./supabaseClient"; // Assurez-vous que supabaseClient est correctement importé

function CreerUnNouveauParcours({ setPage, parcoursGlobaux, setParcoursGlobaux, balisesGlobales, parametresProf }) {
  const [newParcoursNom, setNewParcoursNom] = useState('');
  const [nombreBalises, setNombreBalises] = useState(0);
  const [balisesTemp, setBalisesTemp] = useState([]);
  const [modeCreationBalises, setModeCreationBalises] = useState(null); // 'manuel' ou 'automatique'
  const [attribuerPointsParBalise, setAttribuerPointsParBalise] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Pour l'animation d'apparition

  useEffect(() => {
    // Appliquer le mode par défaut si défini dans les paramètres
    if (parametresProf?.modeCreationParcours) {
      setModeCreationBalises(parametresProf.modeCreationParcours);
    }
    setIsLoaded(true); // Déclenche l'animation une fois le composant monté
  }, [parametresProf]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden font-sans pb-16">
      {/* Animated Background Elements (inspired by Parametres) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-0"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 transform -translate-x-1/2 -translate-y-1/2"
        ></div>
      </div>

      {/* Geometric Patterns (inspired by Parametres) */}
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
        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <button
            onClick={() => setPage("gestionParcours")}
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'Accueil
          </button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12 mt-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 mb-2 drop-shadow-lg">
            Créer un nouveau parcours
          </h1>
          <p className="text-lg text-white/80 font-light max-w-2xl mx-auto">
            Définissez les étapes et les règles de votre nouvelle aventure pédagogique.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="max-w-3xl mx-auto">
          {/* Section Mode de Création */}
          {(!parametresProf?.modeCreationParcours || !modeCreationBalises) && (
            <div className="group relative bg-gradient-to-br from-blue-400/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 hover:border-blue-400/50 shadow-2xl mb-8 overflow-hidden transform transition-all duration-500 ease-out hover:scale-[1.005]">
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Compass className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Mode d'ajout des balises</h3>
                    <p className="text-white/70 text-sm">Comment souhaitez-vous ajouter les balises à ce parcours ?</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => setModeCreationBalises("manuel")}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                  >
                    <Pencil className="w-5 h-5 mr-2" /> Mode Manuel
                  </button>
                  <button
                    onClick={() => setModeCreationBalises("automatique")}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
                  >
                    <Zap className="w-5 h-5 mr-2" /> Mode Automatique
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire de création affiché uniquement si le mode est choisi */}
          {modeCreationBalises && (
            <div className="group relative bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 hover:border-green-400/50 shadow-2xl overflow-hidden transform transition-all duration-500 ease-out hover:scale-[1.005]">
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Détails du parcours</h3>
                    <p className="text-white/70 text-sm">Informations générales et composition des balises.</p>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="relative">
                    <label htmlFor="parcours-nom" className="block text-white/70 text-sm font-medium mb-2">Nom du parcours</label>
                    <input
                      id="parcours-nom"
                      placeholder="Ex: Chasse au trésor de la forêt"
                      value={newParcoursNom}
                      onChange={(e) => setNewParcoursNom(e.target.value)}
                      className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm rounded-xl text-white placeholder-white/40 border border-white/20 focus:border-blue-400 focus:outline-none transition-colors duration-300 shadow-inner"
                    />
                  </div>

                  <div className="relative">
                    <label htmlFor="nombre-balises" className="block text-white/70 text-sm font-medium mb-2">Nombre de balises</label>
                    <input
                      id="nombre-balises"
                      type="number"
                      min={1}
                      max={1000}
                      placeholder="Ex: 5"
                      value={nombreBalises}
                      onChange={(e) => setNombreBalises(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm rounded-xl text-white placeholder-white/40 border border-white/20 focus:border-blue-400 focus:outline-none transition-colors duration-300 shadow-inner"
                    />
                  </div>

                  <div className="flex items-center justify-center">
                    <label className="inline-flex items-center cursor-pointer text-gray-200">
                      <input
                        type="checkbox"
                        checked={attribuerPointsParBalise}
                        onChange={(e) => setAttribuerPointsParBalise(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-green-500 rounded border-gray-500 bg-gray-700 transition-colors duration-300"
                      />
                      <span className="ml-3 text-lg">Attribuer des points à chaque balise</span>
                    </label>
                  </div>
                </div>

                {/* Création des balises en fonction du mode */}
                <div className="space-y-4 mb-8 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {Array.from({ length: nombreBalises || 0 }, (_, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-center justify-between bg-black/15 p-4 rounded-lg shadow-sm border border-white/10">
                      <span className="text-lg font-semibold text-gray-100 mb-2 sm:mb-0 sm:mr-4 w-24 flex-shrink-0">Balise n° {i + 1} :</span>
                      {modeCreationBalises === "manuel" ? (
                        <input
                          placeholder="Code de la balise"
                          value={balisesTemp[i]?.code || ""}
                          onChange={(e) => {
                            const newBalises = [...balisesTemp];
                            newBalises[i] = {
                              ...(newBalises[i] || { index: i + 1 }),
                              code: e.target.value.toUpperCase().trim(),
                            };
                            setBalisesTemp(newBalises);
                          }}
                          className="flex-grow p-2 bg-black/30 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-400 mr-0 sm:mr-4 mb-2 sm:mb-0 shadow-inner"
                        />
                      ) : (
                        <div className="flex items-center flex-grow">
                          <input
                            type="number"
                            min={1}
                            max={balisesGlobales.length || 1}
                            placeholder="N° balise"
                            value={balisesTemp[i]?.index || ""}
                            onChange={(e) => {
                              const indexBalise = parseInt(e.target.value);
                              const codeBalise =
                                balisesGlobales[indexBalise - 1]?.code || "";
                              const newBalises = [...balisesTemp];
                              newBalises[i] = {
                                ...(newBalises[i] || {}),
                                index: indexBalise,
                                code: codeBalise,
                              };
                              setBalisesTemp(newBalises);
                            }}
                            className="p-2 bg-black/30 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-400 w-24 mr-4 shadow-inner"
                          />
                          {balisesTemp[i]?.index && (
                            <span className="text-gray-300 text-sm md:text-base">
                              Code :{" "}
                              <strong className="text-blue-400">
                                {balisesGlobales[balisesTemp[i].index - 1]?.code ||
                                  "N/A"}
                              </strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Champ points par balise si activé */}
                      {attribuerPointsParBalise && (
                        <label className="flex items-center text-gray-300 ml-0 sm:ml-4 mt-2 sm:mt-0 flex-shrink-0">
                          Points :
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={
                              balisesTemp[i]?.points !== undefined
                                ? balisesTemp[i]?.points
                                : ""
                            }
                            onChange={(e) => {
                              const newBalises = [...balisesTemp];
                              const value = e.target.value.replace(",", ".");
                              if (value === "") {
                                newBalises[i] = {
                                  ...(newBalises[i] || {}),
                                  points: "",
                                };
                              } else {
                                const parsed = parseFloat(value);
                                if (!isNaN(parsed)) {
                                  newBalises[i] = {
                                    ...(newBalises[i] || {}),
                                    points: parsed,
                                  };
                                }
                              }
                              setBalisesTemp(newBalises);
                            }}
                            className="ml-2 p-2 bg-black/30 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-400 w-20 shadow-inner"
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (
                      attribuerPointsParBalise &&
                      balisesTemp.some(
                        (b) => b.points === undefined || b.points === ""
                      )
                    ) {
                      alert(
                        "❌ Veuillez renseigner les points de chaque balise."
                      );
                      return;
                    }

                    if (!newParcoursNom.trim()) {
                      alert("❌ Le nom du parcours est obligatoire.");
                      return;
                    }
                    if (!nombreBalises || nombreBalises <= 0) {
                      alert("❌ Le nombre de balises doit être positif.");
                      return;
                    }
                    if (
                      balisesTemp.length !== nombreBalises ||
                      balisesTemp.some((b) => !b || !b.code)
                    ) {
                      alert("❌ Veuillez remplir toutes les balises.");
                      return;
                    }

                    const nouveauParcours = {
                      id: Date.now(),
                      nom: newParcoursNom.trim(),
                      balises: balisesTemp,
                      groupesAssocies: [],
                    };

                    setParcoursGlobaux((prev) => [...prev, nouveauParcours]);

                    if (
                      confirm(
                        "✅ Parcours créé avec succès !\n\nSouhaitez-vous créer un nouveau parcours ?"
                      )
                    ) {
                      // Réinitialise tout pour recommencer proprement
                      setModeCreationBalises(parametresProf?.modeCreationParcours || null); // Reset to default or ask again
                      setNewParcoursNom("");
                      setNombreBalises(0);
                      setBalisesTemp([]);
                      setAttribuerPointsParBalise(false); // Reset points checkbox
                    } else {
                      // Retour à la gestion des parcours
                      setPage("gestionParcours");
                      setModeCreationBalises(null); // Ensure mode is reset on navigation
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 flex items-center justify-center text-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Valider le parcours
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Style pour la scrollbar custom */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Keyframes pour l'animation blob */
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-0 { animation-delay: 0s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}

export default CreerUnNouveauParcours;