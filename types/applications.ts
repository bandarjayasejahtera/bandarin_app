// types/applications.ts
export type ApplicationStatus = 'pending' | 'quoted' | 'process' | 'review' | 'completed' | 'cancelled';

export type Application = {
  id: string;
  user_id: string;
  service_id: string;
  status: ApplicationStatus;
  
  // Data dinamis dari form_data di DB
  form_data: Record<string, any>; 
  
  // Data CRM
  quoted_price?: number;
  assigned_agent_id?: string;
  admin_notes?: string;
  
  created_at: string;
  updated_at: string;
  
  // ... relasi lainnya
};