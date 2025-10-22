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

## Demo: "Resumir selección" (MVP)

Requisitos:

- Suministrá tu propia clave de OpenAI (BYO-key).

Configuración:

- Opción A: archivo `.env.local` con:

  ```bash
  VITE_OPENAI_API_KEY=sk-xxxxx
  ```

- Opción B: en la consola del navegador antes de ejecutar la acción:

  ```js
  window.OPENAI_API_KEY = 'sk-xxxxx'
  ```

Uso:

1. Seleccioná 1–3 nodos de texto en el canvas (que tengan contenido).
2. En el panel derecho "Automatizar", clic en "Resumir selección".
3. El panel "Jobs" (abajo a la derecha) muestra el estado; al finalizar, verás un nuevo nodo de texto con título, resumen y tags.

Notas:

- Modelo por defecto: `gpt-4o-mini`. Timeout: 20s.
- En caso de error (key faltante, CORS o formato), el job termina en `error` y se muestra el mensaje.
