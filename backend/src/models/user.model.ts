
import { pool } from "../db/pool.js";
export interface User {
    id:number,
    username:string,
    password_hash:string,
    avatar_url: string ;
    bio: string | null;
    created_at: Date;
    display_name: string;
}

export type publicUser = Omit<User,'password_hash'>;

export async function createUser(
  username: string,
  passwordHash: string
): Promise<User> {
  const result = await pool.query<User>(
      `INSERT INTO users (username, password_hash, avatar_url, display_name)
      VALUES ($1, $2, '/avatars/default.png', $1)
      RETURNING *`,
    [username, passwordHash]
  );

  return result.rows[0]!;
}

export async function findUserByUsername(username:string): Promise<User | null> {
    const result = await pool.query<User>(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0] ?? null;
};

export async function findPublicUserByUsername(username: string): Promise<publicUser | null> {
  const result = await pool.query<publicUser>(
    `SELECT id, username, avatar_url, bio, created_at,display_name
     FROM users WHERE username = $1`,
    [username]
  );

  return result.rows[0] ?? null;
}

export async function findPublicUserById(id:number): Promise<publicUser | null> {
    const result = await pool.query<publicUser>(
        `SELECT id, username, avatar_url, bio, created_at,display_name
        FROM users WHERE id = $1`,
        [id]
    );

    return result.rows[0] ?? null;
}

export async function updateUserProfile(
  id: number,
  bio: string | null,
  avatarUrl: string | null,
  displayName: string | null
): Promise<publicUser | null> {
  const result = await pool.query<publicUser>(
    `UPDATE users
     SET bio          = COALESCE($2, bio),
         avatar_url   = COALESCE($3, avatar_url),
         display_name = COALESCE($4, display_name)
     WHERE id = $1
     RETURNING id, username, display_name, avatar_url, bio, created_at`,
    [id, bio, avatarUrl, displayName]
  );

  return result.rows[0] ?? null;
}