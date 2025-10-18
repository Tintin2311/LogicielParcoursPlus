import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import type { DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  ArrowLeft,
  Plus,
  Target,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Edit3,
  Trash2,
  MoreVertical,
  ChevronRight,
  Bookmark,
  Briefcase,
  Cloud,
  Sun,
  Heart,
  Book,
  Coffee,
  Gift,
  Camera,
  Search,
} from 'lucide-react';
import { supabase } from './supabaseClient';

/* =========================
          TYPES
========================= */
interface SupabaseBaseItem {
  id: string;
  created_at?: string | null;
  ordre: number;
}

interface Course extends SupabaseBaseItem {
  type: 'course';
  nom: string;
  balises: number;
  folder_id: string | null;
  user_id?: string | null;
  professeur_id?: string | null;
  groupes_assoc?: any;
}

interface Folder extends SupabaseBaseItem {
  type: 'folder';
  nom: string;
  description?: string | null;
  color: string;
  icon: string;
  parent_folder_id: string | null;
  children: Array<Course | Folder>;
  isNew?: boolean; // client-only
}

type MovableItem = Course | Folder;

const ItemTypes = {
  COURSE: 'course',
  FOLDER: 'folder',
} as const;

/* =========================
     ICÔNES DISPONIBLES
========================= */
const availableIcons: Record<string, React.ElementType> = {
  Folder: FolderIcon,
  Bookmark,
  Briefcase,
  Cloud,
  Sun,
  Heart,
  Book,
  Coffee,
  Gift,
  Camera,
};

/* =========================
  HELPERS
========================= */
const makeUUID = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;

const mapSupabaseDataToFrontend = (
  supabaseFolders: any[],
  supabaseParcours: any[]
): (Folder | Course)[] => {
  const folders = new Map<string, Folder>();
  const courses = new Map<string, Course>();

  // dossiers
  for (const f of supabaseFolders ?? []) {
    if (!f?.id) continue;
    const name = (f.name ?? '').trim();
    if (!name) continue;

    folders.set(f.id, {
      id: f.id,
      type: 'folder',
      nom: name,
      description: f.description ?? null,
      color: f.color || 'purple',
      icon: f.icon || 'Folder',
      parent_folder_id: f.parent_folder_id ?? null,
      created_at: f.created_at ?? null,
      ordre: f.ordre ?? 0,
      children: [],
    });
  }

  // parcours
  for (const p of supabaseParcours ?? []) {
    if (!p?.id) continue;
    const name = (p.nom ?? '').trim();
    if (!name) continue;

    courses.set(p.id, {
      id: p.id,
      type: 'course',
      nom: name,
      balises: Array.isArray(p.balises_ordre) ? p.balises_ordre.length : 0,
      folder_id: p.folder_id ?? null,
      user_id: p.user_id ?? null,
      professeur_id: p.professeur_id ?? null,
      groupes_assoc: p.groupes_assoc ?? {},
      created_at: p.created_at ?? null,
      ordre: p.ordre ?? 0,
    });
  }

  // construction arbre
  const roots: (Folder | Course)[] = [];

  courses.forEach((c) => {
    if (c.folder_id && folders.has(c.folder_id)) {
      folders.get(c.folder_id)!.children.push(c);
    } else {
      roots.push(c);
    }
  });

  folders.forEach((f) => {
    if (f.parent_folder_id && folders.has(f.parent_folder_id)) {
      folders.get(f.parent_folder_id)!.children.push(f);
    } else {
      roots.push(f);
    }
  });

  // tri par ordre
  const sortBy = (a: MovableItem, b: MovableItem) => (a.ordre ?? 0) - (b.ordre ?? 0);
  const sortRec = (list: (Folder | Course)[]) => {
    for (const it of list) if (it.type === 'folder') sortRec(it.children);
    list.sort(sortBy);
  };
  sortRec(roots);

  return roots;
};

const findItemRecursive = (id: string, col: (Folder | Course)[]): Folder | Course | null => {
  for (const it of col) {
    if (it.id === id) return it;
    if (it.type === 'folder') {
      const f = findItemRecursive(id, it.children);
      if (f) return f;
    }
  }
  return null;
};

