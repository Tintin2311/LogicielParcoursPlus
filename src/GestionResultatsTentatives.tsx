import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, BarChart3, Target, Zap, Award, Palette, Eye } from 'lucide-react';

const GestionResultatsTentatives = ({ setPage }) => {
  const [baremeEvaluation, setBaremeEvaluation] = useState([
    { type: "=", tentatives: 1, couleur: "#10B981", points: 10 },
    { type: "=", tentatives: 2, couleur: "#F59E0B", points: 7 },
    { type: "=", tentatives: 3, couleur: "#EF4444", points: 4 },
    { type: "≥", tentatives: 4, couleur: "#7C2D12", points: 0 },
  ]);

  const [isLoaded, setIsLoaded] = useState(true);
  const [selectedBareme, setSelectedBareme] = useState(null);

  const getConditionLabel = (type) => {
    switch (type) {
      case "=": return "Exactement";
      case "≥": return "Au minimum";
      case "≤": return "Au maximum";
      case "entre": return "Entre";
      default: return type;
    }
  };

  const getConditionIcon = (type) => {
    switch (type) {
      case "=": return "=";
      case "≥": return "≥";
      case "≤": return "≤";
      case "entre": return "↔";
      default: return type;
    }
  };

  const addNewBareme = () => {
    const newBareme = {
      type: "=",
      tentatives: Math.max(...baremeEvaluation.map(b => b.tentatives || 0)) + 1,
      couleur: "#6366F1",
      points: 0,
    };
    setBaremeEvaluation([...baremeEvaluation, newBareme]);
  };

  const deleteBareme = (index) => {
    if (baremeEvaluation.length > 1) {
      const newBareme = baremeEvaluation.filter((_, i) => i !== index);
      setBaremeEvaluation(newBareme);
    }
  };

  const updateBareme = (index, field, value) => {
    const newBareme = [...baremeEvaluation];
    
    if (field === 'type' && value === 'entre') {
      newBareme[index] = {
        ...newBareme[index],
        type: value,
        minTentatives: newBareme[index].tentatives || 1,
        maxTentatives: (newBareme[index].tentatives || 1) + 1
      };
      delete newBareme[index].tentatives;
    } else if (field === 'type' && newBareme[index].type === 'entre') {
      newBareme[index] = {
        ...newBareme[index],
        type: value,
        tentatives: newBareme[index].minTentatives || 1
      };
      delete newBareme[index].minTentatives;
      delete newBareme[index].maxTentatives;
    } else {
      newBareme[index][field] = value;
    }
    
    setBaremeEvaluation(newBareme);
  };

  const formatPoints = (points) => {
    if (typeof points === 'string') return points;
    return points.toString().replace('.', ',');
  };

  const parsePoints = (value) => {
    const cleaned = value.replace(',', '.').replace(/[^0-9.\-]/g, '');
    
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.' || cleaned.endsWith('.')) {
      return cleaned.replace('.', ',');
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? '' : parsed.toString().replace('.', ',');
  };

  const getContrastColor = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const renderBaremeCard = (bareme, index) => {
    const isSelected = selectedBareme === index;
    
    return (
      <div
        key={index}
        className={`group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02] ${
          isSelected 
            ? 'border-white/40 ring-2 ring-white/20 shadow-2xl scale-[1.02] -translate-y-2' 
            : 'border-white/20 hover:border-white/40 hover:shadow-xl'
        }`}
        style={{ animationDelay: `${index * 0.1}s` }}
        onClick={() => setSelectedBareme(isSelected ? null : index)}
      >
        {/* Glow Effect */}
        <div 
          className="absolute inset-0 opacity-20 blur-xl"
          style={{ 
            background: `radial-gradient(circle at center, ${bareme.couleur}40 0%, transparent 70%)` 
          }}
        ></div>

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
        
        <div className="relative z-10 p-6">
          {/* Header with condition badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <span className="text-white font-bold text-lg">{getConditionIcon(bareme.type)}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{getConditionLabel(bareme.type)}</h3>
                <p className="text-white/60 text-sm">
                  {bareme.type === 'entre' 
                    ? `${bareme.minTentatives || 1} à ${bareme.maxTentatives || 2} tentatives`
                    : `${bareme.tentatives || 1} tentative${(bareme.tentatives || 1) > 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
            
            {/* Delete button */}
            {baremeEvaluation.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBareme(index);
                }}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-lg text-red-300 hover:text-red-200 transition-all duration-300 hover:scale-110 border border-red-500/30 hover:border-red-500/50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Visual representation */}
          <div className="mb-6">
            <div 
              className="h-16 rounded-xl flex items-center justify-center border-2 border-white/20 shadow-inner relative overflow-hidden"
              style={{ backgroundColor: bareme.couleur }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="relative z-10 flex items-center space-x-2">
                <Award 
                  className="w-6 h-6" 
                  style={{ color: getContrastColor(bareme.couleur) }}
                />
                <span 
                  className="text-2xl font-bold"
                  style={{ color: getContrastColor(bareme.couleur) }}
                >
                  {formatPoints(bareme.points)} pts
                </span>
              </div>
            </div>
          </div>

          {/* Configuration form */}
          <div className="space-y-4">
            {/* Condition selector */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Condition
              </label>
              <select
                value={bareme.type}
                onChange={(e) => updateBareme(index, 'type', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="=" className="bg-gray-800">Exactement</option>
                <option value="≥" className="bg-gray-800">Au minimum</option>
                <option value="≤" className="bg-gray-800">Au maximum</option>
                <option value="entre" className="bg-gray-800">Entre</option>
              </select>
            </div>

            {/* Tentatives input */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                Nombre de tentatives
              </label>
              {bareme.type === "entre" ? (
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      value={bareme.minTentatives || ""}
                      onChange={(e) => updateBareme(index, 'minTentatives', parseInt(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-center focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                      placeholder="Min"
                    />
                  </div>
                  <div className="text-white/70 font-medium">à</div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      value={bareme.maxTentatives || ""}
                      onChange={(e) => updateBareme(index, 'maxTentatives', parseInt(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-center focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                      placeholder="Max"
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={bareme.tentatives || ""}
                  onChange={(e) => updateBareme(index, 'tentatives', parseInt(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                />
              )}
            </div>

            {/* Color and points */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center">
                  <Palette className="w-4 h-4 mr-1" />
                  Couleur
                </label>
                <div className="relative">
                  <input
                    type="color"
                    value={bareme.couleur}
                    onChange={(e) => updateBareme(index, 'couleur', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-12 rounded-xl border-2 border-white/20 cursor-pointer transition-all duration-300 hover:border-white/40"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center">
                  <Award className="w-4 h-4 mr-1" />
                  Points
                </label>
                <input
                  type="text"
                  value={formatPoints(bareme.points)}
                  onChange={(e) => updateBareme(index, 'points', parsePoints(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500/20 rounded-full filter blur-3xl animate-pulse transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: "4s" }}></div>
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '50px 50px'
      }}></div>

      <div className={`relative z-10 container mx-auto px-6 py-8 transition-all duration-1000 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => setPage("gestionResultats")}
            className="group flex items-center px-6 py-3 bg-white/5 backdrop-blur-sm rounded-xl text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Retour
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 mb-3">
              Barème des Tentatives
            </h1>
            <p className="text-xl text-white/70 font-light">
              Configurez l'évaluation selon le nombre de tentatives
            </p>
          </div>

          <div className="flex flex-col items-end space-y-3">
            <div className="text-right">
              <p className="text-white/60 text-sm mb-1"></p>
              <div className="text-white/40 text-xs">
                
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-xl rounded-xl p-6 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  {Math.max(...baremeEvaluation.map(b => parseFloat(b.points) || 0))}
                </div>
                <div className="text-white/60 text-sm">Points maximum</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {Math.min(...baremeEvaluation.map(b => parseFloat(b.points) || 0))}
                </div>
                <div className="text-white/60 text-sm">Points minimum</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {baremeEvaluation.length}
                </div>
                <div className="text-white/60 text-sm">Conditions définies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {Math.max(...baremeEvaluation.map(b => b.tentatives || b.maxTentatives || 0))}
                </div>
                <div className="text-white/60 text-sm">Tentatives max</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">Configuration des Barèmes</h2>
            <p className="text-white/70 text-lg">
              Définissez les conditions, couleurs et points selon le nombre de tentatives
            </p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30">
              <Eye className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-blue-300 text-sm">Cliquez sur une carte pour la modifier</span>
            </div>
          </div>

          {/* Barème Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {baremeEvaluation.map((bareme, index) => renderBaremeCard(bareme, index))}
          </div>

          {/* Add Button */}
          <div className="text-center">
            <button
              onClick={addNewBareme}
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-2xl text-white font-bold shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 transform hover:-translate-y-1"
            >
              <Plus className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-300" />
              Ajouter une condition
            </button>
          </div>

          {/* Tips Section */}
          <div className="mt-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Target className="w-6 h-6 text-blue-400 mr-2" />
              Conseils d'utilisation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/70">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-white">Points décroissants</div>
                  <div className="text-sm">Attribuez plus de points aux élèves qui réussissent en moins de tentatives</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-white">Couleurs distinctives</div>
                  <div className="text-sm">Utilisez des couleurs contrastées pour une meilleure lisibilité</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-white">Conditions logiques</div>
                  <div className="text-sm">Organisez vos conditions de manière cohérente et progressive</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-white">Points négatifs</div>
                  <div className="text-sm">Vous pouvez utiliser des points négatifs pour pénaliser les échecs répétés</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionResultatsTentatives;