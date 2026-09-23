
import { pool } from "../db/pool.js";
export interface User {
    id:number,
    username:string,
    password_hash:string,
    avatar_url: string | null;
    bio: string | null;
    created_at: Date;
}

export type publicUser = Omit<User,'password_hash'>;

export async function createUser(
    username:string,
    passwordHash:string,
):Promise<User> {
    const result = await pool.query<User>(
        `INSERT INTO users (username, password_hash)
        VALUES ($1, $2)
        RETURNING *`,
        [username, passwordHash]
    );

    return result.rows[0];
};

export async function findUserByUsername(username:string): Promise<User | null> {
    const result = await pool.query<User>(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0] ?? null;
};

export async function findPublicUserByUsername(username: string): Promise<publicUser | null> {
  const result = await pool.query<publicUser>(
    `SELECT id, username, avatar_url, bio, created_at
     FROM users WHERE username = $1`,
    [username]
  );

  return result.rows[0] ?? null;
}

export async function findPublicUserById(id:number): Promise<publicUser | null> {
    const result = await pool.query<publicUser>(
        `SELECT id, username, avatar_url, bio, created_at
        FROM users WHERE id = $1`,
        [id]
    );

    return result.rows[0] ?? null;
}