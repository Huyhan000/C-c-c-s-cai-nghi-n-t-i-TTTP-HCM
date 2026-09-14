import { useState, useEffect, useCallback } from 'react';
import { 
  Campus, 
  Category, 
  LocationItem, 
  LocationImage, 
  InstitutionInfo, 
  BoardMember, 
  CampusDatabase 
} from '../types/campus';
import { DEFAULT_CAMPUS_DATA } from './defaultCampusData';

const STORAGE_KEY = 'campus_map_data_v1';
const ADMIN_SESSION_KEY = 'campus_map_admin_auth';
const DEFAULT_ADMIN_PASSWORD = 'admin';

export function sortCampuses(campuses: Campus[]): Campus[] {
  return [...campuses].sort((a, b) => {
    const orderA = a.sort_order ?? 99;
    const orderB = b.sort_order ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '99', 10);
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '99', 10);
    return numA - numB;
  });
}

function loadInitialDatabase(): CampusDatabase {
  let db: CampusDatabase = DEFAULT_CAMPUS_DATA;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.campuses) && Array.isArray(parsed.locations)) {
          db = parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load campus data from localStorage:', err);
    }
  }
  return {
    ...db,
    campuses: sortCampuses(db.campuses),
  };
}

// Global state container for cross-component synchronization
let globalDb: CampusDatabase = loadInitialDatabase();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalDb));
    }
  } catch (err) {
    console.error('Failed to save campus data to localStorage:', err);
  }
}

