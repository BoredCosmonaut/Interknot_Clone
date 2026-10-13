export interface PostWithAuthor {
    id:number;
    author_id:number;
    title:string;
    content:string;
    image_url:string;
    created_at:string;
    author_username:string;
    author_avatar_url:string;
    author_display_name: string;
}


export interface MessageWithSender {
    id: number;
    sender_id: number;
    recipient_id: number;
    content: string;
    created_at: string;
    sender_username: string;
    sender_display_name: string;
    sender_avatar_url: string;
}

export interface ConversationSummary {
    other_id: number;
    other_username: string;
    other_display_name: string;
    other_avatar_url: string;
    last_content: string;
    last_created_at: string;
    last_sender_id: number;
}