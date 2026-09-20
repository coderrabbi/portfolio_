import { startEmailWorker } from './email.js';
import { app } from './app.js';
import { config } from './config.js';
import { db } from './db.js';
const server = app.listen(config.PORT, config.HOST, () =>
  console.log(`Portfolio API ready on http://127.0.0.1:${config.PORT}`),
);
const stopEmailWorker = startEmailWorker();
async function close() {
  server.close();
  await stopEmailWorker();
  await db.$disconnect();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
