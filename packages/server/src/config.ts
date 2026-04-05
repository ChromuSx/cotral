import * as path from 'path';
import * as dotenv from 'dotenv';

const packageRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(packageRoot, '.env') });

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '127.0.0.1',
    dbPath: process.env.DB_PATH || path.join(packageRoot, 'database.sqlite'),
    gtfsPath: process.env.GTFS_PATH || path.join(packageRoot, 'GTFS_COTRAL'),
    gtfsUrl: process.env.GTFS_URL || 'https://travel.mob.cotralspa.it:4443/GTFS/GTFS_COTRAL.zip',
    cotral: {
        baseURL: process.env.COTRAL_BASE_URL || 'http://travel.mob.cotralspa.it:7777/beApp',
        userId: process.env.COTRAL_USER_ID || '1BB73DCDAFA007572FC51E7407AB497C',
        delta: process.env.COTRAL_DELTA || '261',
    },
};
