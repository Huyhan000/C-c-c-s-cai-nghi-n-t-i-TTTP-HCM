export interface Campus {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  image_width: number;
  image_height: number;
  sort_order: number;
  campus_area?: [number, number][] | null;
  is_visible?: boolean;
  created_at?: string;
  [key: string]: any;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  [key: string]: any;
}

export interface CustomField {
  label: string;
  value: string;
}

export interface LocationItem {
  id: string;
  campus_id: string;
  category_id: string;
  name: string;
  description: string | null;
  pos_x: number;
  pos_y: number;
  polygon?: [number, number][] | null;
  display_number: number;
  custom_fields?: CustomField[];
  manager_id?: string | null;
  created_at?: string;
  [key: string]: any;
}

export interface LocationImage {
  id: string;
  location_id: string;
  image_url: string;
  sort_order: number;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface InstitutionInfo {
  id: string;
  campus_id: string;
  name: string;
  address?: string;
  phone?: string;
  established?: string;
  description?: string;
  banner_url?: string;
  slogan?: string;
  email?: string;
  [key: string]: any;
}

export interface BoardMember {
  id: string;
  campus_id: string;
  name: string;
  role?: string;
  department?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  sort_order?: number;
  title?: string;
  created_at?: string;
  [key: string]: any;
}

export interface SiteSetting {
  id: string;
  name: string;
  subtitle?: string;
  logo_url?: string;
  logo_height?: number;
  updated_at?: string;
  [key: string]: any;
}

export interface CampusDatabase {
  campuses: Campus[];
  categories: Category[];
  locations: LocationItem[];
  location_images: LocationImage[];
  institution_info: InstitutionInfo[];
  board_members: BoardMember[];
  site_settings?: SiteSetting[];
  [key: string]: any;
}
