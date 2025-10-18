import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Users, 
  Search, 
  Grid, 
  List, 
  Edit3, 
  Trash2, 
  UserPlus,
  Hash,
  GraduationCap,
  ChevronRight,
  Copy,
  CheckCircle
} from 'lucide-react';

// Interfaces
interface Eleve {
  id: string;
  prenom: string;
  nom: string;
  code_unique: string;
  classe_id: string;
  created_at?: string;
}

interface Classe {
  id: string;
  nom: string;
  professeur_id: string;
  created_at?: string;
  nb_eleves?: number;
  eleves?: Eleve[];
}

// Générateur de code unique pour les élèves
const generateUniqueCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Simule les données (remplacez par vos appels Supabase)
const mockClasses = [
  { 
    id: '1', 
    nom: '6A', 
    professeur_id: 'prof1', 
    nb_eleves: 28,
    eleves: [
      { id: '1', prenom: 'Emma', nom: 'Dubois', code_unique: 'EM4K2X', classe_id: '1' },
      { id: '2', prenom: 'Lucas', nom: 'Martin', code_unique: 'LU8N5Z', classe_id: '1' },
      { id: '3', prenom: 'Léa', nom: 'Bernard', code_unique: 'LE9P7Y', classe_id: '1' }
    ]
  },
  { 
    id: '2', 
    nom: '5B', 
    professeur_id: 'prof1', 
    nb_eleves: 25,
    eleves: [
      { id: '4', prenom: 'Hugo', nom: 'Petit', code_unique: 'HU3M8W', classe_id: '2' },
      { id: '5', prenom: 'Chloé', nom: 'Durand', code_unique: 'CH6R4Q', classe_id: '2' }
    ]
  }
];

