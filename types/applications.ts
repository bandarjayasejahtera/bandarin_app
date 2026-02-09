export type ApplicationStatus = 'pending' | 'process' | 'review' | 'completed' | 'cancelled';

export type Application = {
  id: string;
  user_id: string;
  service_id: string; // Bukan product_id lagi
  status: ApplicationStatus;
  company_name: string;
  company_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relasi (Join)
  profiles?: {
    full_name: string;
    email: string;
  };
  services?: { // Bukan products
    name: string;
    price: number;
  };
};