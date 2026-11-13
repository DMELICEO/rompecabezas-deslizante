# Cuadro — Rompecabezas Deslizante

Aplicación web interactiva de rompecabezas deslizante con tamaño personalizable (`Ancho × Alto`), modo con números, modo con fotos de tu galería, retroceso de movimientos, mezcla con garantía de solución y modo **Barajar a tu gusto** para practicar movimientos.

## Comandos disponibles

```bash
npm install      # Instalar dependencias
npm run dev      # Servidor local en http://localhost:3000
npm run lint     # Verificación de tipos TypeScript
npm test         # Pruebas unitarias de lógica del rompecabezas
npm run build    # Compilar para producción en /dist
```

## Publicar con GitHub Actions (GitHub Pages)

El flujo de despliegue ya está configurado en `.github/workflows/deploy.yml`.

1. Sube el proyecto a un repositorio en GitHub (rama `main` o `master`).
2. En tu repositorio ve a **Settings → Pages**.
3. En **Build and deployment → Source**, selecciona **GitHub Actions**.
4. Cada `push` a `main`/`master` (o al pulsar **Run workflow** manualmente en la pestaña **Actions**) ejecutará la verificación, las pruebas, la compilación y desplegará el sitio automáticamente.
