export interface MissionComment {
  id: number;
  mission_id: number;
  brawler_id: number;
  brawler_display_name: string;
  brawler_avatar_url: string;
  content: string;
  created_at: Date;
}
