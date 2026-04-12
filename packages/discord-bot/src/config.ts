import dotenv from 'dotenv';
dotenv.config();

export const config = {
    discordToken: process.env.DISCORD_BOT_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info',
    allowedUserIds: process.env.ALLOWED_USER_IDS
        ? new Set(process.env.ALLOWED_USER_IDS.split(',').map(id => id.trim()).filter(Boolean))
        : null,
};
