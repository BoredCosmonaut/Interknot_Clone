import { pool } from "../db/pool.js";

export interface Notification {
    id:number;
    user_id:number;
    actor_id:number;
    type:string;
    post_id:number;
    created_at:Date;
    read_at:Date | null;
};

export interface NotificationWithActor extends Notification {
    actor_usernmae:string;
    actor_display_name:string;
    actor_avatar_url:string;
    post_title:string;
};


export async function createNotification(userId:number,actorId:number,type:string,postId:number | null): Promise<Notification> {
    const result = await pool.query<Notification>(
        `INSERT INTO notifications (user_id, actor_id, type, post_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [userId, actorId, type, postId]
    );
    return result.rows[0]!;
};

export async function getNotifications(userId:number,limit= 20): Promise<NotificationWithActor[]> {
    const result = await pool.query<NotificationWithActor>(
        `SELECT
        n.id,
        n.user_id,
        n.actor_id,
        n.type,
        n.post_id,
        n.created_at,
        n.read_at,
        u.username     AS actor_username,
        u.display_name AS actor_display_name,
        u.avatar_url   AS actor_avatar_url,
        p.title        AS post_title
        FROM notifications n
        JOIN users u ON u.id = n.actor_id
        LEFT JOIN posts p ON p.id = n.post_id
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
        LIMIT $2`,
        [userId, limit]
    );

    return result.rows;
}

export async function getUnreadNotificationCount(userId:number): Promise<number> {
    const result = await pool.query<{count:string}>(
        `SELECT COUNT(*) AS count
        FROM notifications
        WHERE user_id = $1 AND read_at IS NULL`,
        [userId]
    );
    return Number(result.rows[0]!.count);
}

export async function markNotificationsRead(userId:number): Promise<void> {
    await pool.query(
        `UPDATE notifications
        SET read_at = NOW()
        WHERE user_id = $1 AND read_at IS NULL`,
        [userId]
    );
}