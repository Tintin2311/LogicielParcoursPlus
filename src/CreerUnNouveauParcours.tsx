// src/CreerUnNouveauParcours.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Save, MapPin, ListOrdered, Tag, Text, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import FolderPickerModal from './FolderPickerModal';

// --- Fonctions d'interaction avec Supabase ---

const fetchAllBalises = async () => {
  const { data, error } = await supabase
    .from('balises')
    .select('id, numero_balise, code');

  if (error) {
    console.error("❌ Erreur lors du chargement des balises pour la création/modification de parcours :", error);
    return [];
  }
  return data
    .filter(b => b.id && b.numero_balise !== null && b.code && b.code.trim() !== '')
    .sort((a, b) => parseInt(a.numero_balise, 10) - parseInt(b.numero_balise, 10));
};

const fetchAllFolders = async () => {
  const { data, error } = await supabase
    .from('parcours_folders')
    .select('id, name, parent_folder_id')
    .order('name', { ascending: true });

  if (error) {
    console.error("❌ Erreur lors du chargement des dossiers :", error);
    return [];
  }
  return data;
};

const insertParcoursInSupabase = async (parcoursData) => {
  try {
    const { data, error } = await supabase
      .from('parcours')
      .insert(parcoursData)
      .select()
      .single();

    if (error) throw error;
    console.log("✅ Parcours ajouté dans Supabase :", data);
    return data;
  } catch (err) {
    console.error("❌ Erreur à l'insertion du parcours dans Supabase :", err);
    alert(`Échec de la création du parcours : ${err.message || err.details || "Erreur inconnue"}`);
    return null;
  }
};

const updateParcoursInSupabase = async (parcoursId, parcoursData) => {
    try {
        const { data, error } = await supabase
            .from('parcours')
            .update(parcoursData)
            .eq('id', parcoursId)
            .select()
            .single();

        if (error) throw error;
        console.log("✅ Parcours mis à jour dans Supabase :", data);
        return data;
    } catch (err) {
        console.error("❌ Erreur à la mise à jour du parcours dans Supabase :", err);
        alert(`Échec de la mise à jour du parcours : ${err.message || err.details || "Erreur inconnue"}`);
        return null;
    }
};

const fetchParcoursById = async (parcoursId) => {
    const { data, error } = await supabase
        .from('parcours')
        .select('id, nom, description, balises_ordre, folder_id')
        .eq('id', parcoursId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("❌ Erreur lors du chargement du parcours par ID :", error);
        return null;
    }
    return data;
};

// --- Composant Principal ---

