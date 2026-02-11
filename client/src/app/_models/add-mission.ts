export interface AddMission {
  name: string;
  description?: string;
  max_crew?: number;
  scheduled_at?: Date;
  location?: string;
  category?: string;
}
