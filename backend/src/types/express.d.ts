import type { tokenPayload } from "../utils/jwt.ts";

declare global {
    namespace Express {
        interface Request{
            user?: tokenPayload
        }
    }
}

export{}