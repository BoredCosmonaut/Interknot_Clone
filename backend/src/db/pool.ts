import 'dotenv/config';
import pkg from 'pg';
const {Pool} = pkg;

const connectionString = process.env.DATABASE_URL

if(!connectionString) {
    throw new Error("failed to connect to the database ");
}

export const pool = new Pool({connectionString}); 