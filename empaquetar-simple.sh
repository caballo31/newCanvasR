#!/bin/bash

echo "📦 Creando lista de archivos esenciales..."

# Crear archivo con la estructura completa
cat > ESTRUCTURA_COMPLETA.txt << 'STRUCT_EOF'
# RISSPO LIENZO - ESTRUCTURA COMPLETA
# Ejecutar desde: /mnt/c/Users/versa/Desktop/Proyectos/Risspo/apps/web

## ARCHIVOS DE CONFIGURACIÓN
=== package.json ===
$(cat package.json)

=== vite.config.ts ===
$(cat vite.config.ts)

=== tsconfig.json ===
$(cat tsconfig.json)

=== tailwind.config.js ===
$(cat tailwind.config.js)

=== index.html ===
$(cat index.html)

## ARCHIVOS FUENTE
=== src/main.tsx ===
$(cat src/main.tsx)

=== src/App.tsx ===
$(cat src/App.tsx)

=== src/App.css ===
$(cat src/App.css)

=== src/lib/utils.ts ===
$(cat src/lib/utils.ts)

=== src/lib/constants.ts ===
$(cat src/lib/constants.ts)

=== src/types/canvas.ts ===
$(cat src/types/canvas.ts)

=== src/stores/useCanvasStore.ts ===
$(cat src/stores/useCanvasStore.ts)

=== src/components/ui/button.tsx ===
$(cat src/components/ui/button.tsx)

=== src/components/ui/toolbar.tsx ===
$(cat src/components/ui/toolbar.tsx)

=== src/components/canvas/RisspoCanvas.tsx ===
$(cat src/components/canvas/RisspoCanvas.tsx)

=== src/hooks/useKeyboardShortcuts.ts ===
$(cat src/hooks/useKeyboardShortcuts.ts)

=== src/hooks/useDebug.ts ===
$(cat src/hooks/useDebug.ts)

STRUCT_EOF

echo "✅ Estructura guardada en: ESTRUCTURA_COMPLETA.txt"
echo "📊 Tamaño: $(du -h ESTRUCTURA_COMPLETA.txt | cut -f1)"
echo ""
echo "🎯 Archivos incluidos:"
find . -name "*.json" -o -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.html" | grep -v node_modules | head -20
