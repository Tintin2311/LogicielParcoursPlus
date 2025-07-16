import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass, FolderOpen, Plus, Link, Share2 } from 'lucide-react';

const GestionParcours = ({ setPage }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const menuItems = [
    {
      id: "MesParcours",
      title: "Mes parcours",
      description: "Consultez et gérez vos parcours existants",
      icon: FolderOpen,
      color: "from-purple-500 to-indigo-500",
      bgColor: "from-purple-400/20 to-indigo-600/20",
      borderColor: "border-purple-400/30 hover:border-purple-400/50",
      shadowColor: "hover:shadow-purple-500/25"
    },
    {
      id: "CreerUnNouveauParcours",
      title: "Créer un parcours",
      description: "Concevez de nouveaux parcours d'orientation",
      icon: Plus,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-400/20 to-emerald-600/20",
      borderColor: "border-green-400/30 hover:border-green-400/50",
      shadowColor: "hover:shadow-green-500/25"
    },
    {
      id: "associationParcoursGroupe",
      title: "Associer parcours et groupes",
      description: "Liez vos parcours aux groupes d'élèves",
      icon: Link,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-400/20 to-cyan-600/20",
      borderColor: "border-blue-400/30 hover:border-blue-400/50",
      shadowColor: "hover:shadow-blue-500/25"
    },
    {
      id: "partageParcours",
      title: "Partager les parcours",
      description: "Partagez vos parcours avec d'autres professeurs",
      icon: Share2,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-400/20 to-red-600/20",
      borderColor: "border-orange-400/30 hover:border-orange-400/50",
      shadowColor: "hover:shadow-orange-500/25"
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

      {/* Floating animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse opacity-20"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-pulse opacity-30" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse opacity-25" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-emerald-300 rounded-full animate-pulse opacity-20" style={{ animationDelay: "3s" }}></div>
      </div>

      <div
        className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <button
            onClick={() => setPage("AccueilProf")}
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'Accueil
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12 mt-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 via-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
            <Compass className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 mb-2">
            Gestion des Parcours
          </h1>
          <p className="text-xl text-white/80 font-light">
            Créez, gérez et partagez vos parcours d'orientation
          </p>
        </div>

        {/* Menu principal */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                className={`group relative bg-gradient-to-br ${item.bgColor} backdrop-blur-xl rounded-3xl p-8 border ${item.borderColor} transition-all duration-500 hover:scale-105 shadow-2xl transform hover:-translate-y-2 ${item.shadowColor} cursor-pointer overflow-hidden ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
                onClick={() => {
                  console.log(`Navigating to: ${item.id}`); // You can add a console log here to verify
                  setPage(item.id);
                }}
              >
                {/* Effet de brillance animé */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                <div className="relative z-10 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-6 transition-transform duration-300`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Titre principal */}
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-white transition-colors">
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
    </div>
  );
};

export default GestionParcours;