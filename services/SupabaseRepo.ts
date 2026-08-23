import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Incident, IncidentResponse, IncidentsRepo } from '../types';

/**
 * Supabase Repository Implementation (Optional)
 *
 * To use this, you need to:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Run the SQL schema in /database/supabase-schema.sql
 * 3. Set environment variables:
 *    - VITE_SUPABASE_URL=your-project-url
 *    - VITE_SUPABASE_ANON_KEY=your-anon-key
 */
export class SupabaseRepo implements IncidentsRepo {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getIncidents(): Promise<Incident[]> {
    const { data, error } = await this.supabase
      .from('incidents')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getIncidentById(id: string): Promise<Incident | undefined> {
    const { data, error } = await this.supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }

    return data;
  }

  async createIncident(incident: Omit<Incident, 'id' | 'createdAt'>): Promise<Incident> {
    const newIncident: Incident = {
      ...incident,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    const { data, error } = await this.supabase
      .from('incidents')
      .insert(newIncident)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getResponses(incidentId: string): Promise<IncidentResponse[]> {
    const { data, error } = await this.supabase
      .from('incident_responses')
      .select('*')
      .eq('incidentId', incidentId)
      .order('submittedAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async submitResponse(response: Omit<IncidentResponse, 'id' | 'submittedAt'>): Promise<IncidentResponse> {
    const newResponse: IncidentResponse = {
      ...response,
      id: crypto.randomUUID(),
      submittedAt: Date.now(),
    };

    const { data, error } = await this.supabase
      .from('incident_responses')
      .insert(newResponse)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateResponse(updatedResponse: IncidentResponse): Promise<void> {
    const { error } = await this.supabase
      .from('incident_responses')
      .update(updatedResponse)
      .eq('id', updatedResponse.id);

    if (error) throw error;
  }
}
