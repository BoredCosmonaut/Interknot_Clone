import { pool } from "../db/pool.js";

export interface Message {
    id:number;
    sender_id:number;
    recipient_id:number;
    content:string;
    created_at:Date;
}

export interface MessageWithSender extends Message {
    sender_username:string;
    sender_avatar_url:string;
}


export async function createMessage(
    senderId:number,
    recipientId:number,
    content:string
): Promise<Message> {
    const result = await pool.query<Message>(
    `INSERT INTO messages (sender_id, recipient_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [senderId, recipientId, content]
    );

    return result.rows[0];
};

export async function getConversation(
    userA:number,
    userB:number,
    limit: 50,
    offset:0
): Promise<MessageWithSender[]> {
    const result = await pool.query<MessageWithSender>(
    `SELECT
        m.id,
        m.sender_id,
        m.recipient_id,
        m.content,
        m.created_at,
        u.username   AS sender_username,
        u.avatar_url AS sender_avatar_url
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE (m.sender_id = $1 AND m.recipient_id = $2)
            OR (m.sender_id = $2 AND m.recipient_id = $1)
        ORDER BY m.created_at DESC
        LIMIT $3 OFFSET $4`,
        [userA, userB, limit, offset]
    );
    return result.rows;
}