const CreerUnNouveauParcours = ({ setPage, parcoursId }) => {
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [availableBalises, setAvailableBalises] = useState([]);
  const [selectedBalises, setSelectedBalises] = useState([{ id: null, numero_balise: '', code: '' }]);
  const [allFolders, setAllFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  const isEditMode = !!parcoursId;

  useEffect(() => {
    const loadData = async () => {
      setLoadingInitialData(true);

      const balises = await fetchAllBalises();
      setAvailableBalises(balises);

      const folders = await fetchAllFolders();
      setAllFolders(folders);

      if (isEditMode) {
        const parcours = await fetchParcoursById(parcoursId);
        if (parcours) {
          setCourseName(parcours.nom || '');
          setCourseDescription(parcours.description || '');
          setSelectedFolderId(parcours.folder_id || null);

          if (parcours.balises_ordre && Array.isArray(parcours.balises_ordre)) {
            const loadedBalises = parcours.balises_ordre.map(baliseId => {
              const matchingBalise = balises.find(b => b.id === baliseId);
              return {
                id: matchingBalise ? matchingBalise.id : baliseId,
                numero_balise: matchingBalise ? matchingBalise.numero_balise : 'Inconnu',
                code: matchingBalise ? matchingBalise.code : 'N/A'
              };
            });
            setSelectedBalises(loadedBalises.length > 0 ? loadedBalises : [{ id: null, numero_balise: '', code: '' }]);
          } else {
            setSelectedBalises([{ id: null, numero_balise: '', code: '' }]);
          }
        } else {
            alert("Parcours introuvable pour la modification.");
            setPage('gestionParcours');
        }
      } else {
          setCourseName('');
          setCourseDescription('');
          setSelectedBalises([{ id: null, numero_balise: '', code: '' }]);
          setSelectedFolderId(null);
      }
      setLoadingInitialData(false);
    };
    loadData();
  }, [parcoursId, isEditMode, setPage]);

  const handleAddBaliseInput = useCallback(() => {
    setSelectedBalises(prev => [...prev, { id: null, numero_balise: '', code: '' }]);
  }, []);

  const handleRemoveBaliseInput = useCallback((index) => {
    setSelectedBalises(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSelectBalise = useCallback((index, baliseId) => {
    const chosenBalise = availableBalises.find(b => b.id === baliseId);
    setSelectedBalises(prev =>
      prev.map((item, i) =>
        i === index
          ? {
              id: chosenBalise ? chosenBalise.id : null,
              numero_balise: chosenBalise ? chosenBalise.numero_balise : '',
              code: chosenBalise ? chosenBalise.code : ''
            }
          : { ...item }
      )
    );
  }, [availableBalises]);

  const handleSaveParcours = async () => {
    if (!courseName.trim()) {
      alert("Le nom du parcours est obligatoire.");
      return;
    }

    if (selectedBalises.length === 0 || selectedBalises.some(b => !b.id)) {
      alert("Veuillez sélectionner au moins une balise valide pour le parcours et assurez-vous que toutes les balises sont choisies.");
      return;
    }

    const baliseIdsForCourse = selectedBalises.map(b => b.id);

    const parcoursData = {
      nom: courseName.trim(),
      description: courseDescription.trim(),
      balises_ordre: baliseIdsForCourse,
      folder_id: selectedFolderId,
    };

    let result = null;
    if (isEditMode) {
      result = await updateParcoursInSupabase(parcoursId, parcoursData);
    } else {
      result = await insertParcoursInSupabase(parcoursData);
    }

    if (result) {
      alert(`Parcours ${isEditMode ? 'mis à jour' : 'créé'} avec succès !`);
      
      // Réinitialiser les états UNIQUEMENT en mode création
      if (!isEditMode) {
        setCourseName('');
        setCourseDescription('');
        setSelectedBalises([{ id: null, numero_balise: '', code: '' }]);
        setSelectedFolderId(null);
      } else {
        // En mode modification, on ne réinitialise pas le formulaire,
        // on peut simplement forcer un re-render si besoin en utilisant
        // une clé ou en mettant à jour l'état, mais ici ce n'est pas nécessaire
        // car le formulaire est déjà à jour.
      }
      
      window.scrollTo(0, 0);
    }
  };

  const getSelectedFolderName = useCallback(() => {
    if (!selectedFolderId) return "Accueil";
    const folder = allFolders.find(f => f.id === selectedFolderId);
    return folder ? folder.name : "Dossier Inconnu";
  }, [selectedFolderId, allFolders]);

  const selectedBaliseIds = selectedBalises.map(b => b.id);

  if (loadingInitialData) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white text-xl">
              <Loader2 className="w-8 h-8 animate-spin mr-3 text-blue-300" /> Chargement des données du parcours...
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden text-white p-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: "4s" }}></div>
      </div>

      {/* Geometric Patterns */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rotate-45 rounded-lg"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 border-2 border-white rotate-12 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-white rotate-45"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2 drop-shadow-lg">
            {isEditMode ? 'Modifier le Parcours' : 'Créer un Nouveau Parcours'}
          </h1>
          <p className="text-lg text-white/80 font-light max-w-2xl mx-auto">
            {isEditMode ? 'Ajustez les détails et les balises de votre parcours existant.' : 'Concevez votre parcours d\'orientation en sélectionnant vos balises.'}
          </p>
        </div>

        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <button
            onClick={() => setPage("gestionParcours")}
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à Mes Parcours
          </button>
        </div>

        {/* Course Details Section */}
        <div className="max-w-3xl mx-auto bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 shadow-2xl mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Tag className="w-6 h-6 mr-3 text-blue-300" /> Détails du Parcours
          </h3>
          <div className="mb-4">
            <label htmlFor="courseName" className="block text-white/70 text-sm font-medium mb-2 flex items-center">
              <Text className="w-4 h-4 mr-2 text-blue-300" /> Nom du parcours <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              type="text"
              id="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Ex: Parcours découverte, Le défi de la forêt"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-blue-400 focus:outline-none placeholder-white/40 shadow-sm"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="courseDescription" className="block text-white/70 text-sm font-medium mb-2 flex items-center">
              <Text className="w-4 h-4 mr-2 text-blue-300" /> Description
            </label>
            <textarea
              id="courseDescription"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Une brève description de votre parcours..."
              rows="3"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-blue-400 focus:outline-none placeholder-white/40 shadow-sm"
            ></textarea>
          </div>
          {/* Nouveau champ pour le dossier de réception (bouton pour ouvrir la modale) */}
          <div className="mb-6">
            <label className="block text-white/70 text-sm font-medium mb-2 flex items-center">
              <FolderOpen className="w-4 h-4 mr-2 text-blue-300" /> Dossier de réception (Optionnel)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={getSelectedFolderName()}
                readOnly
                className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 cursor-pointer shadow-sm focus:outline-none"
                onClick={() => setIsFolderPickerOpen(true)}
                placeholder="Cliquez pour choisir un dossier"
              />
              <button
                onClick={() => setIsFolderPickerOpen(true)}
                className="px-4 py-2 bg-purple-600/70 text-white rounded-lg hover:bg-purple-700/80 transition-colors shadow-md flex items-center"
              >
                <FolderOpen className="w-4 h-4 mr-2" /> Choisir
              </button>
            </div>
          </div>
        </div>

        {/* Balise Selection Section */}
        <div className="max-w-3xl mx-auto bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-pink-400/30 shadow-2xl mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <ListOrdered className="w-6 h-6 mr-3 text-pink-300" /> Choix des balises
          </h3>

          {selectedBalises.map((selected, index) => (
            <div key={index} className="flex items-center gap-6 mb-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl">

              {/* Numéro de position avec design amélioré */}
              <div className="flex-shrink-0 relative">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
                  <div className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <span className="text-white font-bold text-base">{index + 1}</span>
                  </div>
                </div>
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-white/30 rounded-full blur-sm"></div>
              </div>

              {/* Section des champs avec labels améliorés */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Sélecteur de balise */}
                <div className="space-y-2">
                  <label htmlFor={`balise-select-${index}`} className="block text-white/90 text-sm font-semibold tracking-wide uppercase">
                    Numéro de la balise
                  </label>
                  <div className="relative group">
                    <select
                      id={`balise-select-${index}`}
                      value={selected.id || ''}
                      onChange={(e) => handleSelectBalise(index, e.target.value)}
                      className="w-full px-4 py-3 bg-white/15 backdrop-blur-sm rounded-xl text-white text-base border border-white/30 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/30 focus:outline-none appearance-none cursor-pointer shadow-md transition-all duration-300 group-hover:border-white/40"
                      required
                    >
                      <option value="" disabled className="bg-gray-800 text-white/70">Choisir une balise...</option>
                      {availableBalises.map(balise => (
                        <option
                          key={balise.id}
                          value={balise.id}
                          className="bg-gray-800 text-white py-2"
                          disabled={selectedBaliseIds.includes(balise.id) && selected.id !== balise.id}
                        >
                          Balise {balise.numero_balise}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/60 group-hover:text-white/80 transition-colors duration-300">
                      <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Champ code associé */}
                <div className="space-y-2">
                  <label className="block text-white/90 text-sm font-semibold tracking-wide uppercase">
                    Code associé
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selected.code || '—'}
                      readOnly
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-xl text-white/90 text-base border border-white/20 cursor-not-allowed shadow-md font-mono tracking-wider"
                      placeholder="Aucun code"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bouton de suppression amélioré */}
              {selectedBalises.length > 1 && (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleRemoveBaliseInput(index)}
                    className="p-3 bg-red-500/20 backdrop-blur-sm rounded-xl text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300 hover:border-red-400/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20"
                    aria-label="Supprimer cette balise du parcours"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}

            </div>
          ))}

          <button
            onClick={handleAddBaliseInput}
            className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-semibold text-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl mt-6"
          >
            <Plus className="w-5 h-5 mr-2" /> Ajouter une balise au parcours
          </button>
        </div>

        {/* Save Button */}
        <div className="text-center mt-12">
          <button
            onClick={handleSaveParcours}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl text-white font-bold text-xl uppercase tracking-wider hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-2xl hover:shadow-green-500/50 transform hover:scale-105"
          >
            <Save className="w-6 h-6 mr-3" />
            {isEditMode ? 'Enregistrer les modifications' : 'Enregistrer le Parcours'}
          </button>
        </div>
      </div>

      {/* Folder Picker Modal */}
      <FolderPickerModal
        isOpen={isFolderPickerOpen}
        onClose={() => setIsFolderPickerOpen(false)}
        onSelectFolder={setSelectedFolderId}
        initialSelectedFolderId={selectedFolderId}
        allFolders={allFolders}
      />
    </div>
  );
};

export default CreerUnNouveauParcours;