const MesGroupes = ({ professeur }) => {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [currentView, setCurrentView] = useState<'classes' | 'eleves'>('classes');
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoaded, setIsLoaded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Chargement initial des classes
  useEffect(() => {
    const loadClasses = async () => {
      setIsLoaded(false);
      // Simuler un délai de chargement
      setTimeout(() => {
        setClasses(mockClasses);
        setIsLoaded(true);
      }, 500);
    };

    if (professeur?.user_id) {
      loadClasses();
    }
  }, [professeur?.user_id]);

  // Créer une nouvelle classe
  const handleCreateClasse = async () => {
    const nom = prompt('Nom de la nouvelle classe (ex: 6A, 5B, CM2...) :');
    if (!nom || !nom.trim()) return;

    const newClasse: Classe = {
      id: Date.now().toString(),
      nom: nom.trim(),
      professeur_id: professeur.user_id,
      nb_eleves: 0,
      eleves: [],
      created_at: new Date().toISOString()
    };

    setClasses(prev => [...prev, newClasse]);
  };

  // Modifier une classe
  const handleEditClasse = async (classeId: string, currentName: string) => {
    const newName = prompt(`Nouveau nom pour "${currentName}" :`, currentName);
    if (!newName || !newName.trim() || newName === currentName) return;

    setClasses(prev => prev.map(classe => 
      classe.id === classeId 
        ? { ...classe, nom: newName.trim() }
        : classe
    ));
  };

  // Supprimer une classe
  const handleDeleteClasse = async (classeId: string, className: string) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la classe "${className}" ? Cela supprimera également tous les élèves de cette classe. Cette action est irréversible.`
    );
    if (!confirmDelete) return;

    setClasses(prev => prev.filter(classe => classe.id !== classeId));
    if (selectedClasse && selectedClasse.id === classeId) {
      setSelectedClasse(null);
      setCurrentView('classes');
    }
  };

  // Ajouter un élève
  const handleAddEleve = async (classeId: string) => {
    const prenom = prompt('Prénom de l\'élève :');
    if (!prenom || !prenom.trim()) return;

    const nom = prompt('Nom de l\'élève :');
    if (!nom || !nom.trim()) return;

    const newEleve: Eleve = {
      id: Date.now().toString(),
      prenom: prenom.trim(),
      nom: nom.trim(),
      code_unique: generateUniqueCode(),
      classe_id: classeId,
      created_at: new Date().toISOString()
    };

    setClasses(prev => prev.map(classe => {
      if (classe.id === classeId) {
        const updatedEleves = [...(classe.eleves || []), newEleve];
        return {
          ...classe,
          eleves: updatedEleves,
          nb_eleves: updatedEleves.length
        };
      }
      return classe;
    }));

    if (selectedClasse && selectedClasse.id === classeId) {
      setSelectedClasse(prev => prev ? {
        ...prev,
        eleves: [...(prev.eleves || []), newEleve],
        nb_eleves: (prev.nb_eleves || 0) + 1
      } : null);
    }
  };

  // Supprimer un élève
  const handleDeleteEleve = async (eleveId: string, eleveNom: string) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'élève "${eleveNom}" ?`
    );
    if (!confirmDelete) return;

    setClasses(prev => prev.map(classe => ({
      ...classe,
      eleves: classe.eleves?.filter(eleve => eleve.id !== eleveId),
      nb_eleves: (classe.eleves?.filter(eleve => eleve.id !== eleveId).length || 0)
    })));

    if (selectedClasse) {
      setSelectedClasse(prev => prev ? {
        ...prev,
        eleves: prev.eleves?.filter(eleve => eleve.id !== eleveId),
        nb_eleves: (prev.eleves?.filter(eleve => eleve.id !== eleveId).length || 0)
      } : null);
    }
  };

  // Copier le code d'un élève
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtrage
  const filteredClasses = classes.filter(classe =>
    classe.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEleves = selectedClasse?.eleves?.filter(eleve =>
    `${eleve.prenom} ${eleve.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eleve.code_unique.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950">
      {/* Fond animé */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-fuchsia-800 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-blue-800 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-indigo-800 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              {currentView === 'classes' ? (
                <div>
                  <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 drop-shadow-lg">
                    Mes groupes
                  </h1>
                  <p className="text-purple-200 mt-1">{classes.length} classe{classes.length > 1 ? 's' : ''}</p>
                </div>
              ) : selectedClasse ? (
                <div>
                  <div className="flex items-center text-sm text-purple-200 mb-2">
                    <button
                      onClick={() => {
                        setCurrentView('classes');
                        setSelectedClasse(null);
                        setSearchTerm('');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Mes Classes
                    </button>
                    <ChevronRight className="w-4 h-4 text-purple-400 mx-2" />
                    <span className="text-white font-semibold">{selectedClasse.nom}</span>
                  </div>
                  <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-green-300 drop-shadow-lg">
                    Élèves - {selectedClasse.nom}
                  </h1>
                  <p className="text-blue-200 mt-1">{selectedClasse.nb_eleves || 0} élève{(selectedClasse.nb_eleves || 0) > 1 ? 's' : ''}</p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center space-x-4">
              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={
                    currentView === 'classes' 
                      ? "Rechercher une classe..." 
                      : "Rechercher un élève ou code..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-purple-800/50 border border-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300 shadow-inner min-w-[250px]"
                />
              </div>

              {/* Toggle vue grille/liste */}
              {currentView === 'classes' && (
                <div className="flex bg-purple-800/50 rounded-lg p-1 border border-purple-700 shadow-inner">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-purple-700 shadow-md text-white' : 'hover:bg-purple-700/50 text-purple-300'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-purple-700 shadow-md text-white' : 'hover:bg-purple-700/50 text-purple-300'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bouton d'action principal */}
          <div className="mb-8">
            {currentView === 'classes' ? (
              <button
                onClick={handleCreateClasse}
                className="flex items-center px-6 py-3 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-lg hover:from-purple-600 hover:to-fuchsia-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouvelle Classe
              </button>
            ) : selectedClasse ? (
              <button
                onClick={() => handleAddEleve(selectedClasse.id)}
                className="flex items-center px-6 py-3 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Ajouter un Élève
              </button>
            ) : null}
          </div>

          {/* Contenu principal */}
          <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {currentView === 'classes' ? (
              // Vue des classes
              filteredClasses.length === 0 ? (
                <div className="text-center py-16 bg-purple-900/50 rounded-xl shadow-2xl border border-purple-700 backdrop-blur-sm">
                  <div className="w-24 h-24 mx-auto mb-6 bg-purple-800/50 rounded-full flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-12 h-12 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {searchTerm ? 'Aucune classe trouvée' : 'Aucune classe créée'}
                  </h3>
                  <p className="text-purple-300 mb-6">
                    {searchTerm 
                      ? 'Essayez de modifier votre recherche.' 
                      : 'Créez votre première classe pour commencer.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleCreateClasse}
                      className="px-6 py-3 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-lg hover:from-purple-600 hover:to-fuchsia-700 transition-all duration-300 shadow-md"
                    >
                      Créer une classe
                    </button>
                  )}
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                  {filteredClasses.map(classe => (
                    <div
                      key={classe.id}
                      className={`
                        bg-gradient-to-br from-purple-900/60 to-indigo-900/60 
                        border border-purple-700 rounded-xl shadow-xl backdrop-blur-sm
                        hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]
                        ${viewMode === 'list' ? 'flex items-center justify-between p-4' : 'p-6'}
                      `}
                    >
                      <div className={viewMode === 'list' ? 'flex items-center space-x-4' : ''}>
                        <div className={`
                          ${viewMode === 'grid' ? 'w-16 h-16 mx-auto mb-4' : 'w-12 h-12'} 
                          bg-purple-800/50 rounded-full flex items-center justify-center shadow-lg
                        `}>
                          <GraduationCap className={`${viewMode === 'grid' ? 'w-8 h-8' : 'w-6 h-6'} text-purple-400`} />
                        </div>
                        
                        <div className={viewMode === 'grid' ? 'text-center' : ''}>
                          <h3 className="text-xl font-bold text-white mb-2">{classe.nom}</h3>
                          <div className="flex items-center justify-center space-x-2 text-purple-300 mb-4">
                            <Users className="w-4 h-4" />
                            <span>{classe.nb_eleves || 0} élève{(classe.nb_eleves || 0) > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex ${viewMode === 'grid' ? 'justify-center' : ''} space-x-2`}>
                        <button
                          onClick={() => {
                            setSelectedClasse(classe);
                            setCurrentView('eleves');
                            setSearchTerm('');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClasse(classe.id, classe.nom)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-md"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClasse(classe.id, classe.nom)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : selectedClasse ? (
              // Vue des élèves
              filteredEleves.length === 0 ? (
                <div className="text-center py-16 bg-blue-900/50 rounded-xl shadow-2xl border border-blue-700 backdrop-blur-sm">
                  <div className="w-24 h-24 mx-auto mb-6 bg-blue-800/50 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {searchTerm ? 'Aucun élève trouvé' : 'Aucun élève dans cette classe'}
                  </h3>
                  <p className="text-blue-300 mb-6">
                    {searchTerm 
                      ? 'Essayez de modifier votre recherche.' 
                      : 'Ajoutez votre premier élève pour commencer.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => handleAddEleve(selectedClasse.id)}
                      className="px-6 py-3 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-md"
                    >
                      Ajouter un élève
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEleves.map(eleve => (
                    <div
                      key={eleve.id}
                      className="bg-gradient-to-br from-blue-900/60 to-cyan-900/60 border border-blue-700 rounded-xl shadow-xl backdrop-blur-sm p-4 hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-800/50 rounded-full flex items-center justify-center shadow-lg">
                            <Users className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{eleve.prenom} {eleve.nom}</h3>
                            <div className="flex items-center space-x-2 text-blue-300">
                              <Hash className="w-4 h-4" />
                              <code className="bg-blue-800/50 px-2 py-1 rounded text-sm font-mono">
                                {eleve.code_unique}
                              </code>
                              <button
                                onClick={() => handleCopyCode(eleve.code_unique)}
                                className="p-1 hover:bg-blue-700/50 rounded transition-colors"
                                title="Copier le code"
                              >
                                {copiedCode === eleve.code_unique ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-blue-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteEleve(eleve.id, `${eleve.prenom} ${eleve.nom}`)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default MesGroupes;