export interface MissionFilter {
  name?: string;
  status?: MissionStatus;
  exclude_user_id?: number;
}

export type MissionStatus = 'Open' | 'InProgress' | 'Completed' | 'Failed' | '';
