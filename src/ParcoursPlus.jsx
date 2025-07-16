import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";

const ParcoursPlus = ({ setPage, setModeConnexion, setProfesseur }) => {
  const [modeConnexionLocal, setModeConnexionLocal] = useState("accueil");
  const [newProfEmail, setNewProfEmail] = useState("");
  const [newProfPassword, setNewProfPassword] = useState("");
  const [codeProfEleve, setCodeProfEleve] = useState("");
  const [codeEleve, setCodeEleve] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleProfConnection = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: newProfEmail.trim().toLowerCase(),
      password: newProfPassword,
    });

    if (error) {
      console.error("❌ Erreur de connexion :", error.message);
      alert("Erreur : " + error.message);
      return;
    }

    console.log("✅ Connexion réussie :", data);

    const user = data.user;

    // 🔎 On récupère le professeur correspondant à cet user.id
    const { data: prof, error: profError } = await supabase
      .from("professeurs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profError) {
      console.error("❌ Prof non trouvé :", profError.message);
      alert("Impossible de retrouver le profil professeur.");
      return;
    }

    console.log("🎓 Professeur trouvé :", prof);

    // ✅ On stocke le professeur dans le state global
    setProfesseur(prof);

    // Et on affiche la page d'accueil
    setPage("AccueilProf");
  } catch (err) {
    console.error("❌ Erreur inattendue :", err);
    alert("Une erreur est survenue lors de la connexion.");
  }
};


  const handleEleveConnection = () => {
    console.log("Connexion élève", { codeProfEleve, codeEleve });
  };

  // Page d'accueil principale
  if (modeConnexionLocal === "accueil") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden flex flex-col">
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

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col">
          <div
            className={`relative z-10 container mx-auto px-4 py-8 flex-1 flex flex-col transition-all duration-1000 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl transform hover:scale-110 transition-all duration-500 hover:rotate-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Compass className="w-12 h-12 text-white drop-shadow-lg transform group-hover:rotate-180 transition-transform duration-700" />
              </div>
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4 tracking-tight">
                Parcours+
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
                Plateforme numérique pour l'enseignement de la course d'orientation
              </p>
              
              {/* Icônes centrales */}
              <div className="flex justify-center items-center gap-8 mt-8 opacity-60">
                <div className="group cursor-pointer" title="Gestion des groupes">
                  <Users className="w-6 h-6 text-cyan-400 group-hover:scale-125 transition-transform duration-300" />
                </div>
                <div className="group cursor-pointer" title="Sessions interactives">
                  <Target className="w-6 h-6 text-blue-400 group-hover:scale-125 transition-transform duration-300" />
                </div>
                <div className="group cursor-pointer" title="Suivi des progrès">
                  <Award className="w-6 h-6 text-purple-400 group-hover:scale-125 transition-transform duration-300" />
                </div>
                <div className="group cursor-pointer" title="Ressources pédagogiques">
                  <BookOpen className="w-6 h-6 text-indigo-400 group-hover:scale-125 transition-transform duration-300" />
                </div>
              </div>
            </div>

            {/* Deux espaces principaux côte à côte - TOUJOURS sur la même ligne */}
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-6xl w-full">
                <div className="grid grid-cols-2 gap-6 md:gap-8 lg:gap-12">
                  {/* Espace Professeur */}
                  <div
                    className="group relative bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-xl rounded-3xl p-6 md:p-8 lg:p-12 border border-green-400/30 hover:border-green-400/50 transition-all duration-500 hover:scale-105 shadow-2xl transform hover:-translate-y-2 hover:shadow-green-500/25 text-center overflow-hidden cursor-pointer"
                    onClick={() => setModeConnexionLocal("espaceProf")}
                  >
                    {/* Effet de brillance animé */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                    <div className="relative z-10">
                      <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 lg:mb-8 shadow-lg group-hover:rotate-6 transition-transform duration-300">
                        <span className="text-3xl md:text-4xl lg:text-6xl">👨‍🏫</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3 lg:mb-4">
                        Espace Professeur
                      </h2>
                    
                    </div>
                  </div>

                  {/* Espace Élève */}
                  <div
                    className="group relative bg-gradient-to-br from-blue-400/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-6 md:p-8 lg:p-12 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-500 hover:scale-105 shadow-2xl transform hover:-translate-y-2 hover:shadow-blue-500/25 text-center overflow-hidden cursor-pointer"
                    onClick={() => setModeConnexionLocal("espaceEleve")}
                  >
                    {/* Effet de brillance animé */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                    <div className="relative z-10">
                      <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 lg:mb-8 shadow-lg group-hover:rotate-6 transition-transform duration-300">
                        <span className="text-3xl md:text-4xl lg:text-6xl">🎓</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3 lg:mb-4">
                        Espace Élève
                      </h2>
                    
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bandeau professionnel informatif en bas */}
        <div className="relative z-10 bg-black/20 backdrop-blur-sm border-t border-white/10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-center items-center gap-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-1">50+</div>
                <div className="text-white/70 text-sm font-medium">Élèves</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">5+</div>
                <div className="text-white/70 text-sm font-medium">Professeurs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">1000+</div>
                <div className="text-white/70 text-sm font-medium">Parcours</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page Espace Professeur
  if (modeConnexionLocal === "espaceProf") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div
          className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Header avec bouton retour */}
          <div className="flex items-center justify-between mb-12">
            <button
              onClick={() => setModeConnexionLocal("accueil")}
              className="flex items-center text-white/60 hover:text-white transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="text-sm">Retour à l'accueil</span>
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-4 shadow-2xl">
                <span className="text-3xl">👨‍🏫</span>
              </div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                Espace Professeur
              </h1>
            </div>
            <div className="w-24"></div>
          </div>

          {/* Formulaire de connexion professeur */}
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 shadow-2xl">
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Adresse email"
                    value={newProfEmail}
                    onChange={(e) => setNewProfEmail(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={newProfPassword}
                    onChange={(e) => setNewProfPassword(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleProfConnection}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center group"
                  >
                    Connexion prof
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
                <button
                  onClick={() => setPage("motDePasseOublie")}
                  className="w-full text-white/60 hover:text-white transition-colors text-sm underline underline-offset-4"
                >
                  Mot de passe oublié ?
                </button>
                
                {/* Bouton créer un compte professeur */}
                <div className="text-center pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setPage("CreationCompteProf");
                      setModeConnexion("CreationCompteProf");
                    }}
                    className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 text-sm"
                  >
                    🧑‍🏫 Créer un compte professeur
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page Espace Élève
  if (modeConnexionLocal === "espaceEleve") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div
          className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Header avec bouton retour */}
          <div className="flex items-center justify-between mb-12">
            <button
              onClick={() => setModeConnexionLocal("accueil")}
              className="flex items-center text-white/60 hover:text-white transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="text-sm">Retour à l'accueil</span>
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl mb-4 shadow-2xl">
                <span className="text-3xl">🎓</span>
              </div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Espace Élève
              </h1>
            </div>
            <div className="w-24"></div>
          </div>

          {/* Formulaire de connexion élève */}
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-blue-400/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 shadow-2xl">
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Code unique professeur"
                    value={codeProfEleve}
                    onChange={(e) => setCodeProfEleve(e.target.value.toUpperCase())}
                    className="w-full px-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 uppercase tracking-widest font-mono"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Code élève"
                    value={codeEleve}
                    onChange={(e) => setCodeEleve(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  />
                </div>
                <button
                  onClick={handleEleveConnection}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center group"
                >
                  Connexion élève
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ParcoursPlus;