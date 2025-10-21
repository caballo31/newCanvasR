# Risspo Web (Vite + React)

## Run in WSL

If you prefer WSL (recommended):

```bash
# Go to the project (WSL path)
cd /mnt/c/Users/versa/Desktop/Proyectos/Risspo/apps/web

# Install deps (only once per environment)
npm ci

# Start dev server
npm run dev
# If HMR/file watching is flaky under /mnt/c, use polling:
# npm run dev:wsl
```

Then open:
- Local: http://localhost:3000/

### Tips
- Working from `/mnt/c/...` is fine. If you notice slow/unstable file watching, prefer `npm run dev:wsl` (uses CHOKIDAR_USEPOLLING) or consider cloning the repo inside the Linux filesystem (e.g. `~/projects/...`).
- If the port is busy, either stop the other process or run with a different port:
  ```bash
  VITE_PORT=5173 npm run dev
  ```
- To reinstall cleanly after dependency changes:
  ```bash
  rm -rf node_modules package-lock.json
  npm ci
  ```

## Common issues
- `vite: not found`: Install dependencies first with `npm ci` in the same environment (WSL vs Windows). `node_modules` from Windows aren't valid in WSL.
- `npm: command not found` in PowerShell: Install Node.js in Windows or run everything from WSL.

## Native WSL filesystem (recommended)

For best performance, clone and run the repo inside WSL's native FS instead of `/mnt/c`:

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/caballo31/risspo-canvas.git
cd risspo-canvas/apps/web
npm ci
npm run dev # polling is not needed on native FS
```

If you open the repo via VS Code Remote - WSL, you can run the task:
- Terminal > Run Task > "Web: Dev (Remote WSL)"

See `MIGRATE_WSL.md` at the repo root for a complete migration guide.
