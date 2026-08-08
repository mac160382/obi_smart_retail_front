# OBI Smart Retail - React + Docker

Aplicación frontend React + TypeScript basada en el prototipo OBI Smart Retail.

## Ejecutar con Docker Compose

```bash
docker compose up --build
```

Abrir: http://localhost:8081

## Ejecutar con Docker

```bash
docker build -t obi-smart-retail-web .
docker run --rm -p 8081:80 obi-smart-retail-web
```

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir: http://localhost:5173

## Variables de compilación

Copia `.env.example` como `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCK_DATA=true
```

Para conectarlo con FastAPI, cambia `VITE_USE_MOCK_DATA=false` e implementa los servicios HTTP en `src/features`.

## Estructura

- `src/app`: configuración principal y rutas.
- `src/components`: layout y elementos reutilizables.
- `src/features/inventory`: tipos, datos y componentes de inventario.
- `src/pages`: páginas de la aplicación.
- `Dockerfile`: build multi-stage Node + Nginx.
- `nginx.conf`: soporte SPA, caché y health check.
