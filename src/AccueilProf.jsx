import React, { useState, useEffect } from 'react';
import { Users, MapPin, Route, BarChart3, Settings, LogOut } from 'lucide-react';

const AccueilProf = ({ setPage, setProfesseur, setModeConnexion }) => {

  const [isLoaded, setIsLoaded] = useState(false);
  const [groupesCount, setGroupesCount] = useState(0);
  const [balisesCount, setBalisesCount] = useState(0);
  const [parcoursCount, setParcoursCount] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // Simulation du chargement des données
  useEffect(() => {
    setIsLoaded(true);
    
    // Simulation d'un chargement de données depuis la DB
    const loadData = async () => {
      setIsLoadingCounts(true);
      
      // Simulation d'un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulation de données récupérées
      setGroupesCount(3);
      setBalisesCount(24);
      setParcoursCount(8);
      setIsLoadingCounts(false);
    };

    loadData();
  }, []);

  // Fonction pour simuler l'ajout/suppression d'éléments
  const simulateChange = (type) => {
    if (type === 'groupes') {
      setGroupesCount(prev => prev + 1);
    } else if (type === 'balises') {
      setBalisesCount(prev => prev + 1);
    } else if (type === 'parcours') {
      setParcoursCount(prev => prev + 1);
    }
  };

  // Fonction de déconnexion corrigée
  const handleLogout = () => {
    try {
      setPage("accueil");
      setProfesseur(null);
      setModeConnexion("accueil");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      alert("Erreur lors de la déconnexion");
    }
  };

  // Fonction de navigation simplifiée
  const handleNavigation = (pageId) => {
    try {
      // Pour les autres pages, afficher une alerte temporaire
      const pageNames = {
        'gestionGroupes': 'Gestion des groupes',
        'gestionBalises': 'Gestion des balises',
        'gestionParcours': 'Gestion des parcours',
        'gestionResultats': 'Gestion des résultats',
        'settings': 'Paramètres'
      };
      
      setPage(pageId);

      
      // Dans un vrai projet avec React Router configuré, vous utiliseriez :
      // navigate(`/prof/${pageId.replace('gestion', '').toLowerCase()}`);
      
    } catch (error) {
      console.error('Erreur lors de la navigation:', error);
      alert('Erreur de navigation');
    }
  };

  const menuItems = [
    {
      id: "gestionGroupes",
      title: "Gestion des groupes",
      description: "Organisez vos classes et gérez les élèves",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-400/20 to-cyan-600/20",
      borderColor: "border-blue-400/30 hover:border-blue-400/50",
      shadowColor: "hover:shadow-blue-500/25",
      stat: isLoadingCounts ? "..." : groupesCount.toString(),
      unit: groupesCount <= 1 ? "groupe" : "groupes"
    },
    {
      id: "gestionBalises",
      title: "Gestion des balises",
      description: "Configurez les points de contrôle",
      icon: MapPin,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-400/20 to-emerald-600/20",
      borderColor: "border-green-400/30 hover:border-green-400/50",
      shadowColor: "hover:shadow-green-500/25",
      stat: isLoadingCounts ? "..." : balisesCount.toString(),
      unit: balisesCount <= 1 ? "balise" : "balises"
    },
    {
      id: "gestionParcours",
      title: "Gestion des parcours",
      description: "Créez et modifiez les parcours",
      icon: Route,
      color: "from-purple-500 to-indigo-500",
      bgColor: "from-purple-400/20 to-indigo-600/20",
      borderColor: "border-purple-400/30 hover:border-purple-400/50",
      shadowColor: "hover:shadow-purple-500/25",
      stat: isLoadingCounts ? "..." : parcoursCount.toString(),
      unit: parcoursCount <= 1 ? "parcours" : "parcours"
    },
    {
      id: "gestionResultats",
      title: "Gestion des barèmes",
      description: "Analysez les performances",
      icon: BarChart3,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-400/20 to-red-600/20",
      borderColor: "border-orange-400/30 hover:border-orange-400/50",
      shadowColor: "hover:shadow-orange-500/25",
      stat: "",
      unit: ""
    }
  ];

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
        {/* Header avec informations du professeur */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
            <span className="text-3xl">👨‍🏫</span>
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
            Bienvenue, Professeur !
          </h1>
          <p className="text-xl text-white/80 font-light">
            Tableau de bord - Gestion de la course d'orientation
          </p>
        </div>

        {/* Boutons déconnexion et paramètres */}
        <div className="absolute top-8 left-8 right-8 flex justify-between">
          <button 
            className="flex items-center px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-xl text-red-300 hover:bg-red-500/30 transition-all duration-300 hover:scale-105 border border-red-500/30 hover:border-red-500/50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </button>
          <button 
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40"
            onClick={() => setPage('Parametres')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
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
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-6 transition-transform duration-300`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Statistique en grand */}
                  {item.stat && (
                    <div className="mb-2">
                      <div className={`text-4xl font-bold text-white transition-all duration-300 ${isLoadingCounts ? 'animate-pulse' : ''}`}>
                        {item.stat}
                      </div>
                      {item.unit && !isLoadingCounts && (
                        <div className="text-sm text-white/60 -mt-1">
                          {item.unit}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Titre principal */}
                  <h3 className={`text-2xl font-bold text-white mb-2 group-hover:text-white transition-colors ${!item.stat ? 'mt-8' : ''}`}>
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
        </div>
      </div>
      {/* La section des informations de session a été complètement supprimée d'ici */}
    </div>
  );
};

export default AccueilProf;