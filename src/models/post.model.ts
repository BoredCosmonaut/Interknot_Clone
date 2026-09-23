import { pool } from "../db/pool.js";

export interface Post {
    id: number;
    author_id: number;
    title: string;
    content: string;
    image_url: string;
    created_at: Date;
}

export interface PostWithAuthor extends Post {
    author_username:string;
    author_avatar_url: string | null;
}


export async function createPost(
    authorId: number,
    title: string,
    content: string,
    imageUrl: string | null = null
): Promise<Post> {
    const result = await pool.query<Post>(
        `INSERT INTO posts (author_id, title, content, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [authorId, title, content, imageUrl]
    );

    return result.rows[0]!;
}

export async function getFeed(
    limit = 20,
    offset = 0
): Promise<PostWithAuthor[]> {
    const result = await pool.query<PostWithAuthor>(
        `SELECT
        p.id,
        p.author_id,
        p.title,
        p.content,
        p.image_url,
        p.created_at,
        u.username   AS author_username,
        u.avatar_url AS author_avatar_url
        FROM posts p
        JOIN users u ON u.id = p.author_id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    return result.rows;
}

export async function getPostById(id:number): Promise<PostWithAuthor | null> {
    const result = await pool.query<PostWithAuthor>(
        `SELECT
        p.id,
        p.author_id,
        p.title,
        p.content,
        p.image_url,
        p.created_at,
        u.username   AS author_username,
        u.avatar_url AS author_avatar_url
        FROM posts p
        JOIN users u ON u.id = p.author_id
        WHERE p.id = $1`,
        [id]
    )

    return result.rows[0] ?? null;
};

export async function getPostsByAuthor(authorId:number,limit = 20,offset = 0): Promise<PostWithAuthor[]> {
    const result = await pool.query<PostWithAuthor>(
        `SELECT
        p.id,
        p.author_id,
        p.title,
        p.content,
        p.image_url,
        p.created_at,
        u.username   AS author_username,
        u.avatar_url AS author_avatar_url
        FROM posts p
        JOIN users u ON u.id = p.author_id
        WHERE p.author_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3`,
        [authorId,limit,offset]
    );

    return result.rows;
}