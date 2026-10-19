import { pool } from '../db/pool.js';

export type ReportTarget = 'post' | 'comment' | 'user' | 'message';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export interface Report {
  id: number;
  reporter_id: number;
  target_type: ReportTarget;
  target_id: number;
  target_user_id: number | null;
  reason: string;
  details: string | null;
  content_snapshot: string | null;
  snapshot_image: string | null;
  status: ReportStatus;
  resolved_by: number | null;
  resolved_at: Date | null;
  created_at: Date;
}

export interface ReportWithReporter extends Report {
  reporter_username: string;
  reporter_display_name: string;
  target_username: string | null;
  target_display_name: string | null;
}

export async function createReprot(
  reporterId: number,
  targetType: ReportTarget,
  targetId: number,
  reason: string,
  details: string | null,
  snapshot: string | null,
  snapshotImage: string | null,
  targetUserId: number | null
): Promise<Report> {
  const result = await pool.query<Report>(
    `INSERT INTO reports
       (reporter_id, target_type, target_id, reason, details,
        content_snapshot, snapshot_image, target_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [reporterId, targetType, targetId, reason, details, snapshot, snapshotImage, targetUserId]
  );

  return result.rows[0]!;
}

export async function getReports(
  status: ReportStatus = 'open'
): Promise<ReportWithReporter[]> {
  const result = await pool.query<ReportWithReporter>(
    `SELECT
       r.*,
       u.username     AS reporter_username,
       u.display_name AS reporter_display_name,
       t.username     AS target_username,
       t.display_name AS target_display_name
     FROM reports r
     JOIN users u ON u.id = r.reporter_id
     LEFT JOIN users t ON t.id = r.target_user_id
     WHERE r.status = $1
     ORDER BY r.created_at DESC`,
    [status]
  );

  return result.rows;
}

export async function resolveReport(
  id: number,
  adminId: number,
  status: 'resolved' | 'dismissed'
): Promise<Report | null> {
  const result = await pool.query<Report>(
    `UPDATE reports
     SET status = $3, resolved_by = $2, resolved_at = NOW()
     WHERE id = $1 AND status = 'open'
     RETURNING *`,
    [id, adminId, status]
  );

  return result.rows[0] ?? null;
}