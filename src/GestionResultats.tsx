import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, UserPlus, Mail, Lock, User, CheckCircle, GraduationCap, Shield, BarChart3, Trophy, RotateCcw, Sparkles, Zap, Target, RefreshCw, Coins, TrendingUp } from 'lucide-react';

function GestionResultats({ setPage = () => {} }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
  <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
  <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: "4s" }}></div>

      </div>

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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-8 shadow-2xl">
            <BarChart3 className="w-12 h-12 text-white" />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-ping opacity-20"></div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Gestion des barèmes
          </h1>
          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
            Personnalisez vos barèmes pour une évaluation adaptée à vos objectifs pédagogiques
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl w-full">
          {/* Barème tentatives */}
          <div 
            className="group relative"
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <button
              onClick={() => setPage("GestionResultatsTentatives")}
              className="w-full h-full p-8 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 backdrop-blur-sm rounded-3xl border border-blue-400/20 hover:border-blue-400/60 transition-all duration-700 hover:scale-105 shadow-2xl hover:shadow-blue-500/30 transform hover:-translate-y-3 relative overflow-hidden"
            >
              {/* Glowing effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-cyan-400/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              


              <div className="relative flex flex-col items-center text-center">
                <div className="relative w-20 h-20 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-blue-500/50">
                    <RefreshCw className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors duration-300">
                  Barème tentatives
                </h3>
                <p className="text-blue-200/80 text-sm leading-relaxed group-hover:text-blue-100 transition-colors duration-300">
                  Configurez les barèmes selon le nombre de tentatives
                </p>
                
                {/* Progress indicator */}
                <div className="mt-6 w-full h-1 bg-blue-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                </div>
              </div>
            </button>
          </div>

          {/* Mode d'attribution des points */}
          <div 
            className="group relative"
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <button
              onClick={() => setPage("GestionPoints")}
              className="w-full h-full p-8 bg-gradient-to-br from-orange-500/10 to-red-600/10 backdrop-blur-sm rounded-3xl border border-orange-400/20 hover:border-orange-400/60 transition-all duration-700 hover:scale-105 shadow-2xl hover:shadow-orange-500/30 transform hover:-translate-y-3 relative overflow-hidden"
            >
              {/* Glowing effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-red-400/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              


              <div className="relative flex flex-col items-center text-center">
                <div className="relative w-20 h-20 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-orange-500/50">
                    <Coins className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-200 transition-colors duration-300">
                  Attribution des points
                </h3>
                <p className="text-blue-200/80 text-sm leading-relaxed group-hover:text-orange-100 transition-colors duration-300">
                  Définissez comment les points sont attribués
                </p>
                
                {/* Progress indicator */}
                <div className="mt-6 w-full h-1 bg-orange-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                </div>
              </div>
            </button>
          </div>

          {/* Progressivité */}
          <div 
            className="group relative"
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <button
              onClick={() => setPage("GestionResultatsProgressivite")}
              className="w-full h-full p-8 bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm rounded-3xl border border-green-400/20 hover:border-green-400/60 transition-all duration-700 hover:scale-105 shadow-2xl hover:shadow-green-500/30 transform hover:-translate-y-3 relative overflow-hidden"
            >
              {/* Glowing effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-emerald-400/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              


              <div className="relative flex flex-col items-center text-center">
                <div className="relative w-20 h-20 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-green-500/50">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-200 transition-colors duration-300">
                  Progressivité
                </h3>
                <p className="text-blue-200/80 text-sm leading-relaxed group-hover:text-green-100 transition-colors duration-300">
                  Débloquer progressivement des parcours en réalisant des objectifs
                </p>
                
                {/* Progress indicator */}
                <div className="mt-6 w-full h-1 bg-green-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Footer with interaction hint */}
        <div className="mt-20 text-center">
          <div className="flex items-center justify-center space-x-2 text-blue-300/50 text-sm animate-pulse">
       
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Additional floating elements for ambiance */}
      <div className="fixed bottom-10 left-10 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-30 animate-bounce" style={{ animationDelay: "1.5s" }}></div>
      <div className="fixed bottom-20 right-20 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-40 animate-bounce" style={{ animationDelay: "2.8s" }}></div>
      <div className="fixed top-1/3 right-10 w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-50 animate-bounce" style={{ animationDelay: "0.8s" }}></div>
    </div>
  );
}

export default GestionResultats;