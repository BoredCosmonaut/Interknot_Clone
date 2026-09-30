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

export interface ConversationHistory {
    other_id:number;
    other_username:string;
    other_avatar_url:string;
    last_content:string;
    last_created_at:Date;
    last_sender_id:number;
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

    return result.rows[0]!;
};

export async function getConversation(
    userA:number,
    userB:number,
    limit:number,
    offset:number
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
    return result.rows.reverse();
}

export async function getInbox(userId:number): Promise<ConversationHistory[]> {
    const result = await pool.query<ConversationHistory>(
        `SELECT DISTINCT ON (other.id)
        other.id         AS other_id,
        other.username   AS other_username,
        other.avatar_url AS other_avatar_url,
        m.content        AS last_content,
        m.created_at     AS last_created_at,
        m.sender_id      AS last_sender_id
        FROM messages m
        JOIN users other
        ON other.id = CASE
                WHEN m.sender_id = $1 THEN m.recipient_id
                ELSE m.sender_id
            END
        WHERE m.sender_id = $1 OR m.recipient_id = $1
        ORDER BY other.id, m.created_at DESC`,
        [userId]
    );
    return result.rows.sort(
        (a,b)=> b.last_created_at.getTime() - a.last_created_at.getTime()
    )
};