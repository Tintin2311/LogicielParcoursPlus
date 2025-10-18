import React, { useEffect, useState } from "react";
import { Target, Award, LogOut, BarChart3, PenTool } from "lucide-react";

interface EleveConnecteType {
  id?: string;
  display_name?: string | null; // si tu le fournis depuis ParcoursPlus
  name?: string;                // colonne `name` de students
  nom?: string;                 // fallback éventuel
}

interface AccueilEleveProps {
  setPage: (page: string) => void;
  eleveConnecte: EleveConnecteType | null;
  handleDeconnexion: () => void;
}

type MenuItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
  stat?: string;
  unit?: string;
};

const AccueilEleve: React.FC<AccueilEleveProps> = ({
  setPage,
  eleveConnecte,
  handleDeconnexion,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [resultatsCount, setResultatsCount] = useState(0);
  const [moyenneGenerale, setMoyenneGenerale] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    setIsLoaded(true);

    const loadStats = async () => {
      setIsLoadingStats(true);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // mock
      setResultatsCount(12);
      setMoyenneGenerale(14.2);
      setIsLoadingStats(false);
    };

    loadStats();
  }, []);

  const handleNavigation = (pageId: string) => {
    try {
      setPage(pageId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Erreur: ${String(err)}`;
      console.error("Erreur lors de la navigation:", err);
      console.log(`Erreur de navigation: ${message}`);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: "EcrireResultat",
      title: "Saisir un résultat",
      description: "Enregistre tes performances sur les parcours",
      icon: PenTool,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-400/20 to-cyan-600/20",
      borderColor: "border-blue-400/30 hover:border-blue-400/50",
      shadowColor: "hover:shadow-blue-500/25",
      stat: isLoadingStats ? "..." : resultatsCount.toString(),
      unit: resultatsCount <= 1 ? "résultat" : "résultats",
    },
    {
      id: "StatistiquesEleve",
      title: "Mes statistiques",
      description: "Consulte tes progrès et tes performances",
      icon: BarChart3,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-400/20 to-emerald-600/20",
      borderColor: "border-green-400/30 hover:border-green-400/50",
      shadowColor: "hover:shadow-green-500/25",
      stat: isLoadingStats ? "..." : `${moyenneGenerale.toFixed(1)}/20`,
      unit: "moyenne",
    },
    {
      id: "objectifs",
      title: "Mes objectifs",
      description: "Fixe-toi des défis et suis ta progression",
      icon: Target,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-400/20 to-red-600/20",
      borderColor: "border-orange-400/30 hover:border-orange-400/50",
      shadowColor: "hover:shadow-orange-500/25",
    },
  ];

  // ordre de priorité: display_name (depuis ParcoursPlus) -> name (table students) -> nom -> fallback
  const eleveNom =
    eleveConnecte?.display_name ||
    eleveConnecte?.name ||
    eleveConnecte?.nom ||
    "Élève";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Geometric Patterns */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rotate-45 rounded-lg"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 border-2 border-white rotate-12 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-white rotate-45"></div>
        <div className="absolute top-2/3 left-1/4 w-20 h-20 border-2 border-white rotate-12 rounded-lg"></div>
      </div>

      <div
        className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Header avec informations de l'élève */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 rounded-2xl mb-6 shadow-2xl">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-2">
            Bonjour {eleveNom} !
          </h1>
          <p className="text-xl text-white/80 font-light">
            Que souhaites-tu faire aujourd&apos;hui ?
          </p>
        </div>

        {/* Bouton déconnexion à gauche */}
        <div className="absolute top-8 left-8">
          <button
            onClick={handleDeconnexion}
            className="flex items-center px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-xl text-red-300 hover:bg-red-500/30 transition-all duration-300 hover:scale-105 border border-red-500/30 hover:border-red-500/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </button>
        </div>

        {/* Menu principal */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-8">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                className={`group relative bg-gradient-to-br ${item.bgColor} backdrop-blur-xl rounded-3xl p-8 border ${item.borderColor} transition-all duration-500 hover:scale-105 shadow-2xl transform hover:-translate-y-2 ${item.shadowColor} cursor-pointer overflow-hidden ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
                onClick={() => handleNavigation(item.id)}
              >
                {/* Effet de brillance animé */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                <div className="relative z-10 text-center">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-6 transition-transform duration-300`}
                  >
                    <item.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Statistique en grand */}
                  {typeof item.stat !== "undefined" && (
                    <div className="mb-2">
                      <div
                        className={`text-4xl font-bold text-white transition-all duration-300 ${
                          isLoadingStats ? "animate-pulse" : ""
                        }`}
                      >
                        {item.stat}
                      </div>
                      {item.unit && !isLoadingStats && (
                        <div className="text-sm text-white/60 -mt-1">
                          {item.unit}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Titre principal */}
                  <h3
                    className={`text-2xl font-bold text-white mb-2 group-hover:text-white transition-colors ${
                      !item.stat ? "mt-8" : ""
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-white/70 text-sm group-hover:text-white/90 transition-colors">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Section motivation */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl mb-4 shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Continue comme ça !
            </h2>
            <p className="text-white/70 max-w-md mx-auto">
              Chaque effort compte. Tes progrès sont le reflet de ton travail et
              de ta persévérance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccueilEleve;
