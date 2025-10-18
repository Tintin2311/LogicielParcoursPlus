import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, Snowflake, MapPin, ArrowLeft, Save, Info, Search, Filter } from 'lucide-react';
import { supabase } from './supabaseClient'; // Chemin à adapter

// --- Fonctions d'interaction avec Supabase ---

/**
 * Insère une nouvelle balise dans Supabase.
 * @param {object} balise - L'objet balise à insérer.
 * @returns {Promise<object|null>} L'objet balise inséré avec son ID Supabase ou null en cas d'erreur.
 */
const insertBaliseInSupabase = async (balise) => {
  try {
    // 1. On récupère les balises existantes (et leurs numéros)
    const { data: existing, error: fetchError } = await supabase
      .from('balises')
      .select('numero_balise');

    if (fetchError) throw fetchError;

    const usedNumbers = new Set(existing.map(b => b.numero_balise));
    
    // 2. Trouver le plus petit numéro disponible
    let numero = 1;
    while (usedNumbers.has(numero)) {
      numero++;
    }

    // 3. Insertion avec le numéro libre
    const { data, error } = await supabase
      .from('balises')
      .insert({
        code: balise.code,
        points: parseFloat(balise.points) || 0,
        frozen: balise.frozen || false,
        numero_balise: parseInt(balise.numero_balise, 10),
      })
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Balise ajoutée dans Supabase :", data);
    return data;
  } catch (err) {
    console.error("❌ Erreur à l'insertion Supabase :", err);
    alert("Erreur ! Ce numéro de balise existe déjà. Veuillez en choisir un nouveau.");
    return null;
  }
};


/**
 * Récupère toutes les balises depuis Supabase.
 * @returns {Promise<Array<object>>} La liste des balises.
 */
const fetchBalisesFromSupabase = async () => {
  const { data, error } = await supabase.from("balises").select("*");

  if (error) {
    console.error("❌ Erreur lors du chargement des balises depuis Supabase :", error);
    return [];
  }

  return data.map((b) => ({
    id: b.id,
    code: b.code || '',
    points: b.points || 0,
    frozen: b.frozen || false,
        numero_balise: b.numero_balise?.toString() || '',
    editing: false, // L'état d'édition est géré côté client
  }));
};

/**
 * Met à jour une balise existante dans Supabase.
 * @param {object} balise - L'objet balise avec les données à mettre à jour (doit contenir l'ID).
 * @returns {Promise<void>}
 */
const updateBaliseInSupabase = async (balise) => {
  const { error } = await supabase
    .from('balises')
    .update({
      code: balise.code,
      points: parseFloat(balise.points) || 0,
      frozen: balise.frozen,
    })
    .eq('id', balise.id); // Utiliser l'ID pour la mise à jour

  if (error) {
    console.error("❌ Erreur de mise à jour Supabase :", error);
    throw error; // Propager l'erreur pour la gestion côté UI
  }
  console.log("✏️ Balise mise à jour dans Supabase.");
};

/**
 * Supprime une balise de Supabase.
 * @param {string} id - L'ID de la balise à supprimer.
 * @returns {Promise<void>}
 */
const deleteBaliseInSupabase = async (id) => {
  const { error } = await supabase
    .from('balises')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("❌ Erreur de suppression Supabase :", error);
    throw error; // Propager l'erreur
  }
  console.log("🗑️ Balise supprimée dans Supabase");
};

// --- Composant Principal GestionBalises ---

