export type VehicleStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'retired';
export type VehicleCategory = 'economy' | 'comfort' | 'premium' | 'lux' | 'xl' | 'wav' | 'electric';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'cng' | 'lpg';

export interface Vehicle {
  id: string;
  driver_id: string;
  driver_name?: string;
  status: VehicleStatus;
  category: VehicleCategory;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  vin?: string;
  fuel_type: FuelType;
  max_passengers: number;
  has_child_seat: boolean;
  has_wheelchair_access: boolean;
  has_wifi: boolean;
  has_charger: boolean;
  pet_friendly: boolean;
  luggage_capacity: number;
  registration_photo_url?: string;
  insurance_photo_url?: string;
  front_photo_url?: string;
  back_photo_url?: string;
  side_photo_url?: string;
  interior_photo_url?: string;
  insurance_expiry?: string;
  registration_expiry?: string;
  inspection_expiry?: string;
  rejection_reason?: string;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleStats {
  total_vehicles: number;
  pending_review: number;
  approved_vehicles: number;
  suspended_vehicles: number;
  expiring_insurance: number;
  expiring_registration: number;
}

export interface ReviewVehicleRequest {
  approved: boolean;
  rejection_reason?: string;
}

export interface SuspendVehicleRequest {
  reason: string;
}

export interface VehicleListParams {
  status?: VehicleStatus;
  category?: VehicleCategory;
  driver_id?: string;
  search?: string;
  year_from?: number;
  year_to?: number;
  sort_by?: 'created_at' | 'updated_at';
  sort_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