const updateItemRecursive = (
  id: string,
  patch: Partial<Folder | Course>,
  col: (Folder | Course)[]
): (Folder | Course)[] =>
  col.map((it) => {
    if (it.id === id) return { ...it, ...patch } as any;
    if (it.type === 'folder') return { ...it, children: updateItemRecursive(id, patch, it.children) };
    return it;
  });

const deleteItemRecursive = (id: string, col: (Folder | Course)[]): (Folder | Course)[] =>
  col
    .filter((it) => it.id !== id)
    .map((it) =>
      it.type === 'folder' ? { ...it, children: deleteItemRecursive(id, it.children) } : it
    );

/* =========================
        COURSE CARD
========================= */
const CourseItem: React.FC<{
  course: Course;
  parentFolderId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onClickCourse: (id: string) => void;
  index: number;
  handleMoveItemInList: (draggedId: string, hoveredId: string) => void;
}> = ({ course, parentFolderId, onEdit, onDelete, onClickCourse, index, handleMoveItemInList }) => {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.COURSE,
    item: { id: course.id, type: ItemTypes.COURSE, parentFolderId, index },
    collect: (m) => ({ isDragging: m.isDragging() }),
  }), [course.id, parentFolderId, index]);

  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.COURSE],
    hover(item: any, monitor: DropTargetMonitor) {
      if (!ref.current || item.id === course.id) return;
      if (item.parentFolderId !== parentFolderId) return;

      const dragIndex = item.index as number;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const rect = ref.current.getBoundingClientRect();
      const mid = (rect.bottom - rect.top) / 2;
      const p = monitor.getClientOffset();
      const y = (p?.y ?? 0) - rect.top;

      if (dragIndex < hoverIndex && y < mid) return;
      if (dragIndex > hoverIndex && y > mid) return;

      handleMoveItemInList(item.id, course.id);
      item.index = hoverIndex;
    },
  }), [parentFolderId, index, handleMoveItemInList]);

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`group relative bg-white/5 rounded-xl border border-purple-600/30 p-4 cursor-grab select-none transition
        ${isDragging ? 'opacity-60 border-purple-400 scale-[1.02]' : 'hover:border-purple-400'}`}
      onClick={(e) => { e.stopPropagation(); onClickCourse(course.id); }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-white font-semibold">{course.nom}</h4>
            <p className="text-purple-200 text-sm">{course.balises} balises</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}
            className="p-2 rounded-lg hover:bg-white/10 text-purple-300"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menu && (
            <div className="absolute right-0 mt-1 w-44 bg-purple-900 rounded-lg border border-purple-700 shadow-xl z-20">
              <button
                className="w-full text-left px-4 py-2 hover:bg-purple-800 flex items-center gap-2"
                onClick={(e) => { e.stopPropagation(); setMenu(false); onEdit(course.id); }}
              >
                <Edit3 className="w-4 h-4" /> Modifier
              </button>
              <button
                className="w-full text-left px-4 py-2 text-red-300 hover:bg-red-900/40 flex items-center gap-2"
                onClick={(e) => { e.stopPropagation(); setMenu(false); onDelete(course.id, course.nom); }}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================
        FOLDER CARD
========================= */
const FolderItem: React.FC<{
  folder: Folder;
  onAddFolder: (parentId: string | null) => void; // (peut être passé, non utilisé ici)
  onDeleteFolder: (id: string, name: string) => void;
  onMoveItem: (itemId: string, oldParentId: string | null, newParentId: string | null) => void;
  onOpenFolder: (f: Folder) => void;
  onUpdateFolder: (id: string, patch: Partial<Folder>) => void;
  onClickCourse: (id: string) => void;
  index: number;
  handleMoveItemInList: (draggedId: string, hoveredId: string) => void;
}> = ({
  folder, /* onAddFolder (non utilisé) */ onDeleteFolder, onMoveItem, onOpenFolder, onUpdateFolder, index, handleMoveItemInList
}) => {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(!!folder.isNew);
  const [name, setName] = useState(folder.nom);
  const [color, setColor] = useState(folder.color || 'purple');
  const [icon, setIcon] = useState(folder.icon || 'Folder');

  const boxRef = useRef<HTMLDivElement | null>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FOLDER,
    item: { id: folder.id, type: ItemTypes.FOLDER, parentFolderId: folder.parent_folder_id, index },
    collect: (m) => ({ isDragging: m.isDragging() }),
  }), [folder.id, folder.parent_folder_id, index]);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: [ItemTypes.COURSE, ItemTypes.FOLDER],
    drop(item: any) {
      if (item.id === folder.id) return;
      onMoveItem(item.id, item.parentFolderId ?? null, folder.id);
    },
    hover(item: any, monitor: DropTargetMonitor) {
      if (!boxRef.current) return;
      if (item.type !== ItemTypes.FOLDER) return; // réordonne dossiers↔dossiers ici
      if (item.parentFolderId !== folder.parent_folder_id) return;

      const dragIndex = item.index as number;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const rect = boxRef.current.getBoundingClientRect();
      const mid = (rect.bottom - rect.top) / 2;
      const p = monitor.getClientOffset();
      const y = (p?.y ?? 0) - rect.top;

      if (dragIndex < hoverIndex && y < mid) return;
      if (dragIndex > hoverIndex && y > mid) return;

      handleMoveItemInList(item.id, folder.id);
      item.index = hoverIndex;
    },
    collect: (m) => ({ isOver: m.isOver({ shallow: true }), canDrop: m.canDrop() }),
  }), [folder.id, folder.parent_folder_id, index, onMoveItem, handleMoveItemInList]);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    boxRef.current = node;
    if (node) { drag(node); drop(node); }
  }, [drag, drop]);

  const CurrentIcon = availableIcons[icon] || FolderIcon;

  const validateEdit = () => {
    const finalName = name.trim() || 'Nouveau dossier';
    onUpdateFolder(folder.id, { nom: finalName, color, icon, isNew: false });
    setEditing(false);
  };

  const cancelEdit = () => {
    setName(folder.nom);
    setColor(folder.color || 'purple');
    setIcon(folder.icon || 'Folder');
    setEditing(false);
    if (folder.isNew) onDeleteFolder(folder.id, folder.nom);
  };

  return (
    <div
      ref={setRef}
      className={`group relative bg-white/5 rounded-xl border p-4 cursor-pointer select-none transition
        ${isDragging ? 'opacity-60 border-purple-400 scale-[1.02]' : 'hover:border-purple-400 border-purple-600/30'}
        ${isOver && canDrop ? 'ring-2 ring-purple-400' : ''}`}
      onClick={() => { if (!editing && !menu) onOpenFolder(folder); }}
    >
      {/* menu */}
      <div className="absolute right-2 top-2">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}
            className="p-2 rounded-lg hover:bg-white/10 text-purple-300"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menu && (
            <div className="absolute right-0 mt-1 w-48 bg-purple-900 rounded-lg border border-purple-700 shadow-xl z-20">
              <button
                className="w-full text-left px-4 py-2 hover:bg-purple-800 flex items-center gap-2"
                onClick={(e) => { e.stopPropagation(); setMenu(false); setEditing(true); }}
              >
                <Edit3 className="w-4 h-4" /> Renommer / Style
              </button>
              <button
                className="w-full text-left px-4 py-2 text-red-300 hover:bg-red-900/40 flex items-center gap-2"
                onClick={(e) => { e.stopPropagation(); setMenu(false); onDeleteFolder(folder.id, folder.nom); }}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start">
        <div className={`w-14 h-14 rounded-2xl mb-3 flex items-center justify-center text-white
          bg-gradient-to-br ${{
            purple: 'from-purple-600 to-indigo-700',
            indigo: 'from-indigo-600 to-blue-700',
            fuchsia: 'from-fuchsia-600 to-pink-700',
            red: 'from-red-600 to-rose-700',
            green: 'from-green-600 to-emerald-700',
            blue: 'from-blue-600 to-cyan-700',
            yellow: 'from-yellow-500 to-orange-600',
          }[color] ?? 'from-purple-600 to-indigo-700'}`}
        >
          <CurrentIcon className="w-7 h-7" />
        </div>

        {editing ? (
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') validateEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="w-full px-2 py-1 rounded bg-purple-800/60 border border-purple-700 text-white"
              placeholder="Nom du dossier"
            />
            <div className="flex gap-2 mt-2">
              {['purple', 'indigo', 'fuchsia', 'red', 'green', 'blue', 'yellow'].map(c => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full ring-2 ${color === c ? 'ring-white' : 'ring-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {Object.keys(availableIcons).map(key => {
                const Ico = availableIcons[key];
                return (
                  <button
                    key={key}
                    className={`p-1 rounded ${icon === key ? 'bg-purple-700 ring-1 ring-white' : 'hover:bg-purple-800/60'}`}
                    onClick={() => setIcon(key)}
                  >
                    <Ico className="w-5 h-5 text-white" />
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500" onClick={validateEdit}>Valider</button>
              <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={cancelEdit}>Annuler</button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-white font-bold">{folder.nom}</h3>
            <p className="text-purple-200 text-sm">
              {folder.children.filter(c => c.type === 'course').length} parcours · {folder.children.filter(c => c.type === 'folder').length} sous-dossiers
            </p>
          </>
        )}
      </div>
    </div>
  );
};

/* =========================
      FOLDER CONTENT VIEW
========================= */
const FolderContentPage: React.FC<{
  folder: Folder;
  onAddFolder: (parentId: string | null) => void;
  onDeleteFolder: (id: string, name: string) => void;
  onMoveItem: (itemId: string, oldParentId: string | null, newParentId: string | null) => void;
  onEditCourse: (id: string) => void;
  onDeleteCourse: (id: string, name: string) => void;
  onAddCourse: (parentId: string | null) => void;
  onOpenFolder: (f: Folder) => void;
  onUpdateFolder: (id: string, patch: Partial<Folder>) => void;
  onClickCourse: (id: string) => void;
  searchTerm: string;
  handleMoveItemInList: (draggedId: string, hoveredId: string) => void;
}> = (props) => {
  const { folder, onAddFolder, onAddCourse, onOpenFolder, onDeleteFolder, onUpdateFolder, onEditCourse, onDeleteCourse, onClickCourse, searchTerm, onMoveItem, handleMoveItemInList } = props;

  const children = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return folder.children;
    return folder.children.filter(i => i.nom.toLowerCase().includes(term));
  }, [folder.children, searchTerm]);

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => onAddFolder(folder.id)}
          className="flex items-center px-5 py-3 rounded bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white hover:opacity-95"
        >
          <Plus className="w-5 h-5 mr-2" /> Nouveau sous-dossier
        </button>
        <button
          onClick={() => onAddCourse(folder.id)}
          className="flex items-center px-5 py-3 rounded bg-white/10 border border-white/20 text-white hover:bg-white/20"
        >
          <Target className="w-5 h-5 mr-2" /> Nouveau parcours ici
        </button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {children.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-purple-900/40 border border-purple-700 rounded-xl">
            <FolderIcon className="w-10 h-10 mx-auto text-purple-400 mb-2" />
            <p className="text-purple-200">Dossier vide ou aucun résultat.</p>
          </div>
        ) : children.map((it, idx) =>
          it.type === 'folder' ? (
            <FolderItem
              key={it.id}
              folder={it}
              index={idx}
              onAddFolder={onAddFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveItem={onMoveItem}
              onOpenFolder={onOpenFolder}
              onUpdateFolder={onUpdateFolder}
              onClickCourse={onClickCourse}
              handleMoveItemInList={handleMoveItemInList}
            />
          ) : (
            <CourseItem
              key={it.id}
              course={it}
              parentFolderId={folder.id}
              index={idx}
              onEdit={onEditCourse}
              onDelete={onDeleteCourse}
              onClickCourse={onClickCourse}
              handleMoveItemInList={handleMoveItemInList}
            />
          )
        )}
      </div>
    </div>
  );
};

