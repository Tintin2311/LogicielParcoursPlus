// src/gestionParcours.tsx
import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Route, Share2, Users2, Plus, Footprints } from "lucide-react";

type GestionParcoursProps = {
  setPage: (page: string) => void;
};

type MenuItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
  hoverGlow: string;
  textHover: string;
};

const GestionParcours: React.FC<GestionParcoursProps> = ({ setPage }) => {
  // ✅ number | null pour pouvoir passer l'index au setter
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const menuItems: MenuItem[] = [
    {
      id: "MesParcours",
      title: "Mes parcours",
      description: "Consultez et gérez vos parcours existants",
      icon: Footprints,
      color: "from-purple-600 to-purple-700",
      bgColor: "from-purple-500/10 to-purple-700/10",
      borderColor: "border-purple-400/20 hover:border-purple-400/60",
      shadowColor: "hover:shadow-purple-500/30",
      hoverGlow: "from-purple-400/5 to-purple-600/5",
      textHover: "group-hover:text-purple-200",
    },
    {
      id: "CreerUnNouveauParcours",
      title: "Créer un parcours",
      description: "Concevez de nouveaux parcours d'orientation",
      icon: Plus,
      color: "from-emerald-500 to-teal-600",
      bgColor: "from-emerald-500/10 to-teal-600/10",
      borderColor: "border-emerald-400/20 hover:border-emerald-400/60",
      shadowColor: "hover:shadow-emerald-500/30",
      hoverGlow: "from-emerald-400/5 to-teal-400/5",
      textHover: "group-hover:text-emerald-200",
    },
    {
      id: "Association",
      title: "Associer parcours et groupes",
      description: "Liez vos parcours aux groupes d'élèves",
      icon: Users2,
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-500/10 to-cyan-600/10",
      borderColor: "border-blue-400/20 hover:border-blue-400/60",
      shadowColor: "hover:shadow-blue-500/30",
      hoverGlow: "from-blue-400/5 to-cyan-400/5",
      textHover: "group-hover:text-blue-200",
    },
    {
      id: "PartageParcours",
      title: "Partager les parcours",
      description: "Partagez vos parcours avec d'autres professeurs",
      icon: Share2,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-500/10 to-red-600/10",
      borderColor: "border-orange-400/20 hover:border-orange-400/60",
      shadowColor: "hover:shadow-orange-500/30",
      hoverGlow: "from-orange-400/5 to-red-400/5",
      textHover: "group-hover:text-orange-200",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden font-sans pb-32">
      {/* Back Button */}
      <div className="absolute top-8 left-8 z-50">
        <button
          onClick={() => setPage("AccueilProf")}
          className="flex items-center px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 shadow-lg hover:shadow-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'Accueil
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 rounded-full mb-8 shadow-2xl">
            <Route className="w-12 h-12 text-white" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 rounded-full animate-ping opacity-20" />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Gestion des Parcours
          </h1>
          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
            Créez, gérez et partagez vos parcours d&apos;orientation avec facilité
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full">
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              className="group relative"
              onMouseEnter={() => setHoveredCard(index)}   // ✅ number OK
              onMouseLeave={() => setHoveredCard(null)}
            >
              <button
                onClick={() => setPage(item.id)}
                className={`w-full h-full p-8 bg-gradient-to-br ${item.bgColor} backdrop-blur-sm rounded-3xl border ${item.borderColor} transition-all duration-700 hover:scale-105 shadow-2xl ${item.shadowColor} transform hover:-translate-y-3 relative overflow-hidden`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Glowing effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${item.hoverGlow} rounded-3xl ${
                    hoveredCard === index ? "opacity-100" : "opacity-0"
                  } transition-opacity duration-700`}
                />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                <div className="relative flex flex-col items-center text-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div
                      className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}
                    >
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-2xl blur-md ${
                        hoveredCard === index ? "opacity-50" : "opacity-0"
                      } transition-opacity duration-500 -z-10`}
                    />
                  </div>

                  <h3
                    className={`text-2xl font-bold text-white mb-4 ${item.textHover} transition-colors duration-300`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`text-blue-200/80 text-sm leading-relaxed ${item.textHover} transition-colors duration-300`}
                  >
                    {item.description}
                  </p>

                  {/* Progress indicator */}
                  <div className="mt-6 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} transform ${
                        hoveredCard === index ? "translate-x-0" : "-translate-x-full"
                      } transition-transform duration-700`}
                    />
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GestionParcours;
