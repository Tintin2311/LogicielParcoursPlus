// src/components/FolderPickerModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Folder, Check, X, FolderOpen, ChevronRight, Home } from 'lucide-react';

const FolderPickerModal = ({ isOpen, onClose, onSelectFolder, initialSelectedFolderId, allFolders }) => {
  const [currentNavFolderId, setCurrentNavFolderId] = useState<string | null>(null); // ID du dossier actuellement affiché
  const [selectedFolderForReturn, setSelectedFolderForReturn] = useState<any | null>(null); // Dossier que l'utilisateur veut sélectionner
  const [navHistory, setNavHistory] = useState<any[]>([]); // Historique de navigation pour le bouton "Retour"

  // Effet pour initialiser la sélection et la navigation à l'ouverture de la modale
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedFolderId) {
        // Find the full folder object from allFolders
        const initialFolder = allFolders.find(f => f.id === initialSelectedFolderId);
        if (initialFolder) {
          setSelectedFolderForReturn(initialFolder);
          // Build navigation history up to the initial selected folder
          const history = [];
          let tempFolder = initialFolder;
          while (tempFolder && tempFolder.parent_folder_id) {
            const parent = allFolders.find(f => f.id === tempFolder.parent_folder_id);
            if (parent) {
              history.unshift(parent);
              tempFolder = parent;
            } else {
              break;
            }
          }
          setNavHistory(history);
          setCurrentNavFolderId(initialFolder.id); // Start navigation in the initial folder's parent for better UX
        } else {
          setCurrentNavFolderId(null);
          setSelectedFolderForReturn(null);
          setNavHistory([]);
        }
      } else {
        setCurrentNavFolderId(null);
        setSelectedFolderForReturn(null);
        setNavHistory([]);
      }
    }
  }, [isOpen, initialSelectedFolderId, allFolders]);


  const getChildrenFolders = useCallback((parentId) => {
    return allFolders.filter(f => f.parent_folder_id === parentId);
  }, [allFolders]);

  const getParentFolder = useCallback((folderId) => {
    const folder = allFolders.find(f => f.id === folderId);
    return folder ? allFolders.find(f => f.id === folder.parent_folder_id) : null;
  }, [allFolders]);

  const handleOpenFolder = useCallback((folder) => {
    setCurrentNavFolderId(folder.id);
    setNavHistory(prev => [...prev, folder]);
  }, []);

  const handleGoBack = useCallback(() => {
    setNavHistory(prev => {
      const newHistory = prev.slice(0, prev.length - 1);
      setCurrentNavFolderId(newHistory.length > 0 ? newHistory[newHistory.length - 1].id : null);
      return newHistory;
    });
  }, []);

  const handleGoToRoot = useCallback(() => {
    setCurrentNavFolderId(null);
    setNavHistory([]);
  }, []);

  const handleSelectAndClose = useCallback(() => {
    onSelectFolder(selectedFolderForReturn ? selectedFolderForReturn.id : null);
    onClose();
  }, [onSelectFolder, selectedFolderForReturn, onClose]);

  if (!isOpen) return null;

  const currentFolders = getChildrenFolders(currentNavFolderId);
  const currentNavFolder = allFolders.find(f => f.id === currentNavFolderId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-800 to-indigo-800 rounded-3xl shadow-2xl p-6 w-full max-w-2xl h-[80vh] flex flex-col border border-purple-600/50">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-purple-700 mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FolderOpen className="w-7 h-7 mr-3 text-purple-300" /> Choisir un Dossier
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-purple-200 mb-4">
          <button 
            onClick={handleGoToRoot} 
            className="hover:text-white transition-colors flex items-center px-2 py-1 rounded-md bg-purple-700/50 hover:bg-purple-600/70"
          >
            <Home className="w-4 h-4 mr-1" /> Racine
          </button>
          {navHistory.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-4 h-4 text-purple-400" />
              <button
                onClick={() => {
                  setCurrentNavFolderId(folder.id);
                  setNavHistory(navHistory.slice(0, index + 1));
                }}
                className={`hover:text-white transition-colors px-2 py-1 rounded-md ${index === navHistory.length - 1 ? 'text-white font-semibold bg-purple-700' : 'bg-purple-700/50 hover:bg-purple-600/70'}`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Back button */}
        {(currentNavFolderId || navHistory.length > 0) && (
          <button
            onClick={handleGoBack}
            className="flex items-center text-purple-200 hover:text-white transition-colors mb-4 px-3 py-2 rounded-lg bg-purple-700/40 hover:bg-purple-600/50 self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </button>
        )}

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {currentFolders.length === 0 ? (
            <div className="text-center py-8 text-purple-300 bg-purple-900/50 rounded-xl border border-purple-700">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-purple-500" />
              <p className="text-sm">Ce dossier est vide.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentFolders.map(folder => (
                <div
                  key={folder.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200
                    ${selectedFolderForReturn && selectedFolderForReturn.id === folder.id
                      ? 'bg-purple-500/30 border border-purple-400 ring-2 ring-purple-300'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-purple-500/50'
                    }
                  `}
                >
                  <div className="flex items-center flex-1" onClick={() => handleOpenFolder(folder)}>
                    <Folder className="w-5 h-5 mr-3 text-purple-300" />
                    <span className="text-white font-medium text-lg">{folder.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedFolderForReturn(folder)}
                      className={`
                        px-3 py-1 rounded-md text-sm font-semibold transition-all duration-200
                        ${selectedFolderForReturn && selectedFolderForReturn.id === folder.id
                          ? 'bg-green-500 text-white'
                          : 'bg-purple-600/70 text-purple-100 hover:bg-purple-500'
                        }
                      `}
                    >
                      {selectedFolderForReturn && selectedFolderForReturn.id === folder.id ? 'Sélectionné' : 'Sélectionner'}
                    </button>
                    <button
                      onClick={() => handleOpenFolder(folder)}
                      className="p-1 text-purple-300 hover:text-white hover:bg-white/10 rounded-full"
                      title="Ouvrir le dossier"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-purple-700 flex justify-end space-x-4">
          <button
            onClick={() => {
                onSelectFolder(null); // Clear selection
                onClose();
            }}
            className="px-6 py-2 bg-red-600/70 text-white rounded-lg hover:bg-red-700/80 transition-colors shadow-lg"
          >
            <X className="w-5 h-5 inline-block mr-2" /> Effacer la sélection
          </button>
          <button
            onClick={handleSelectAndClose}
            className="px-6 py-2 bg-green-500/80 text-white rounded-lg hover:bg-green-600/90 transition-colors shadow-lg"
          >
            <Check className="w-5 h-5 inline-block mr-2" /> Valider
          </button>
        </div>

      </div>
      {/* Custom Scrollbar Style */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(160, 0, 255, 0.4); /* Purple */
          border-radius: 10px;
          border: 2px solid rgba(255,255,255,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(160, 0, 255, 0.6);
        }
      `}</style>
    </div>
  );
};

export default FolderPickerModal;