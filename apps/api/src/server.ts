import { startEmailWorker } from './email.js';
import { app } from './app.js';
import { db } from './db.js';
const port = Number(process.env.PORT) || 4000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Portfolio API ready on port ${port}`);
});
const stopEmailWorker = startEmailWorker();
async function close() {
  server.close();
  await stopEmailWorker();
  await db.$disconnect();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
