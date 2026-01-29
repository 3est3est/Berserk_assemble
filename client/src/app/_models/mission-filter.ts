export interface MissionFilter {
  name?: string;
  status?: MissionStatus;
  /** ถ้าระบุ จะกรองภารกิจที่ไม่ใช่ของตัวเอง และยังไม่ได้เข้าร่วม */
  exclude_brawler_id?: number;
}

export type MissionStatus = 'Open' | 'InProgress' | 'Completed' | 'Failed' | '';
