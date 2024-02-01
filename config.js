import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
const CONFIG_FILE = '/opt/newscred/cms-12-middleware.env';
dotenv.config({
  path: fs.existsSync(CONFIG_FILE)
    ? CONFIG_FILE
    : path.resolve(process.cwd(), '.env')
});
