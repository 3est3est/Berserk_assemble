export interface Notification {
  id: number;
  brawler_id: number;
  type: string;
  content: string;
  related_id?: number;
  is_read: boolean;
  created_at: string;
}