/* =========================
         MAIN PAGE
========================= */
const MesParcours: React.FC<{
  setPage: (p: string) => void;
  professeur?: { id: string } | null;
  setParcoursId: (id: string) => void;
}> = ({ setPage, professeur, setParcoursId }) => {
  const [items, setItems] = useState<Array<Folder | Course>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [folderHistory, setFolderHistory] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // initial fetch
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: foldersData, error: foldersError }, { data: parcoursData, error: parcoursError }] =
          await Promise.all([
            supabase.from('parcours_folders').select('*'),
            supabase.from('parcours').select('*'),
          ]);

        if (foldersError) throw foldersError;
        if (parcoursError) throw parcoursError;

        setItems(mapSupabaseDataToFrontend(foldersData ?? [], parcoursData ?? []));
      } catch (err: any) {
        console.error(err);
        setError(`Échec du chargement: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const getFilteredItems = useCallback(() => {
    let list: (Folder | Course)[] = currentFolder
      ? currentFolder.children
      : items.filter(i => i.type === 'folder' ? !i.parent_folder_id : !i.folder_id);

    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      list = list.filter(i => i.nom.toLowerCase().includes(t));
    }
    return list.slice().sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  }, [items, currentFolder, searchTerm]);

  const revertUiState = useCallback((originalItems: (Folder | Course)[]) => {
    setItems(originalItems);
    if (currentFolder) {
      const ref = findItemRecursive(currentFolder.id, originalItems);
      setCurrentFolder(ref && ref.type === 'folder' ? ref : null);
      if (!ref) setFolderHistory([]);
    }
  }, [currentFolder]);

  /* ---------- CRUD dossiers ---------- */
  const handleAddFolder = async (parentId: string | null = null) => {
    const maxOrder = Math.max(-1, ...getFilteredItems().map(i => i.ordre ?? 0));
    const tempId = `new-folder-${Date.now()}`;
    const draft: Folder = {
      id: tempId, type: 'folder', nom: 'Nouveau dossier',
      description: null, color: 'purple', icon: 'Folder',
      parent_folder_id: parentId, created_at: null, ordre: maxOrder + 1,
      children: [], isNew: true,
    };
    setItems(prev => parentId
      ? updateItemRecursive(parentId, {
          children: ((findItemRecursive(parentId, prev) as Folder)?.children ?? []).concat(draft)
        }, prev)
      : [...prev, draft]
    );
  };

  const handleUpdateFolder = async (folderId: string, patch: Partial<Folder>) => {
    const original = items;
    const f = findItemRecursive(folderId, items);
    if (!f || f.type !== 'folder') return;

    const isNew = !!f.isNew;
    const name = (patch.nom ?? f.nom).trim() || 'Nouveau dossier';
    setItems(prev => updateItemRecursive(folderId, { ...patch, nom: name }, prev));

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('parcours_folders')
          .insert({
            name,
            description: patch.description ?? f.description ?? null,
            color: patch.color ?? f.color,
            icon: patch.icon ?? f.icon,
            parent_folder_id: f.parent_folder_id,
            ordre: f.ordre ?? 0,
          })
          .select()
          .single();
        if (error) throw error;

        setItems(prev => updateItemRecursive(folderId, { id: data.id, isNew: false }, prev));
        // recaler history/courant
        setFolderHistory(h => h.map(x => x.id === folderId ? ({ ...x, id: data.id, isNew: false }) as Folder : x) as Folder[]);
        if (currentFolder?.id === folderId) {
          const fresh = findItemRecursive(data.id, items);
          setCurrentFolder(fresh && fresh.type === 'folder' ? fresh : null);
        }
      } else {
        const { error } = await supabase
          .from('parcours_folders')
          .update({
            name,
            description: patch.description ?? f.description ?? null,
            color: patch.color ?? f.color,
            icon: patch.icon ?? f.icon,
          })
          .eq('id', folderId);
        if (error) throw error;
      }
    } catch (e: any) {
      console.error(e);
      alert(`Échec de l’enregistrement du dossier : ${e.message}`);
      revertUiState(original);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Supprimer le dossier « ${folderName} » et son contenu ?`)) return;
    const original = items;
    const f = findItemRecursive(folderId, original);
    if (!f || f.type !== 'folder') return;

    // si non-persisté
    if (f.isNew) {
      setItems(prev => deleteItemRecursive(folderId, prev));
      if (currentFolder && (currentFolder.id === folderId || !findItemRecursive(currentFolder.id, items))) {
        setCurrentFolder(null); setFolderHistory([]);
      }
      return;
    }

    try {
      const { error } = await supabase.from('parcours_folders').delete().eq('id', folderId);
      if (error) throw error;
      setItems(prev => deleteItemRecursive(folderId, prev));
      if (currentFolder && (currentFolder.id === folderId || !findItemRecursive(currentFolder.id, items))) {
        setCurrentFolder(null); setFolderHistory([]);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Échec de la suppression : ${e.message}`);
      revertUiState(original);
    }
  };

  /* ---------- CRUD parcours ---------- */
  const handleAddCourse = async (parentId: string | null = null) => {
    const nom = prompt('Nom du nouveau parcours :');
    if (!nom) return;

    const balises = Number(prompt('Nombre de balises :', '0') ?? '0');
    if (!Number.isFinite(balises) || balises < 0) return alert('Nombre invalide.');

    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id ?? null;

    const maxOrder = Math.max(-1, ...getFilteredItems().map(i => i.ordre ?? 0));
    const tempId = `new-course-${Date.now()}`;
    const tmp: Course = {
      id: tempId, type: 'course', nom, balises,
      folder_id: parentId, user_id: me, professeur_id: professeur?.id ?? null,
      groupes_assoc: {}, ordre: maxOrder + 1, created_at: null,
    };

    const original = items;
    // UI optimiste
    setItems(prev => parentId
      ? updateItemRecursive(parentId, {
          children: ((findItemRecursive(parentId, prev) as Folder)?.children ?? []).concat(tmp)
        }, prev)
      : [...prev, tmp]
    );

    try {
      // ✅ génération correcte d'un uuid[] pour balises_ordre
      const balises_ordre = Array.from({ length: balises }, () => makeUUID());

      const { data, error } = await supabase
        .from('parcours')
        .insert({
          nom,
          balises_ordre,
          folder_id: parentId,
          user_id: me,
          professeur_id: professeur?.id ?? null,
          // groupes_assoc: {}, // (si la colonne n'existe pas chez toi, laisse commenté)
          ordre: tmp.ordre,
        })
        .select()
        .single();
      if (error) throw error;

      setItems(prev => updateItemRecursive(tempId, {
        id: data.id,
        created_at: data.created_at,
        balises: Array.isArray(data.balises_ordre) ? data.balises_ordre.length : balises,
      }, prev));
    } catch (e: any) {
      console.error(e);
      alert(`Échec de la création du parcours : ${e.message}`);
      revertUiState(original);
    }
  };

  const handleEditCourse = (id: string) => { setParcoursId(id); setPage('CreerUnNouveauParcours'); };
  const handleCourseClick = (id: string) => { setParcoursId(id); setPage('CreerUnNouveauParcours'); };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (!confirm(`Supprimer le parcours « ${name} » ?`)) return;
    const original = items;
    setItems(prev => deleteItemRecursive(id, prev));
    try {
      const { error } = await supabase.from('parcours').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error(e);
      alert(`Échec de la suppression : ${e.message}`);
      revertUiState(original);
    }
  };

  /* ---------- Navigation ---------- */
  const handleOpenFolder = (f: Folder) => {
    setCurrentFolder(f);
    const path: Folder[] = [];
    let cur: Folder | null = f;
    while (cur) {
      path.unshift(cur);
      cur = cur.parent_folder_id ? (findItemRecursive(cur.parent_folder_id, items) as Folder | null) : null;
    }
    setFolderHistory(path);
    setSearchTerm('');
  };
  const handleBackToMain = () => {
    if (folderHistory.length > 1) {
      const parent = folderHistory[folderHistory.length - 2];
      setCurrentFolder(parent);
      setFolderHistory(folderHistory.slice(0, -1));
    } else {
      setCurrentFolder(null); setFolderHistory([]);
    }
    setSearchTerm('');
  };
  const handleNavigateToFolder = (id: string) => {
    const f = findItemRecursive(id, items);
    if (f && f.type === 'folder') handleOpenFolder(f);
  };

  /* ---------- DnD racine + réordonnancement + déplacement ---------- */
  const [{ isOverRoot }, dropRoot] = useDrop(() => ({
    accept: [ItemTypes.COURSE, ItemTypes.FOLDER],
    drop: (item: any) => {
      handleMoveItem(item.id, item.parentFolderId ?? null, null);
    },
    collect: (m) => ({ isOverRoot: m.isOver() }),
  }));

  // ✅ FIX 1 : callback-ref au lieu de ref={dropRoot}
  const setRootDropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) dropRoot(node);
  }, [dropRoot]);

  const handleMoveItemInList = useCallback((draggedId: string, hoveredId: string) => {
    const original = items;
    setItems(prev => {
      const draft = structuredClone(prev) as (Folder | Course)[];
      const parentList = currentFolder
        ? (findItemRecursive(currentFolder.id, draft) as Folder).children
        : draft.filter(i => i.type === 'folder' ? !i.parent_folder_id : !i.folder_id);

      const iFrom = parentList.findIndex(i => i.id === draggedId);
      const iTo = parentList.findIndex(i => i.id === hoveredId);
      if (iFrom < 0 || iTo < 0) return prev;

      const [moved] = parentList.splice(iFrom, 1);
      parentList.splice(iTo, 0, moved);
      parentList.forEach((it, idx) => { it.ordre = idx; });

      const writeBack = () => {
        if (currentFolder) {
          const p = findItemRecursive(currentFolder.id, draft) as Folder;
          p.children = parentList;
        } else {
          const nonRoot = draft.filter(i => (i.type === 'folder' ? i.parent_folder_id : i.folder_id));
          return [...parentList, ...nonRoot];
        }
        return draft;
      };
      const next = writeBack() as (Folder | Course)[];

      Promise.all(parentList.map((it) => {
        const tbl = it.type === 'course' ? 'parcours' : 'parcours_folders';
        return supabase.from(tbl).update({ ordre: it.ordre ?? 0 }).eq('id', it.id);
      })).catch(e => { console.error(e); alert('Échec de la mise à jour de l’ordre.'); revertUiState(original); });

      return next;
    });
  }, [items, currentFolder, revertUiState]);

  const isDescendant = (parent: Folder, maybeChild: Folder): boolean => {
    if (parent.id === maybeChild.id) return true;
    for (const ch of parent.children) if (ch.type === 'folder' && isDescendant(ch, maybeChild)) return true;
    return false;
  };

  const handleMoveItem = async (itemId: string, oldParentId: string | null, newParentId: string | null) => {
    if (oldParentId === newParentId) return;

    const dragged = findItemRecursive(itemId, items);
    if (!dragged) return;

    if (dragged.type === 'folder' && newParentId) {
      const target = findItemRecursive(newParentId, items);
      if (target && target.type === 'folder' && isDescendant(dragged, target)) {
        console.warn('Impossible de déplacer un dossier dans lui-même ou son descendant');
        return;
      }
    }

    const tbl = dragged.type === 'course' ? 'parcours' : 'parcours_folders';
    const fk = dragged.type === 'course' ? 'folder_id' : 'parent_folder_id';

    const targetList = newParentId
      ? ((findItemRecursive(newParentId, items) as Folder)?.children ?? [])
      : items.filter(i => i.type === 'folder' ? !i.parent_folder_id : !i.folder_id);
    const newOrdre = (targetList.reduce((m, it) => Math.max(m, it.ordre ?? 0), -1) + 1);

    const original = items;
    // UI optimiste
    setItems(prev => {
      const draft = structuredClone(prev) as (Folder | Course)[];
      const popFrom = (arr: (Folder | Course)[]): MovableItem | null => {
        const i = arr.findIndex(i => i.id === itemId);
        if (i >= 0) return arr.splice(i, 1)[0] as MovableItem;
        for (const it of arr) if (it.type === 'folder') {
          const got = popFrom(it.children);
          if (got) return got;
        }
        return null;
      };
      const moved = popFrom(draft);
      if (!moved) return prev;

      if (!newParentId) {
        if (moved.type === 'folder') moved.parent_folder_id = null; else moved.folder_id = null;
        moved.ordre = newOrdre;
        draft.push(moved);
      } else {
        const tgt = findItemRecursive(newParentId, draft) as Folder | null;
        if (!tgt || tgt.type !== 'folder') return prev;
        if (moved.type === 'folder') moved.parent_folder_id = newParentId; else moved.folder_id = newParentId;
        moved.ordre = newOrdre;
        tgt.children.push(moved);
      }

      if (currentFolder) {
        const fresh = findItemRecursive(currentFolder.id, draft);
        setCurrentFolder(fresh && fresh.type === 'folder' ? fresh : null);
        if (!fresh) setFolderHistory([]);
      }
      return draft;
    });

    try {
      const { error } = await supabase.from(tbl).update({ [fk]: newParentId, ordre: newOrdre }).eq('id', itemId);
      if (error) throw error;
    } catch (e: any) {
      console.error(e);
      alert(`Déplacement échoué : ${e.message}`);
      revertUiState(original);
    }
  };

  /* ---------- Rendu ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white/90">Chargement des parcours…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-red-300">{error}</div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Barre top */}
        <div
          ref={setRootDropRef}  // ✅ FIX 1 appliqué ici
          className={`sticky top-0 z-10 bg-purple-900/50 backdrop-blur border-b border-purple-700/50 ${isOverRoot && currentFolder ? 'ring-2 ring-purple-400' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={currentFolder ? handleBackToMain : () => setPage('gestionParcours')}
                className="flex items-center px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </button>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300">
                Mes Parcours
              </h1>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 w-5 h-5" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 rounded-lg bg-purple-800/50 border border-purple-700 text-white placeholder-purple-300"
                placeholder={currentFolder ? `Rechercher dans « ${currentFolder.nom} »…` : 'Rechercher…'}
              />
            </div>
          </div>

          {/* Breadcrumb */}
          {folderHistory.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 pb-3">
              <div className="flex items-center text-sm text-purple-200 flex-wrap gap-1">
                <BreadcrumbItem label="Racine" onNavigate={() => { setCurrentFolder(null); setFolderHistory([]); }} onMoveItem={(id, old) => handleMoveItem(id, old, null)} isCurrent={!currentFolder} />
                {folderHistory.map((c, i) => (
                  <React.Fragment key={c.id}>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                    <BreadcrumbItem label={c.nom} onNavigate={() => handleNavigateToFolder(c.id)} onMoveItem={(id, old) => handleMoveItem(id, old, c.id)} isCurrent={i === folderHistory.length - 1} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {!currentFolder && (
            <div className="mb-6">
              <button
                onClick={() => handleAddFolder(null)}
                className="flex items-center px-5 py-3 rounded bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white hover:opacity-95"
              >
                <Plus className="w-5 h-5 mr-2" /> Nouveau dossier
              </button>
            </div>
          )}

          {currentFolder ? (
            <FolderContentPage
              folder={currentFolder}
              onAddFolder={handleAddFolder}
              onDeleteFolder={handleDeleteFolder}
              onMoveItem={handleMoveItem}
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              onAddCourse={handleAddCourse}
              onOpenFolder={handleOpenFolder}
              onUpdateFolder={handleUpdateFolder}
              onClickCourse={handleCourseClick}
              searchTerm={searchTerm}
              handleMoveItemInList={handleMoveItemInList}
            />
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-purple-900/40 border border-purple-700 rounded-xl">
                  <FolderOpenIcon className="w-12 h-12 mx-auto text-purple-400 mb-2" />
                  <p className="text-purple-200">Aucun dossier ou parcours.</p>
                  <button
                    onClick={() => handleAddFolder(null)}
                    className="mt-4 px-4 py-2 rounded bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1 inline" /> Créer un dossier
                  </button>
                </div>
              ) : filteredItems.map((it, idx) =>
                it.type === 'folder' ? (
                  <FolderItem
                    key={it.id}
                    folder={it}
                    index={idx}
                    onAddFolder={handleAddFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onMoveItem={handleMoveItem}
                    onOpenFolder={handleOpenFolder}
                    onUpdateFolder={handleUpdateFolder}
                    onClickCourse={handleCourseClick}
                    handleMoveItemInList={handleMoveItemInList}
                  />
                ) : (
                  <CourseItem
                    key={it.id}
                    course={it}
                    parentFolderId={null}
                    index={idx}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteCourse}
                    onClickCourse={handleCourseClick}
                    handleMoveItemInList={handleMoveItemInList}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

/* =========================
        BREADCRUMB CHIP
========================= */
const BreadcrumbItem: React.FC<{
  label: string;
  onNavigate: () => void;
  onMoveItem: (itemId: string, oldParentId: string | null) => void;
  isCurrent: boolean;
}> = ({ label, onNavigate, onMoveItem, isCurrent }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.COURSE, ItemTypes.FOLDER],
    drop: (item: any) => onMoveItem(item.id, item.parentFolderId ?? null),
    collect: (m) => ({ isOver: m.isOver() }),
  }));

  // ✅ FIX 2 : callback-ref au lieu de ref={drop}
  const setDropRef = React.useCallback((node: HTMLButtonElement | null) => {
    if (node) drop(node);
  }, [drop]);

  return (
    <button
      ref={setDropRef}
      onClick={(e) => { e.stopPropagation(); onNavigate(); }}
      className={`px-3 py-1 rounded ${isCurrent ? 'bg-white/10 text-white font-semibold' : 'hover:bg-white/10'} ${isOver ? 'ring-2 ring-purple-400' : ''}`}
    >
      {label}
    </button>
  );
};

export default MesParcours;
