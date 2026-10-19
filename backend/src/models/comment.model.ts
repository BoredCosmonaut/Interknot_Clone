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
    author_avatar_utl:string,
    author_display_name: string;
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

    return result.rows[0]!;
};

export async function getCommentsByPost(postId:number): Promise<CommentWithAuthor[]> {
    const result = await pool.query<CommentWithAuthor>(
        `SELECT
        c.id,
        c.post_id,
        c.author_id,
        c.content,
        c.created_at,
        c.edited_at,
        u.username   AS author_username,
        u.avatar_url AS author_avatar_url,
        u.display_name AS author_display_name
        FROM comments c
        JOIN users u ON u.id = c.author_id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC`,
        [postId]
    );

    return result.rows;
}

export async function deleteComment(id:number,authorId:number):Promise<boolean> {
    const result = await pool.query(
        `DELETE FROM comments WHERE id = $1 AND author_id = $2`,
        [id, authorId]
    );

    return result.rowCount === 1;
}

export async function updateComment(id:number,authorId:number,content:string): Promise<Comment | null> {
    const result = await pool.query<Comment>(
        `UPDATE comments
        SET content = $3, edited_at = NOW()
        WHERE id = $1 AND author_id = $2
        RETURNING *`,
        [id, authorId, content]
    );

    return result.rows[0] ?? null;
}

export async function deleteCommentAsAdmin(id:number):Promise<boolean> {
    const result = await pool.query(
        `DELETE FROM comments WHERE id = $1`,
        [id]
    );
    return result.rowCount === 1;
}

export async function getCommentById(id:number): Promise<Comment | null> {
    const result = await pool.query<Comment>(
        `SELECT * FROM comments WHERE id = $1`,
        [id]
    )

    return result.rows[0] ?? null;
}