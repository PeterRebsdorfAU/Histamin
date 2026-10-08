// Starter backend (port 3001) og Vite dev-server (port 5173) samtidig.
import { spawn } from 'node:child_process';

const procs = [
  spawn('node', ['--watch', 'server/index.js'], { stdio: 'inherit', env: { ...process.env, PORT: '3001' }, shell: true }),
  spawn('npx', ['vite'], { stdio: 'inherit', shell: true }),
];

const stop = () => { procs.forEach((p) => p.kill()); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
