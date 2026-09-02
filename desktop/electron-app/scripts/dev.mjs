// Wrapper agar Electron tidak dijalankan sebagai Node biasa.
// ELECTRON_RUN_AS_NODE=1 menyebabkan error: "Cannot read properties of undefined (reading 'isPackaged')"
delete process.env.ELECTRON_RUN_AS_NODE;

const { spawn } = await import('node:child_process');

const isWin = process.platform === 'win32';
const command = 'npx electron-vite dev ' + process.argv.slice(2).join(' ');
const child = spawn(command, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
child.on('exit', (code) => process.exit(code ?? 0));
