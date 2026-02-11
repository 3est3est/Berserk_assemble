export interface MissionFilter {
  name?: string;
  status?: MissionStatus;
  exclude_user_id?: string; // Correct type should be number but keep string for compatibility check
  category?: string;
  is_available?: boolean;
}

export type MissionStatus = 'Open' | 'InProgress' | 'Completed' | 'Failed' | '';
