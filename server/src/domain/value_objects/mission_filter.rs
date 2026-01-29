use serde::{Deserialize, Serialize};

use crate::domain::value_objects::mission_statuses::MissionStatuses;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct MissionFilter {
    pub name: Option<String>,
    pub status: Option<MissionStatuses>,
    /// ถ้าระบุค่านี้ จะกรองภารกิจที่:
    /// 1. ไม่ใช่ของ brawler คนนี้ (chief_id ≠ exclude_brawler_id)
    /// 2. brawler คนนี้ยังไม่ได้เข้าร่วม (ไม่อยู่ใน crew_memberships)
    pub exclude_brawler_id: Option<i32>,
}
