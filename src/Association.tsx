import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Users, BookOpen, Target, ArrowLeft, Check, X, Search, Filter, Info, Loader2, Copy, AlertTriangle } from 'lucide-react';

const Association = ({ professeur, setPage }) => {
  // États locaux pour les données
  const [parcoursData, setParcoursData] = useState([]);
  const [groupesData, setGroupesData] = useState([]);
  const [parcoursFoldersData, setParcoursFoldersData] = useState([]);

  // État pour gérer les dossiers dépliés
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // États pour le filtrage et l'UI
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingStatus, setSavingStatus] = useState({});

  // États pour les groupes source et de destination pour la copie
  const [selectedSourceGroup, setSelectedSourceGroup] = useState(null);
  const [selectedTargetGroup, setSelectedTargetGroup] = useState(null);
  const [isCopying, setIsCopying] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null); // 'success', 'error', 'warning'

  // Gère le dépliage et repliage d'un dossier
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return newExpanded;
    });
  };

  // Fonction utilitaire pour trouver tous les parcours imbriqués
  const getAllNestedParcours = useCallback((folderId) => {
    let nestedParcours = parcoursData.filter(p => p.folder_id === folderId);
    const subFolders = parcoursFoldersData.filter(f => f.parent_folder_id === folderId);
    subFolders.forEach(subFolder => {
      nestedParcours = [...nestedParcours, ...getAllNestedParcours(subFolder.id)];
    });
    return nestedParcours;
  }, [parcoursData, parcoursFoldersData]);

  // Récupère les éléments à afficher en tenant compte des dossiers dépliés
  const getRenderedItems = useCallback(() => {
    const items = [];
    const topLevelFolders = parcoursFoldersData.filter(f => !f.parent_folder_id);
    const parcoursNonClasses = parcoursData.filter(p => !p.folder_id);

    const buildHierarchy = (folderId, depth) => {
      const currentFolder = parcoursFoldersData.find(f => f.id === folderId);
      if (currentFolder) {
        items.push({ ...currentFolder, type: 'dossier', indentation: depth });
        
        if (expandedFolders.has(folderId)) {
          const directParcours = parcoursData.filter(p => p.folder_id === folderId);
          directParcours.forEach(p => {
            items.push({ ...p, type: 'parcours', indentation: depth + 1 });
          });
          const subFolders = parcoursFoldersData.filter(f => f.parent_folder_id === folderId);
          subFolders.forEach(subFolder => {
            buildHierarchy(subFolder.id, depth + 1);
          });
        }
      }
    };

    topLevelFolders.forEach(folder => buildHierarchy(folder.id, 0));
    parcoursNonClasses.forEach(p => items.push({ ...p, type: 'parcours', indentation: 0 }));
    return items;
  }, [parcoursData, parcoursFoldersData, expandedFolders]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: parcours, error: parcoursError } = await supabase
          .from('parcours')
          .select('*');
        if (parcoursError) throw parcoursError;
        setParcoursData(parcours.map(p => ({
          ...p,
          groupesAssocies: Array.isArray(p.groupes_associes) ? p.groupes_associes : []
        })));

        const { data: groupes, error: groupesError } = await supabase
          .from('groups')
          .select('*');
        if (groupesError) throw groupesError;
        setGroupesData(groupes.map(g => ({
          ...g,
          nom: g.name
        })));
        
        if (groupes.length > 0) {
          setSelectedSourceGroup(groupes[0].id);
          setSelectedTargetGroup(groupes.length > 1 ? groupes[1].id : groupes[0].id);
        }

        const { data: parcoursFolders, error: foldersError } = await supabase
          .from('parcours_folders')
          .select('*');
        if (foldersError) throw foldersError;
        setParcoursFoldersData(parcoursFolders.map(f => ({
          ...f,
          nom: f.name,
          groupesAssocies: Array.isArray(f.groupes_associes) ? f.groupes_associes : []
        })));

      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError(`Impossible de charger les données: ${err.message}. Veuillez vérifier les noms de tables ('parcours', 'groups', 'parcours_folders') et les règles de sécurité (RLS).`);
      } finally {
        setIsLoading(false);
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
      }
    };

    fetchData();
  }, []);

  const updateParcoursInSupabase = async (parcoursId, newGroupesAssocies) => {
    setSavingStatus(prev => ({ ...prev, [`parcours-${parcoursId}`]: 'saving' }));
    try {
      const { error: updateError } = await supabase
        .from('parcours')
        .update({ groupes_associes: newGroupesAssocies })
        .eq('id', parcoursId);

      if (updateError) throw updateError;
      setSavingStatus(prev => ({ ...prev, [`parcours-${parcoursId}`]: 'saved' }));
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [`parcours-${parcoursId}`]: null }));
      }, 200);
    } catch (err) {
      console.error(`Erreur lors de la sauvegarde du parcours ${parcoursId}:`, err.message);
      setSavingStatus(prev => ({ ...prev, [`parcours-${parcoursId}`]: 'error' }));
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [`parcours-${parcoursId}`]: null }));
      }, 300);
    }
  };
  
  const updateFolderInSupabase = async (folderId, newGroupesAssocies) => {
    setSavingStatus(prev => ({ ...prev, [`dossier-${folderId}`]: 'saving' }));
    try {
      const { error: updateError } = await supabase
        .from('parcours_folders')
        .update({ groupes_associes: newGroupesAssocies })
        .eq('id', folderId);
      
      if (updateError) throw updateError;
      setSavingStatus(prev => ({ ...prev, [`dossier-${folderId}`]: 'saved' }));
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [`dossier-${folderId}`]: null }));
      }, 200);
    } catch (err) {
      console.error(`Erreur lors de la sauvegarde du dossier ${folderId}:`, err.message);
      setSavingStatus(prev => ({ ...prev, [`dossier-${folderId}`]: 'error' }));
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [`dossier-${folderId}`]: null }));
      }, 300);
    }
  };

  const handleFolderGroupeAssociation = async (folder, groupe, isChecked) => {
    const allNestedParcours = getAllNestedParcours(folder.id);
    
    const updateNestedFolders = (currentFolderId, group, checked) => {
      const subFolders = parcoursFoldersData.filter(f => f.parent_folder_id === currentFolderId);
      let updatedFolders = subFolders.map(subFolder => {
        const newAssociations = checked 
          ? [...new Set([...(subFolder.groupesAssocies || []), group.id])]
          : (subFolder.groupesAssocies || []).filter(id => id !== group.id);
        
        updateFolderInSupabase(subFolder.id, newAssociations);
        return { ...subFolder, groupesAssocies: newAssociations };
      });
      
      subFolders.forEach(subFolder => {
        updatedFolders = [...updatedFolders, ...updateNestedFolders(subFolder.id, group, checked)];
      });
      return updatedFolders;
    };
    
    const updatedFoldersInHierarchy = updateNestedFolders(folder.id, groupe, isChecked);

    let updatedParentFolder = { ...folder };
    let nouvellesAssociationsParent = new Set(folder.groupesAssocies || []);
    if (isChecked) {
      nouvellesAssociationsParent.add(groupe.id);
    } else {
      nouvellesAssociationsParent.delete(groupe.id);
    }
    updatedParentFolder.groupesAssocies = Array.from(nouvellesAssociationsParent);
    updateFolderInSupabase(updatedParentFolder.id, updatedParentFolder.groupesAssocies);
    
    const updatedParcoursInHierarchy = allNestedParcours.map(p => {
      let nouvellesAssociations = new Set(p.groupesAssocies || []);
      if (isChecked) {
        nouvellesAssociations.add(groupe.id);
      } else {
        nouvellesAssociations.delete(groupe.id); 
      }
      const finalAssociations = Array.from(nouvellesAssociations);
      updateParcoursInSupabase(p.id, finalAssociations);
      return { ...p, groupesAssocies: finalAssociations };
    });
    
    setParcoursFoldersData(prev => {
      const newFoldersMap = new Map(prev.map(f => [f.id, f]));
      updatedFoldersInHierarchy.forEach(f => newFoldersMap.set(f.id, f));
      newFoldersMap.set(updatedParentFolder.id, updatedParentFolder);
      return Array.from(newFoldersMap.values());
    });

    setParcoursData(prev => {
      const newParcoursMap = new Map(prev.map(p => [p.id, p]));
      updatedParcoursInHierarchy.forEach(p => newParcoursMap.set(p.id, p));
      return Array.from(newParcoursMap.values());
    });
  };

  const handleParcoursGroupeAssociation = async (parcours, groupe) => {
    let updatedParcoursData = parcoursData.map((p) => {
      if (p.id === parcours.id) {
        let nouvellesAssociations = p.groupesAssocies || [];
        if (nouvellesAssociations.includes(groupe.id)) {
          nouvellesAssociations = nouvellesAssociations.filter(
            (id) => id !== groupe.id
          );
        } else {
          nouvellesAssociations = [...nouvellesAssociations, groupe.id];
        }
        updateParcoursInSupabase(p.id, nouvellesAssociations);
        return {
          ...p,
          groupesAssocies: nouvellesAssociations,
        };
      }
      return p;
    });

    setParcoursData(updatedParcoursData);

    let currentFolderId = parcours.folder_id;
    while (currentFolderId) {
      const folder = parcoursFoldersData.find(f => f.id === currentFolderId);
      if (!folder) break;

      const nestedParcoursForThisFolder = getAllNestedParcours(folder.id);
      const isAnyParcoursInFolderAssociated = nestedParcoursForThisFolder.some(p => {
          const updatedP = updatedParcoursData.find(item => item.id === p.id);
          return updatedP?.groupesAssocies?.includes(groupe.id);
      });

      let folderWasAssociated = folder.groupesAssocies?.includes(groupe.id) || false;

      if (isAnyParcoursInFolderAssociated && !folderWasAssociated) {
          const newAssociations = [...(folder.groupesAssocies || []), groupe.id];
          updateFolderInSupabase(folder.id, newAssociations);
          setParcoursFoldersData(prev => prev.map(f => f.id === folder.id ? {...f, groupesAssocies: newAssociations} : f));
      } else if (!isAnyParcoursInFolderAssociated && folderWasAssociated) {
          const newAssociations = (folder.groupesAssocies || []).filter(id => id !== groupe.id);
          updateFolderInSupabase(folder.id, newAssociations);
          setParcoursFoldersData(prev => prev.map(f => f.id === folder.id ? {...f, groupesAssocies: newAssociations} : f));
      }

      currentFolderId = folder.parent_folder_id;
    }
  };

  const getFolderStatus = useCallback((folder, groupe) => {
    const allNestedParcours = getAllNestedParcours(folder.id);
    if (allNestedParcours.length === 0) {
      return 'empty';
    }
    const associatedParcoursCount = allNestedParcours.filter(p => p.groupesAssocies?.includes(groupe.id)).length;
    if (associatedParcoursCount === 0) {
      return 'not_associated';
    } else if (associatedParcoursCount < allNestedParcours.length) {
      return 'partial';
    } else {
      return 'full';
    }
  }, [getAllNestedParcours]);


  let itemsToShow = getRenderedItems();
  
  if (searchTerm) {
    itemsToShow = itemsToShow.filter(item =>
      item.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // NOUVELLE LOGIQUE DE FILTRAGE DES COMPTEURS
  if (activeFilter === 'unassociated_folders') {
    itemsToShow = itemsToShow.filter(item =>
      item.type === 'dossier' && 
      !item.groupesAssocies?.length
    );
  } else if (activeFilter === 'unassociated_parcours') {
    itemsToShow = itemsToShow.filter(item => 
      item.type === 'parcours' && 
      !item.groupesAssocies?.length
    );
  } else if (activeFilter === 'associated_parcours') {
    itemsToShow = itemsToShow.filter(item => 
      item.type === 'parcours' && 
      item.groupesAssocies?.length > 0
    );
  }

  // DÉFINITION DES COMPTEURS
  const totalDossiers = parcoursFoldersData.length;
  const totalParcoursLibres = parcoursData.filter(p => !p.folder_id).length;
  const totalGroupes = groupesData.length;
  const totalAssociations = parcoursData.reduce((acc, parcours) =>
    acc + (parcours.groupesAssocies?.length || 0), 0
  );

  const totalUnassociatedFolders = parcoursFoldersData.filter(f => !f.groupesAssocies?.length).length;
  const totalUnassociatedParcours = parcoursData.filter(p => !p.groupesAssocies?.length).length;
  const totalAssociatedParcours = parcoursData.filter(p => p.groupesAssocies?.length > 0).length;
  
  const handleCopyAssociations = async () => {
    if (!selectedSourceGroup || !selectedTargetGroup) {
      setCopyStatus('warning');
      setTimeout(() => setCopyStatus(null), 3000);
      return;
    }
    if (selectedSourceGroup === selectedTargetGroup) {
      setCopyStatus('warning');
      setTimeout(() => setCopyStatus(null), 3000);
      return;
    }
    
    setIsCopying(true);
    setCopyStatus(null);
    try {
      const sourceParcours = parcoursData.filter(p => p.groupesAssocies?.includes(selectedSourceGroup));
      const sourceFolders = parcoursFoldersData.filter(f => f.groupesAssocies?.includes(selectedSourceGroup));

      const updatedParcoursPromises = parcoursData.map(p => {
        const newAssociations = new Set(p.groupesAssocies || []);
        if (sourceParcours.some(sp => sp.id === p.id)) {
          newAssociations.add(selectedTargetGroup);
        } else {
          newAssociations.delete(selectedTargetGroup);
        }
        return updateParcoursInSupabase(p.id, Array.from(newAssociations));
      });

      const updatedFoldersPromises = parcoursFoldersData.map(f => {
        const newAssociations = new Set(f.groupesAssocies || []);
        if (sourceFolders.some(sf => sf.id === f.id)) {
          newAssociations.add(selectedTargetGroup);
        } else {
          newAssociations.delete(selectedTargetGroup);
        }
        return updateFolderInSupabase(f.id, Array.from(newAssociations));
      });

      await Promise.all([...updatedParcoursPromises, ...updatedFoldersPromises]);

      // Mettre à jour l'état local après la copie réussie
      const updatedParcoursData = parcoursData.map(p => {
        const newAssociations = new Set(p.groupesAssocies || []);
        if (sourceParcours.some(sp => sp.id === p.id)) {
          newAssociations.add(selectedTargetGroup);
        } else {
          newAssociations.delete(selectedTargetGroup);
        }
        return { ...p, groupesAssocies: Array.from(newAssociations) };
      });
      setParcoursData(updatedParcoursData);

      const updatedFoldersData = parcoursFoldersData.map(f => {
        const newAssociations = new Set(f.groupesAssocies || []);
        if (sourceFolders.some(sf => sf.id === f.id)) {
          newAssociations.add(selectedTargetGroup);
        } else {
          newAssociations.delete(selectedTargetGroup);
        }
        return { ...f, groupesAssocies: Array.from(newAssociations) };
      });
      setParcoursFoldersData(updatedFoldersData);

      setCopyStatus('success');
      setTimeout(() => setCopyStatus(null), 3000);

    } catch (err) {
      console.error("Erreur lors de la copie des associations:", err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus(null), 3000);
    } finally {
      setIsCopying(false);
    }
  };

  const getCopyButtonContent = () => {
    if (isCopying) {
      return (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Copie en cours...
        </>
      );
    }
    if (copyStatus === 'success') {
      return (
        <>
          <Check className="w-5 h-5 mr-2" />
          Associations copiées !
        </>
      );
    }
    if (copyStatus === 'error') {
      return (
        <>
          <X className="w-5 h-5 mr-2" />
          Erreur de copie
        </>
      );
    }
    if (copyStatus === 'warning') {
      return (
        <>
          <AlertTriangle className="w-5 h-5 mr-2" />
          Choisissez deux groupes différents
        </>
      );
    }
    return (
      <>
        <Copy className="w-5 h-5 mr-2" />
        Copier les associations
      </>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <div className={`relative z-10 container mx-auto px-4 py-8 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 mb-2 drop-shadow-lg">
            Association Parcours & Groupes
          </h1>
          <p className="text-lg text-white/80 font-light max-w-2xl mx-auto">
            Associez vos dossiers et parcours aux différents groupes d'élèves.
          </p>
        </div>
        <div className="absolute top-8 left-8">
          <button onClick={() => setPage("gestionParcours")} className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 hover:scale-105 border border-white/20 hover:border-white/40 shadow-md">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
        </div>

        {/* Nouveaux compteurs cliquables */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div onClick={() => setActiveFilter(activeFilter === 'unassociated_folders' ? 'all' : 'unassociated_folders')} className={`bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-red-400/30 text-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 ${activeFilter === 'unassociated_folders' ? 'ring-4 ring-red-400/50' : ''}`}>
            <BookOpen className="w-8 h-8 text-red-300 mx-auto mb-3" />
            <p className="text-white/70 text-sm mb-1">Dossiers non associés</p>
            <p className="text-3xl font-extrabold text-red-300">{totalUnassociatedFolders}</p>
          </div>
          <div onClick={() => setActiveFilter(activeFilter === 'unassociated_parcours' ? 'all' : 'unassociated_parcours')} className={`bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-400/30 text-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 ${activeFilter === 'unassociated_parcours' ? 'ring-4 ring-yellow-400/50' : ''}`}>
            <Target className="w-8 h-8 text-yellow-300 mx-auto mb-3" />
            <p className="text-white/70 text-sm mb-1">Parcours non associés</p>
            <p className="text-3xl font-extrabold text-yellow-300">{totalUnassociatedParcours}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30 text-center shadow-lg">
            <Check className="w-8 h-8 text-green-300 mx-auto mb-3" />
            <p className="text-white/70 text-sm mb-1">Parcours associés</p>
            <p className="text-3xl font-extrabold text-green-300">{totalAssociatedParcours}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 text-center shadow-lg">
            <Users className="w-8 h-8 text-purple-300 mx-auto mb-3" />
            <p className="text-white/70 text-sm mb-1">Groupes</p>
            <p className="text-3xl font-extrabold text-purple-300">{totalGroupes}</p>
          </div>
        </div>

        {/* Légende du code couleur */}
        <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-lg mb-8">
          <h3 className="text-lg font-semibold text-white mb-2">Légende</h3>
          <div className="flex flex-wrap gap-4 text-white/80 text-sm">
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-blue-500 mr-2"></span>
              Parcours associé
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-green-500 mr-2"></span>
              Dossier entièrement associé
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-orange-500 mr-2"></span>
              Dossier partiellement associé
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-gray-800 mr-2"></span>
              Dossier sans parcours
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl rounded-3xl border border-blue-400/30 shadow-2xl flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-3">Chargement des données...</h3>
            <p className="text-white/60">Veuillez patienter pendant que nous récupérons les informations.</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-16 bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-xl rounded-3xl border border-red-400/30 shadow-2xl">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-400/30">
              <X className="w-12 h-12 text-red-400 opacity-80" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              Erreur de chargement
            </h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              {error}
            </p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl hover:scale-105 shadow-lg">
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !error && (parcoursData.length === 0 || groupesData.length === 0) ? (
          <div className="text-center py-16 bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-xl rounded-3xl border border-red-400/30 shadow-2xl">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-400/30">
              <X className="w-12 h-12 text-red-400 opacity-80" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              Données insuffisantes
            </h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Veuillez créer au moins un parcours et un groupe dans Supabase pour commencer les associations.
            </p>
            <button onClick={() => setPage("gestionParcours")} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl hover:scale-105 shadow-lg">
              Retour à la Gestion
            </button>
          </div>
        ) : (
          !isLoading && !error && (
            <>
              <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg mb-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Filter className="w-6 h-6 mr-2 text-blue-300" />
                  Options de Filtrage
                </h3>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Rechercher un dossier ou parcours..."
                      className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white border border-white/20 focus:border-blue-400 focus:outline-none placeholder-white/40 shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-sm">
                        <th className="px-6 py-4 text-left text-white font-semibold text-lg border-b border-white/20">
                          <div className="flex items-center">
                            <BookOpen className="w-5 h-5 mr-2" />
                            Dossiers & Parcours
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-white font-semibold border-b border-white/20 min-w-[200px]">
                          <div className="flex flex-col items-center justify-center">
                            <span className="mb-2">Groupe Source</span>
                            <div className="relative w-full">
                              <select
                                className="w-full px-4 py-2 bg-white/10 rounded-xl text-white border border-white/20 focus:border-blue-400 focus:outline-none appearance-none cursor-pointer text-sm"
                                value={selectedSourceGroup || ''}
                                onChange={(e) => setSelectedSourceGroup(e.target.value)}
                              >
                                {groupesData.map(group => (
                                  <option key={group.id} value={group.id} className="bg-gray-800 text-white">{group.nom}</option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/50">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                              </div>
                            </div>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center border-b border-white/20 min-w-[120px]">
                          <button
                            onClick={handleCopyAssociations}
                            className={`flex items-center justify-center w-full px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors duration-300 ${
                              isCopying ? 'bg-blue-500/50 cursor-not-allowed' :
                              copyStatus === 'success' ? 'bg-green-500/70 hover:bg-green-600' :
                              copyStatus === 'error' ? 'bg-red-500/70 hover:bg-red-600' :
                              'bg-white/10 hover:bg-white/20'
                            } ${selectedSourceGroup === selectedTargetGroup ? 'cursor-not-allowed opacity-50' : ''}`}
                            disabled={isCopying || selectedSourceGroup === selectedTargetGroup}
                          >
                            {getCopyButtonContent()}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center text-white font-semibold border-b border-white/20 min-w-[200px]">
                          <div className="flex flex-col items-center justify-center">
                            <span className="mb-2">Groupe Cible</span>
                            <div className="relative w-full">
                              <select
                                className="w-full px-4 py-2 bg-white/10 rounded-xl text-white border border-white/20 focus:border-blue-400 focus:outline-none appearance-none cursor-pointer text-sm"
                                value={selectedTargetGroup || ''}
                                onChange={(e) => setSelectedTargetGroup(e.target.value)}
                              >
                                {groupesData.map(group => (
                                  <option key={group.id} value={group.id} className="bg-gray-800 text-white">{group.nom}</option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/50">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                              </div>
                            </div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsToShow.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Info className="w-12 h-12 text-blue-400/60 mb-4" />
                              <p className="text-white/60 text-lg">
                                Aucun élément ne correspond à vos critères de recherche.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        itemsToShow.map((item, index) => {
                          const sourceGroup = groupesData.find(g => g.id === selectedSourceGroup);
                          const targetGroup = groupesData.find(g => g.id === selectedTargetGroup);
                          if (!sourceGroup || !targetGroup) return null;

                          // Logique pour le groupe source
                          const isParcoursCheckedSource = item.type === 'parcours' && item.groupesAssocies?.includes(sourceGroup.id);
                          const folderStatusSource = item.type === 'dossier' ? getFolderStatus(item, sourceGroup) : null;
                          let checkboxClassesSource = 'h-6 w-6 rounded-lg appearance-none cursor-pointer border-2 transition-colors duration-200 ease-in-out relative';
                          let checkboxCheckedSource = false;
                          let checkboxDisabledSource = false;

                          if (item.type === 'parcours') {
                            checkboxCheckedSource = isParcoursCheckedSource;
                            checkboxClassesSource += isParcoursCheckedSource ? ' bg-blue-500 border-blue-500' : ' bg-white/20 border-white/30';
                          } else {
                            switch (folderStatusSource) {
                              case 'full': checkboxCheckedSource = true; checkboxClassesSource += ' bg-green-500 border-green-500'; break;
                              case 'partial': checkboxCheckedSource = true; checkboxClassesSource += ' bg-orange-500 border-orange-500'; break;
                              case 'empty': checkboxCheckedSource = false; checkboxDisabledSource = true; checkboxClassesSource += ' bg-gray-800 border-gray-700 cursor-not-allowed'; break;
                              case 'not_associated': checkboxCheckedSource = false; checkboxClassesSource += ' bg-white/20 border-white/30'; break;
                              default: break;
                            }
                          }

                          // Logique pour le groupe cible
                          const isParcoursCheckedTarget = item.type === 'parcours' && item.groupesAssocies?.includes(targetGroup.id);
                          const folderStatusTarget = item.type === 'dossier' ? getFolderStatus(item, targetGroup) : null;
                          let checkboxClassesTarget = 'h-6 w-6 rounded-lg appearance-none cursor-pointer border-2 transition-colors duration-200 ease-in-out relative';
                          let checkboxCheckedTarget = false;
                          let checkboxDisabledTarget = false;

                          if (item.type === 'parcours') {
                            checkboxCheckedTarget = isParcoursCheckedTarget;
                            checkboxClassesTarget += isParcoursCheckedTarget ? ' bg-blue-500 border-blue-500' : ' bg-white/20 border-white/30';
                          } else {
                            switch (folderStatusTarget) {
                              case 'full': checkboxCheckedTarget = true; checkboxClassesTarget += ' bg-green-500 border-green-500'; break;
                              case 'partial': checkboxCheckedTarget = true; checkboxClassesTarget += ' bg-orange-500 border-orange-500'; break;
                              case 'empty': checkboxCheckedTarget = false; checkboxDisabledTarget = true; checkboxClassesTarget += ' bg-gray-800 border-gray-700 cursor-not-allowed'; break;
                              case 'not_associated': checkboxCheckedTarget = false; checkboxClassesTarget += ' bg-white/20 border-white/30'; break;
                              default: break;
                            }
                          }
                          
                          const CheckIcon = (
                            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white w-4 h-4 pointer-events-none transition-opacity duration-200 ease-in-out"
                              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          );

                          return (
                            <tr key={`${item.type}-${item.id}`} className={`${
                              index % 2 === 0 ? 'bg-white/5' : 'bg-black/10'
                            } hover:bg-white/10`}>
                              <td className="px-6 py-4 border-b border-white/10">
                                {item.type === 'dossier' ? (
                                  <div className="flex items-center cursor-pointer" style={{ paddingLeft: `${item.indentation * 1.5}rem` }} onClick={() => toggleFolder(item.id)}>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/40">
                                      {expandedFolders.has(item.id) ? ( <span className="text-lg">📂</span> ) : ( <span className="text-lg">📁</span> )}
                                    </div>
                                    <div>
                                      <p className="text-white font-medium text-lg">{item.nom}</p>
                                      <p className="text-white/60 text-sm">Dossier</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center" style={{ paddingLeft: `${item.indentation * 1.5}rem` }}>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border border-blue-400/40">
                                      <span className="text-lg">📋</span>
                                    </div>
                                    <div>
                                      <p className="text-white font-medium text-lg">{item.nom}</p>
                                      <p className="text-white/60 text-sm">Parcours</p>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center border-b border-white/10 relative">
                                <label className="inline-flex items-center cursor-pointer relative">
                                  <input type="checkbox" className={checkboxClassesSource} checked={checkboxCheckedSource}
                                    onChange={(e) => {
                                      if (item.type === 'dossier') { handleFolderGroupeAssociation(item, sourceGroup, e.target.checked); } 
                                      else { handleParcoursGroupeAssociation(item, sourceGroup); }
                                    }}
                                    disabled={checkboxDisabledSource}
                                  />
                                  {checkboxCheckedSource && CheckIcon}
                                  <span className="sr-only">
                                    Associer {item.nom} avec {sourceGroup.nom}
                                  </span>
                                </label>
                              </td>
                              <td className="px-6 py-4 border-b border-white/10 text-center text-white/50">
                                <ArrowLeft className="w-5 h-5 mx-auto -scale-x-100" />
                              </td>
                              <td className="px-6 py-4 text-center border-b border-white/10 relative">
                                <label className="inline-flex items-center cursor-pointer relative">
                                  <input type="checkbox" className={checkboxClassesTarget} checked={checkboxCheckedTarget}
                                    onChange={(e) => {
                                      if (item.type === 'dossier') { handleFolderGroupeAssociation(item, targetGroup, e.target.checked); } 
                                      else { handleParcoursGroupeAssociation(item, targetGroup); }
                                    }}
                                    disabled={checkboxDisabledTarget}
                                  />
                                  {checkboxCheckedTarget && CheckIcon}
                                  <span className="sr-only">
                                    Associer {item.nom} avec {targetGroup.nom}
                                  </span>
                                </label>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <button onClick={() => setPage("gestionParcours")} className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-bold text-lg hover:scale-105 shadow-xl flex items-center mx-auto">
                  <Check className="w-6 h-6 mr-3" />
                  Retour à la Gestion
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default Association;