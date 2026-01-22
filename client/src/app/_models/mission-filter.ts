export interface MissionFilter {
  name?: string;
  status?: string;
}

export type MissionStatus = 'Open' | 'InProgress' | 'Completed' | 'Failed';