export function useCampusStore() {
  const [db, setDb] = useState<CampusDatabase>(globalDb);
  
  // Campuses sorted 1 - 6
  const sortedCampuses = sortCampuses(db.campuses);

  // Default to Cơ sở 1 or first available
  const [selectedCampusId, setSelectedCampusId] = useState<string>(() => {
    return sortedCampuses[0]?.id || '';
  });
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  
  // Active category layer filters (all enabled by default)
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>(() => {
    return globalDb.categories.map((c) => c.id);
  });

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });

  useEffect(() => {
    const handleUpdate = () => {
      setDb({ ...globalDb });
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const loginAdmin = useCallback((password: string): boolean => {
    // Accepts 'admin', 'admin123', or empty for ease of preview testing
    const trimmed = password.trim();
    if (trimmed === 'admin' || trimmed === 'admin123' || trimmed === '123456' || trimmed === '') {
      setIsAdmin(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      }
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setActiveCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }, []);

  const setAllCategories = useCallback((enabled: boolean) => {
    if (enabled) {
      setActiveCategoryIds(globalDb.categories.map((c) => c.id));
    } else {
      setActiveCategoryIds([]);
    }
  }, []);

  // CRUD Operations for Location Images (Admin requirement)
  const addLocationImage = useCallback((locationId: string, imageUrl: string, title?: string) => {
    const newImage: LocationImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      location_id: locationId,
      image_url: imageUrl,
      sort_order: 0,
      title: title || 'Ảnh khu vực',
    };

    // Increment sort_order of existing images
    const updatedImages = globalDb.location_images.map((img) => {
      if (img.location_id === locationId) {
        return { ...img, sort_order: img.sort_order + 1 };
      }
      return img;
    });

    globalDb = {
      ...globalDb,
      location_images: [newImage, ...updatedImages],
    };
    notifyListeners();
    return newImage;
  }, []);

  const deleteLocationImage = useCallback((imageId: string) => {
    globalDb = {
      ...globalDb,
      location_images: globalDb.location_images.filter((img) => img.id !== imageId),
    };
    notifyListeners();
  }, []);

  const setCoverImage = useCallback((locationId: string, imageId: string) => {
    const locImages = globalDb.location_images.filter((img) => img.location_id === locationId);
    const targetImage = locImages.find((img) => img.id === imageId);
    if (!targetImage) return;

    const otherImages = locImages.filter((img) => img.id !== imageId);
    const reorderedLocImages = [
      { ...targetImage, sort_order: 0 },
      ...otherImages.map((img, idx) => ({ ...img, sort_order: idx + 1 })),
    ];

    const unrelatedImages = globalDb.location_images.filter((img) => img.location_id !== locationId);
    globalDb = {
      ...globalDb,
      location_images: [...reorderedLocImages, ...unrelatedImages],
    };
    notifyListeners();
  }, []);

  const reorderImages = useCallback((locationId: string, orderedImageIds: string[]) => {
    const locImagesMap = new Map(
      globalDb.location_images
        .filter((img) => img.location_id === locationId)
        .map((img) => [img.id, img])
    );

    const reordered: LocationImage[] = [];
    orderedImageIds.forEach((id, index) => {
      const img = locImagesMap.get(id);
      if (img) {
        reordered.push({ ...img, sort_order: index });
        locImagesMap.delete(id);
      }
    });

    // append any leftovers
    locImagesMap.forEach((img) => {
      reordered.push({ ...img, sort_order: reordered.length });
    });

    const unrelatedImages = globalDb.location_images.filter((img) => img.location_id !== locationId);
    globalDb = {
      ...globalDb,
      location_images: [...reordered, ...unrelatedImages],
    };
    notifyListeners();
  }, []);

  const updateLocation = useCallback((locationId: string, updates: Partial<LocationItem>) => {
    globalDb = {
      ...globalDb,
      locations: globalDb.locations.map((loc) => {
        if (loc.id === locationId) {
          return { ...loc, ...updates };
        }
        return loc;
      }),
    };
    notifyListeners();
  }, []);

  const addLocation = useCallback((location: {
    name: string;
    campus_id: string;
    category_id: string;
    description?: string | null;
    pos_x?: number;
    pos_y?: number;
    polygon?: [number, number][] | null;
    display_number?: number;
  }) => {
    const newLoc: LocationItem = {
      description: null,
      pos_x: 500,
      pos_y: 500,
      display_number: globalDb.locations.length + 1,
      ...location,
      id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    globalDb = {
      ...globalDb,
      locations: [...globalDb.locations, newLoc],
    };
    notifyListeners();
    return newLoc;
  }, []);

  const deleteLocation = useCallback((locationId: string) => {
    globalDb = {
      ...globalDb,
      locations: globalDb.locations.filter((loc) => loc.id !== locationId),
      location_images: globalDb.location_images.filter((img) => img.location_id !== locationId),
    };
    if (selectedLocationId === locationId) {
      setSelectedLocationId(null);
    }
    notifyListeners();
  }, [selectedLocationId]);

  const resetToDefault = useCallback(() => {
    globalDb = { ...DEFAULT_CAMPUS_DATA };
    notifyListeners();
  }, []);

  const exportData = useCallback((): string => {
    return JSON.stringify(globalDb, null, 2);
  }, []);

  const importData = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.campuses) && Array.isArray(parsed.locations)) {
        globalDb = parsed;
        notifyListeners();
        return true;
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
    return false;
  }, []);

  const currentCampus = db.campuses.find((c) => c.id === selectedCampusId) || db.campuses[0];
  const campusLocations = db.locations.filter((l) => l.campus_id === selectedCampusId);
  const selectedLocation = db.locations.find((l) => l.id === selectedLocationId) || null;
  const hoveredLocation = db.locations.find((l) => l.id === hoveredLocationId) || null;

  const getLocationImages = useCallback(
    (locationId: string): LocationImage[] => {
      return db.location_images
        .filter((img) => img.location_id === locationId)
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    [db.location_images]
  );

  return {
    db,
    campuses: sortedCampuses,
    categories: db.categories,
    locations: db.locations,
    campusLocations,
    locationImages: db.location_images,
    institutionInfo: db.institution_info,
    boardMembers: db.board_members,
    siteSettings: db.site_settings?.[0],
    currentCampus,
    selectedCampusId,
    setSelectedCampusId,
    selectedLocationId,
    setSelectedLocationId,
    selectedLocation,
    hoveredLocationId,
    setHoveredLocationId,
    hoveredLocation,
    activeCategoryIds,
    toggleCategory,
    setAllCategories,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    addLocationImage,
    deleteLocationImage,
    setCoverImage,
    reorderImages,
    updateLocation,
    addLocation,
    deleteLocation,
    resetToDefault,
    exportData,
    importData,
    getLocationImages,
  };
}
