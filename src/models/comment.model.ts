import { pool } from "../db/pool.js";

export interface Comment{
    id:number,
    post_id:number,
    author_id:number,
    content:string,
    created_at:Date
};


export interface CommentWithAuthor extends Comment {
    author_username:string,
    author_avatar_utl:string | null
}

export async function createComment(
    postId:number,
    authorId:number,
    content:string
): Promise<Comment> {
    const result = await pool.query<Comment>(
        `INSERT INTO comments (post_id, author_id, content)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [postId, authorId, content]
    );

    return result.rows[0];
};

export async function getCommentsByPost(postId:number): Promise<CommentWithAuthor[]> {
    const result = await pool.query<CommentWithAuthor>(
        `SELECT
        c.id,
        c.post_id,
        c.author_id,
        c.content,
        c.created_at,
        u.username   AS author_username,
        u.avatar_url AS author_avatar_url
        FROM comments c
        JOIN users u ON u.id = c.author_id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC`,
        [postId]
    );

    return result.rows;
}