const GestionBalises = ({ setPage }) => {
  const [balises, setBalises] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // États pour la recherche et le filtrage avancés
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('code'); // 'code' ou 'number'
  const [filterFrozenChecked, setFilterFrozenChecked] = useState(false);
  const [filterInactiveChecked, setFilterInactiveChecked] = useState(false);
  const [rangeFilterType, setRangeFilterType] = useState('none'); // 'none', 'range', 'list'
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [listFilter, setListFilter] = useState('');

  // 🔄 Chargement initial des balises depuis Supabase et sauvegarde locale
  useEffect(() => {
    const loadBalises = async () => {
      try {
        const supabaseBalises = await fetchBalisesFromSupabase();
        setBalises(supabaseBalises);
        localStorage.setItem('balises', JSON.stringify(supabaseBalises));
      } catch (e) {
        console.error("Erreur lors du chargement des balises :", e);
        // Tenter de charger depuis localStorage en cas d'échec Supabase
        try {
          const storedBalises = localStorage.getItem('balises');
          if (storedBalises) {
            setBalises(JSON.parse(storedBalises));
          }
        } catch (localError) {
          console.error("Erreur lors du chargement des balises depuis localStorage:", localError);
        }
      } finally {
        setIsLoaded(true);
      }
    };

    loadBalises();
  }, []); // Exécuté une seule fois au montage du composant

  // 💾 Synchronisation des balises avec localStorage à chaque modification
  useEffect(() => {
    if (isLoaded) { // S'assure que les données initiales sont chargées
      try {
        localStorage.setItem('balises', JSON.stringify(balises));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des balises dans localStorage:", error);
      }
    }
  }, [balises, isLoaded]);

  /**
   * Ajoute une nouvelle balise vide en mode édition.
   */
  const getNextNumeroBaliseDisponible = (balises: any[]) => {
  const usedNumbers = new Set(
    balises
      .filter(b => b.numero_balise !== undefined && b.numero_balise !== '')
      .map(b => parseInt(b.numero_balise, 10))
      .filter(n => !isNaN(n))
  );
  let numero = 1;
  while (usedNumbers.has(numero)) {
    numero++;
  }
  return numero;
};

  const handleAddBalise = useCallback(() => {
  if (balises.some(balise => balise.editing)) {
    alert("Veuillez valider la balise en cours de modification avant d'en créer une nouvelle.");
    return;
  }

  const numeroPropose = getNextNumeroBaliseDisponible(balises);

  const nouvelleBalise = {
    id: `new-${Date.now()}-${Math.random()}`,
    code: '',
    points: 0,
    frozen: false,
    numero_balise: numeroPropose.toString(), // valeur par défaut visible et modifiable
    editing: true,
  };

  setBalises(prevBalises => [...prevBalises, nouvelleBalise]);
}, [balises]);


  /**
   * Gère les changements de valeur des champs d'une balise en édition.
   * @param {string} id - L'ID de la balise à modifier.
   * @param {string} field - Le champ de la balise à mettre à jour ('code' ou 'points').
   * @param {string} value - La nouvelle valeur.
   */
  const handleChangeBalise = useCallback((id, field, value) => {
    setBalises(prevBalises =>
      prevBalises.map(balise =>
        balise.id === id
          ? {
              ...balise,
             [field]: field === 'points'
  ? (value.replace(/,/g, '.') === '.' || value === '' ? value : isNaN(parseFloat(value)) ? '' : value)
  : field === 'numero_balise'
    ? value.replace(/\D/g, '') // ← pour forcer un numéro
    : value.toUpperCase().trim()

            }
          : balise
      )
    );
  }, []);

  /**
   * Formate les points pour l'affichage.
   * @param {number|string} pointsValue - La valeur des points.
   * @returns {string} La valeur formatée.
   */
  const displayPoints = useCallback((pointsValue) => {
    if (typeof pointsValue === 'string' && (pointsValue === '' || pointsValue === '.')) {
      return pointsValue;
    }
    const numValue = parseFloat(String(pointsValue).replace(/,/g, '.'));
    return isNaN(numValue) ? '' : numValue.toLocaleString('fr-FR', {
        minimumFractionDigits: numValue % 1 !== 0 ? 1 : 0,
        maximumFractionDigits: 2
    });
  }, []);

  /**
   * Active/désactive le mode édition pour une balise et gère la persistance.
   * @param {string} id - L'ID de la balise à basculer.
   */
  const toggleEditMode = useCallback(async (id) => {
    const baliseToEdit = balises.find(b => b.id === id);
    if (!baliseToEdit) return;

    if (baliseToEdit.editing) {
      // Mode validation
      if (baliseToEdit.code.trim() === '') {
        alert("Le code de la balise est obligatoire pour valider.");
        return;
      }

      const updatedBalise = {
        ...baliseToEdit,
        points: parseFloat(String(baliseToEdit.points).replace(/,/g, '.')) || 0,
        editing: false,
      };

      try {
        if (updatedBalise.id.startsWith('new-')) {
          // INSERT Supabase pour une nouvelle balise
          const data = await insertBaliseInSupabase(updatedBalise);
          if (data) {
            setBalises(prevBalises =>
              prevBalises.map(b => (b.id === baliseToEdit.id ? { ...updatedBalise, id: data.id } : b))
            );
          } else {
            // Si l'insertion échoue, maintenir en mode édition ou supprimer
            setBalises(prevBalises => prevBalises.map(b => (b.id === baliseToEdit.id ? { ...updatedBalise, editing: true } : b)));
          }
        } else {
          // UPDATE Supabase pour une balise existante
          await updateBaliseInSupabase(updatedBalise);
          setBalises(prevBalises =>
            prevBalises.map(b => (b.id === baliseToEdit.id ? updatedBalise : b))
          );
        }
      } catch (error) {
        alert(`Une erreur est survenue lors de la persistance de la balise : ${error.message}`);
        setBalises(prevBalises => prevBalises.map(b => (b.id === baliseToEdit.id ? { ...updatedBalise, editing: true } : b))); // Revert to editing mode on error
      }
    } else {
      // Mode édition
      if (balises.some(b => b.editing && b.id !== baliseToEdit.id)) {
        alert("Veuillez valider la balise en cours de modification avant d'en éditer une autre.");
        return;
      }
      setBalises(prevBalises =>
        prevBalises.map(b => (b.id === id ? { ...b, editing: true } : b))
      );
    }
  }, [balises]);

  /**
   * Gèle ou dégèle une balise.
   * @param {string} id - L'ID de la balise à modifier.
   */
  const toggleFreezeBalise = useCallback(async (id) => {
    const baliseToFreeze = balises.find(b => b.id === id);
    if (!baliseToFreeze) return;

    if (balises.some(b => b.editing && b.id !== baliseToFreeze.id)) {
      alert("Veuillez valider la balise en cours de modification avant de geler/dégeler.");
      return;
    }

    const updatedBalise = { ...baliseToFreeze, frozen: !baliseToFreeze.frozen };

    try {
      if (!updatedBalise.id.startsWith('new-')) { // Seulement si elle est déjà dans Supabase
        await updateBaliseInSupabase(updatedBalise);
      }
      setBalises(prevBalises =>
        prevBalises.map(b => (b.id === id ? updatedBalise : b))
      );
    } catch (error) {
      alert(`Erreur lors de la mise à jour du statut de gel : ${error.message}`);
    }
  }, [balises]);

  /**
   * Supprime une balise.
   * @param {string} idToDelete - L'ID de la balise à supprimer.
   */
  const handleDeleteBalise = useCallback(async (idToDelete) => {
    const baliseToDelete = balises.find(b => b.id === idToDelete);
    if (!baliseToDelete) return;

    if (balises.some(b => b.editing && b.id !== baliseToDelete.id)) {
      alert("Veuillez valider la balise en cours de modification avant de supprimer.");
      return;
    }

    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer la balise "${baliseToDelete.code || 'sans code'}" ?`);
    if (!confirmDelete) return;

    // Pour simplifier et éviter la complexité de la réindexation côté DB sur chaque suppression
    // La numérotation sera purement côté client dans cette version.

    try {
      if (!baliseToDelete.id.startsWith('new-')) { // Seulement si elle est déjà dans Supabase
        await deleteBaliseInSupabase(idToDelete);
      }
      setBalises(prevBalises => prevBalises.filter(b => b.id !== idToDelete));
    } catch (error) {
      alert(`Impossible de supprimer cette balise : ${error.message}`);
    }
  }, [balises]);

  // --- LOGIQUE DE FILTRAGE AVANCÉE ---
  const filteredBalises = [...balises]
  .sort((a, b) => parseInt(a.numero_balise, 10) - parseInt(b.numero_balise, 10)) // ✅ tri par numéro
  .filter((balise, index) => {
    const baliseNumber = index + 1; // Le numéro affiché (position dans la liste triée)
    const searchLower = searchTerm.toLowerCase();
    let matchesSearch = true;

    if (searchTerm) {
      if (searchType === 'code') {
        matchesSearch = balise.code.toLowerCase().includes(searchLower);
      } else {
        matchesSearch = String(baliseNumber).includes(searchLower);
      }
    }

    let matchesStateFilter = true;
    if (filterFrozenChecked && !balise.frozen) {
      matchesStateFilter = false;
    }

    const isActive = balise.code && balise.code.trim() !== '';
    if (filterInactiveChecked && isActive) {
      matchesStateFilter = false;
    }

    let matchesRangeFilter = true;
    if (rangeFilterType === 'range' && (rangeStart || rangeEnd)) {
      const startNum = parseInt(rangeStart, 10);
      const endNum = parseInt(rangeEnd, 10);
      matchesRangeFilter = (isNaN(startNum) || baliseNumber >= startNum) &&
                           (isNaN(endNum) || baliseNumber <= endNum);
    } else if (rangeFilterType === 'list' && listFilter) {
      const parts = listFilter.split(';').map(p => p.trim()).filter(p => p !== '');
      matchesRangeFilter = parts.some(part => {
        const num = Number(part);
        return !isNaN(num) && baliseNumber === num;
      });
    }

    return matchesSearch && matchesStateFilter && matchesRangeFilter;
  });

  const validatedBalises = balises.filter(b => b.code && b.code.trim() !== '' && !b.editing);
  const totalValidBalises = validatedBalises.length;
  // "Non associées" est interprété comme "non gelées" basé sur l'utilisation précédente
  const balisesNonAssociees = validatedBalises.filter(b => !b.frozen).length;
  const frozenBalisesCount = validatedBalises.filter(b => b.frozen).length;

  const showNoBaliseMessage = balises.length === 0 && !balises.some(b => b.editing);
  const isAnyBaliseBeingEdited = balises.some(balise => balise.editing);

  return (
<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
     <div className="absolute inset-0 overflow-hidden">
  <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
  <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: "4s" }}></div>
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
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 mb-2 drop-shadow-lg">
            Gestion des balises
          </h1>
          <p className="text-lg text-white/80 font-light max-w-2xl mx-auto">
            Créez, configurez et organisez vos balises pour vos parcours.
          </p>
        </div>

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

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {/* Balises Management Section */}
          <div className="group relative bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 hover:border-green-400/50 shadow-2xl mb-8 overflow-hidden transform transition-all duration-500 ease-out hover:scale-[1.005]">
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Mes Balises
                    </h3>
                    <p className="text-white/70 text-sm">
                    </p>
                  </div>
                </div>
              </div>

              {/* Barre de recherche et filtres avancés */}
              {balises.length > 0 && (
                <div className="mb-6 bg-black/10 p-5 rounded-xl border border-white/10">
                  <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Filter className="w-6 h-6 mr-2 text-green-300" /> Options de Filtrage
                  </h4>

                  {/* Recherche par code ou numéro */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                    <div className="relative flex-1 w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={`Rechercher par ${searchType === 'code' ? 'code' : 'numéro'}...`}
                        className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none placeholder-white/40 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none appearance-none cursor-pointer shadow-sm"
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                      >
                        <option value="code" className="bg-gray-800 text-white">Code de balise</option>
                        <option value="number" className="bg-gray-800 text-white">Numéro de balise</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Filtres par état (gelées/inactives) */}
                  <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
                    <label className="flex items-center text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-green-500 bg-white/20 border-white/30 rounded focus:ring-green-400 mr-2"
                        checked={filterFrozenChecked}
                        onChange={(e) => setFilterFrozenChecked(e.target.checked)}
                      />
                      Balises gelées
                    </label>
                    <label className="flex items-center text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-green-500 bg-white/20 border-white/30 rounded focus:ring-green-400 mr-2"
                        checked={filterInactiveChecked}
                        onChange={(e) => setFilterInactiveChecked(e.target.checked)}
                      />
                      Balises inactives
                    </label>
                  </div>

                  {/* Filtre par plage de numéros ou liste */}
                  <div>
                    <label className="block text-white/80 mb-2">Filtrer par numéro de balise:</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative">
                        <select
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none appearance-none cursor-pointer shadow-sm"
                          value={rangeFilterType}
                          onChange={(e) => {
                            setRangeFilterType(e.target.value);
                            setRangeStart('');
                            setRangeEnd('');
                            setListFilter('');
                          }}
                        >
                          <option value="none" className="bg-gray-800 text-white">Aucun filtre</option>
                          <option value="range" className="bg-gray-800 text-white">Plage (Ex: 10 à 25)</option>
                          <option value="list" className="bg-gray-800 text-white">Liste (Ex: 1; 5; 7)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                      </div>
                      </div>

                      {rangeFilterType === 'range' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            placeholder="De (numéro)"
                            className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none placeholder-white/40 shadow-sm"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="À (numéro)"
                            className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none placeholder-white/40 shadow-sm"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                          />
                        </div>
                      )}

                      {rangeFilterType === 'list' && (
                        <input
                          type="text"
                          placeholder="Ex: 1; 5; 7"
                          className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none placeholder-white/40 shadow-sm w-full sm:w-auto"
                          value={listFilter}
                          onChange={(e) => setListFilter(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Message si aucune balise validée OU si aucune balise du tout et pas en édition */}
              {showNoBaliseMessage && (
                <div className="text-center py-12 bg-black/10 rounded-2xl border border-white/10">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-400/30">
                    <MapPin className="w-12 h-12 text-green-400 opacity-80" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Aucune balise enregistrée pour le moment.
                  </h3>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    Utilisez le bouton "Créer une balise" ci-dessus pour ajouter votre première balise.
                  </p>
                </div>
              )}

              {/* Message si aucune balise ne correspond aux filtres */}
              {filteredBalises.length === 0 && balises.length > 0 && (
                <div className="text-center py-12 bg-black/10 rounded-2xl border border-white/10">
                  <Info className="w-12 h-12 text-blue-400 opacity-80 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Aucune balise ne correspond à votre recherche ou à vos filtres.
                  </h3>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    Essayez de modifier vos critères de recherche ou de filtre.
                  </p>
                </div>
              )}

              {/* Liste des balises (utilise filteredBalises) */}
              {filteredBalises.length > 0 && (
                <div className="space-y-4">
                  {filteredBalises.map((balise, index) => {
                    const baliseClasses = `relative bg-black/20 backdrop-blur-sm rounded-xl p-5 border transition-all duration-300 shadow-md ${
                      balise.frozen ? 'border-orange-400/50' : 'border-white/10'
                    } ${balise.editing ? 'ring-2 ring-yellow-400/50' : 'hover:bg-black/30'}`;

                    // Le numéro de balise affiché est basé sur l'index après filtrage
                    const getNextNumeroBaliseDisponible = (balises: any[]) => {
  const usedNumbers = new Set(
    balises
      .filter(b => b.numero_balise !== undefined && b.numero_balise !== '')
      .map(b => parseInt(b.numero_balise, 10))
      .filter(n => !isNaN(n))
  );
  let numero = 1;
  while (usedNumbers.has(numero)) {
    numero++;
  }
  return numero;
};

const displayedBaliseNumber = balise.numero_balise || '?';

                    return (
                      <div
                        key={balise.id}
                        className={baliseClasses}
                      >
                        {balise.frozen && (
                          <div className="absolute inset-0 bg-blue-900/10 rounded-xl flex items-center justify-center">
                            <Snowflake className="w-16 h-16 text-blue-300 opacity-30 animate-pulse" />
                          </div>
                        )}
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
                         <div className="flex-shrink-0 text-white font-extrabold text-xl w-14 text-center">
  {balise.editing ? (
    <input
      type="number"
      value={balise.numero_balise}
      onChange={(e) => handleChangeBalise(balise.id, 'numero_balise', e.target.value)}
      placeholder="N°"
      className="w-full px-1 py-1 bg-white/10 text-white font-bold text-center rounded-md border border-white/20 focus:outline-none focus:border-green-400 text-lg placeholder-white/30"
    />
  ) : (
    balise.numero_balise || <span className="text-white/40">—</span>
  )}
</div>

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <div className="flex flex-col">
                              <label htmlFor={`code-${balise.id}`} className="text-white/60 text-sm mb-1 font-medium">Code de la balise</label>
                              {balise.editing ? (
                                <input
                                  id={`code-${balise.id}`}
                                  type="text"
                                  placeholder="Ex: A1, B2 (obligatoire)"
                                  value={balise.code}
                                  onChange={(e) => handleChangeBalise(balise.id, 'code', e.target.value)}
                                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white font-mono text-lg border border-white/20 focus:border-green-400 focus:outline-none transition-all duration-300 uppercase placeholder-white/40 shadow-sm"
                                />
                              ) : (
                                <p className="text-white font-mono text-xl font-bold">{balise.code || <span className="text-white/40">Non défini</span>}</p>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <label htmlFor={`points-${balise.id}`} className="text-white/60 text-sm mb-1 font-medium">Points attribués</label>
                              {balise.editing ? (
                                <input
                                  id={`points-${balise.id}`}
                                  type="text"
                                  placeholder="Ex: 10, 5.5"
                                  value={displayPoints(balise.points)}
                                  onChange={(e) => handleChangeBalise(balise.id, 'points', e.target.value)}
                                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white font-mono text-lg border border-white/20 focus:border-green-400 focus:outline-none transition-all duration-300 placeholder-white/40 shadow-sm"
                                />
                              ) : (
                                <p className="text-white font-mono text-xl font-bold">{displayPoints(balise.points)} <span className="text-white/60 font-normal">pts</span></p>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex flex-row md:flex-col gap-2 mt-4 md:mt-0">
                            {/* Bouton Geler/Dégeler */}
                            <button
                              onClick={() => toggleFreezeBalise(balise.id)}
                              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 hover:scale-110 shadow-md ${
                                balise.frozen
                                  ? 'bg-orange-500/30 text-orange-200 border border-orange-500/40 hover:bg-orange-500/40'
                                  : 'bg-blue-500/30 text-blue-200 border border-blue-500/40 hover:bg-blue-500/40'
                              } ${isAnyBaliseBeingEdited && !balise.editing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={balise.frozen ? 'Dégeler la balise' : 'Geler la balise (désactive les modifications)'}
                              disabled={isAnyBaliseBeingEdited && !balise.editing}
                            >
                              <Snowflake className="w-5 h-5" />
                            </button>
                            {/* Bouton Modifier/Valider */}
                            <button
                              onClick={() => toggleEditMode(balise.id)}
                              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 hover:scale-110 shadow-md ${
                                balise.editing
                                  ? 'bg-green-500/30 text-green-200 border border-green-500/40 hover:bg-green-500/40'
                                  : 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/40 hover:bg-yellow-500/40'
                              } ${
                                (isAnyBaliseBeingEdited && !balise.editing) || balise.frozen
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                              }`}
                              title={balise.editing ? 'Valider les modifications' : 'Modifier la balise'}
                              disabled={(isAnyBaliseBeingEdited && !balise.editing) || balise.frozen}
                            >
                              {balise.editing ? (
                                <Save className="w-5 h-5" />
                              ) : (
                                <Edit className="w-5 h-5" />
                              )}
                            </button>
                            {/* Bouton Supprimer */}
                            <button
                              onClick={() => handleDeleteBalise(balise.id)}
                              className={`flex items-center justify-center w-12 h-12 bg-red-500/30 rounded-lg text-red-200 hover:bg-red-500/40 transition-all duration-300 hover:scale-110 shadow-md border border-red-500/40 ${
                                isAnyBaliseBeingEdited || balise.frozen ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Supprimer la balise"
                              disabled={isAnyBaliseBeingEdited || balise.frozen}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section de Résumé des Statistiques */}
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-700/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Info className="w-7 h-7 mr-3 text-blue-300" /> Statistiques des Balises
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-xl border border-white/10 text-center shadow-md">
                  <MapPin className="w-8 h-8 mb-3 text-green-300 drop-shadow" />
                  <p className="text-white/70 text-sm mb-1">Total balises</p>
                  <p className="text-3xl font-extrabold text-green-300">{totalValidBalises}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-xl border border-white/10 text-center shadow-md group relative">
                  <Info className="w-8 h-8 mb-3 text-red-300 drop-shadow" />
                  <p className="text-white/70 text-sm mb-1">Balises inactives</p>
                  <p className="text-3xl font-extrabold text-red-300">{balisesNonAssociees}</p>
                  <div className="absolute top-full mt-4 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-max max-w-[200px] text-center">
                      Ces balises ne sont dans aucun parcours
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-xl border border-white/10 text-center shadow-md group relative">
                  <Snowflake className="w-8 h-8 mb-3 text-blue-300 drop-shadow" />
                  <p className="text-white/70 text-sm mb-1">Balises Gelées</p>
                  <p className="text-3xl font-extrabold text-blue-300">{frozenBalisesCount}</p>
                  <div className="absolute top-full mt-4 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-max max-w-[200px] text-center">
                      Les balises gelées disparaissent temporairement du parcours des élèves
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton "Créer une Balise" flottant en bas */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50">
        <button
          onClick={handleAddBalise}
          className={`flex items-center px-8 py-4 text-white rounded-full transition-all duration-300 shadow-xl font-bold text-lg ${
              isAnyBaliseBeingEdited
                ? 'bg-gray-500/60 cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105'
            }`}
          disabled={isAnyBaliseBeingEdited}
          title={isAnyBaliseBeingEdited ? "Veuillez valider la balise en cours avant d'en créer une nouvelle." : "Créer une nouvelle balise"}
        >
          <Plus className="w-6 h-6 mr-3" />
          Créer une Balise
        </button>
      </div>
    </div>
  );
};

export default GestionBalises;