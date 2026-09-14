import { useState, useEffect, useCallback, useMemo } from 'react';
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

const STORAGE_KEY = 'campus_map_data_v3';
const LEGACY_STORAGE_KEYS = ['campus_map_data_v2', 'campus_map_data_v1'];
const ADMIN_SESSION_KEY = 'campus_map_admin_auth';
const DEFAULT_ADMIN_PASSWORD = 'admin';

const SUPABASE_REST_URL = 'https://ghcatqoczarmetojcpok.supabase.co/rest/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY2F0cW9jemFybWV0b2pjcG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjEyMzAsImV4cCI6MjEwNDYzNzIzMH0.shJ5MTeQ4fXQBAVrVPAeyoJWfNj8Lvx3HeYFIOYXeIM';

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
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        for (const legKey of LEGACY_STORAGE_KEYS) {
          const legRaw = localStorage.getItem(legKey);
          if (legRaw) {
            raw = legRaw;
            break;
          }
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.campuses) && Array.isArray(parsed.locations)) {
          // If stored data is missing any of the official locations or images from DEFAULT_CAMPUS_DATA, merge them in
          const parsedLocMap = new Map<string, any>(parsed.locations.map((l: any) => [l.id, l]));
          // Keep user custom added locations ('loc-') and update existing official locations with new official data
          const mergedLocations: LocationItem[] = DEFAULT_CAMPUS_DATA.locations.map((defLoc) => {
            const userLoc = parsedLocMap.get(defLoc.id) as any;
            if (userLoc) {
              return {
                ...defLoc,
                // keep user custom edited fields if set
                ...userLoc,
                // ensure latest valid coordinates, polygon, and display_number
                polygon: defLoc.polygon || userLoc.polygon,
                pos_x: defLoc.pos_x ?? userLoc.pos_x,
                pos_y: defLoc.pos_y ?? userLoc.pos_y,
                category_id: userLoc.category_id || defLoc.category_id,
                display_number: userLoc.display_number ?? defLoc.display_number,
              };
            }
            return defLoc;
          });

          // Add any custom locations created by user
          parsed.locations.forEach((l: any) => {
            if (l.id.startsWith('loc-')) {
              mergedLocations.push(l);
            }
          });

          const existingImgIds = new Set((parsed.location_images || []).map((i: any) => i.id));
          const missingImgs = DEFAULT_CAMPUS_DATA.location_images.filter((i) => !existingImgIds.has(i.id));

          db = {
            ...parsed,
            campuses: sortCampuses(DEFAULT_CAMPUS_DATA.campuses),
            categories: DEFAULT_CAMPUS_DATA.categories,
            locations: mergedLocations,
            location_images: [...(parsed.location_images || []), ...missingImgs],
            institution_info: DEFAULT_CAMPUS_DATA.institution_info || parsed.institution_info,
            board_members: DEFAULT_CAMPUS_DATA.board_members || parsed.board_members,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
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

  const replaceLocationImage = useCallback((imageId: string, newImageUrl: string, newTitle?: string) => {
    globalDb = {
      ...globalDb,
      location_images: globalDb.location_images.map((img) => {
        if (img.id === imageId) {
          return {
            ...img,
            image_url: newImageUrl,
            title: newTitle !== undefined ? newTitle : img.title,
          };
        }
        return img;
      }),
    };
    notifyListeners();
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

  const currentCampus = useMemo(
    () => db.campuses.find((c) => c.id === selectedCampusId) || db.campuses[0],
    [db.campuses, selectedCampusId]
  );
  const campusLocations = useMemo(
    () => db.locations.filter((l) => l.campus_id === selectedCampusId),
    [db.locations, selectedCampusId]
  );
  const selectedLocation = useMemo(
    () => db.locations.find((l) => l.id === selectedLocationId) || null,
    [db.locations, selectedLocationId]
  );
  const hoveredLocation = useMemo(
    () => db.locations.find((l) => l.id === hoveredLocationId) || null,
    [db.locations, hoveredLocationId]
  );

  const getLocationImages = useCallback(
    (locationId: string): LocationImage[] => {
      return db.location_images
        .filter((img) => img.location_id === locationId)
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    [db.location_images]
  );

  const syncWithRemoteServer = useCallback(async (): Promise<{
    success: boolean;
    message: string;
    newImagesCount?: number;
    totalImages?: number;
  }> => {
    try {
      const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      };

      const [campusesRes, categoriesRes, locationsRes, imagesRes, infoRes, boardRes] = await Promise.all([
        fetch(`${SUPABASE_REST_URL}/campuses?select=*&limit=100`, { headers }),
        fetch(`${SUPABASE_REST_URL}/categories?select=*&limit=100`, { headers }),
        fetch(`${SUPABASE_REST_URL}/locations?select=*&limit=1000`, { headers }),
        fetch(`${SUPABASE_REST_URL}/location_images?select=*&limit=2000`, { headers }),
        fetch(`${SUPABASE_REST_URL}/institution_info?select=*&limit=100`, { headers }),
        fetch(`${SUPABASE_REST_URL}/board_members?select=*&limit=100`, { headers }),
      ]);

      if (!locationsRes.ok || !imagesRes.ok) {
        throw new Error('Không thể kết nối đến máy chủ cơ sở dữ liệu.');
      }

      const [campuses, categories, locations, location_images, institution_info, board_members] = await Promise.all([
        campusesRes.json(),
        categoriesRes.json(),
        locationsRes.json(),
        imagesRes.json(),
        infoRes.json(),
        boardRes.json(),
      ]);

      // Normalize locations (assign default category if missing and ensure valid display_number)
      const defaultCatId = categories.find((c: any) => c.name.includes('Các khu'))?.id || categories[0]?.id;
      const normalizedLocations = locations.map((loc: any, idx: number) => ({
        ...loc,
        category_id: loc.category_id || defaultCatId,
        display_number: loc.display_number != null ? loc.display_number : idx + 1,
      }));

      // Preserve user custom additions (ids starting with 'loc-' or 'img-')
      const customLocations = globalDb.locations.filter((l) => l.id.startsWith('loc-'));
      const customImages = globalDb.location_images.filter((img) => img.id.startsWith('img-'));

      const mergedLocations = [...normalizedLocations, ...customLocations];
      const mergedImages = [...location_images, ...customImages];

      const beforeImgCount = globalDb.location_images.length;
      globalDb = {
        ...globalDb,
        campuses: sortCampuses(campuses),
        categories,
        locations: mergedLocations,
        location_images: mergedImages,
        institution_info: institution_info.length > 0 ? institution_info : globalDb.institution_info,
        board_members: board_members.length > 0 ? board_members : globalDb.board_members,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(globalDb));
      }

      notifyListeners();
      const diff = mergedImages.length - beforeImgCount;
      return {
        success: true,
        message: `Đã đồng bộ thành công! Hiện có ${mergedImages.length} ảnh và ${mergedLocations.length} khu vực.`,
        newImagesCount: diff > 0 ? diff : 0,
        totalImages: mergedImages.length,
      };
    } catch (err: any) {
      console.error('Remote sync failed:', err);
      return {
        success: false,
        message: err?.message || 'Đồng bộ thất bại, vui lòng kiểm tra kết nối mạng.',
      };
    }
  }, []);

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
    replaceLocationImage,
    deleteLocationImage,
    setCoverImage,
    reorderImages,
    updateLocation,
    addLocation,
    deleteLocation,
    resetToDefault,
    syncWithRemoteServer,
    exportData,
    importData,
    getLocationImages,
  };
}
