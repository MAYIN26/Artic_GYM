# ARTIC GYM · Sitio web

Landing page de una sola página para ARTIC GYM con panel de administración para el catálogo de ropa, el menú del café, las membresías, las fotos de instalaciones y los datos de contacto.

> *Mantén tu fuego y rompe el hielo.*

## Estructura

```
index.html            Página principal
css/styles.css        Estilos del sitio
css/admin.css         Estilos del panel
js/default-data.js    Contenido inicial (productos, café, precios, horario…)
js/app.js             Lógica del sitio público
js/admin.js           Panel de administración
server.js             Servidor (sin dependencias) que guarda los cambios
assets/img/logo.svg   Logo provisional → reemplazar por el oficial
assets/products/      Imágenes de muestra de la tienda
```

## Ejecutar

Se necesita Node.js 18 o superior. No hay que instalar dependencias.

```bash
ADMIN_USER="usuario" ADMIN_PASSWORD="una-contraseña-segura" npm start
# http://localhost:3000
```

| Variable | Uso | Valor por defecto |
|---|---|---|
| `ADMIN_USER` | Usuario del panel | `Mayin26` (acceso de prueba) |
| `ADMIN_PASSWORD` | Contraseña del panel | `mayin7759` (acceso de prueba) |
| `PORT` | Puerto | `3000` |
| `DATA_DIR` | Carpeta donde se guardan datos y fotos subidas | `./storage` |

Los cambios del panel se guardan en `DATA_DIR/data.json` (con un respaldo automático en `data.backup.json`) y las fotos en `DATA_DIR/uploads/`. Así **todos los visitantes** ven los cambios.

### Publicar en internet

Sirve cualquier hosting de Node.js con **disco persistente**, por ejemplo:

- **Railway**: nuevo proyecto desde este repositorio, agregar un *Volume* montado en `/data` y definir `DATA_DIR=/data` y `ADMIN_PASSWORD`.
- **Render**: Web Service con *Persistent Disk* montado en `/data`, más las mismas variables.
- **VPS** (DigitalOcean, Hostinger, etc.): `npm start` detrás de Nginx, o con `pm2`.

> Importante: en hostings sin disco persistente (como el plan gratuito de Render) los cambios se pierden en cada reinicio.

### Modo demostración

Si se abre `index.html` sin el servidor (por ejemplo, en GitHub Pages o con doble clic), el sitio funciona igual y el panel entra en **modo demostración** (usuario `Mayin26`, contraseña `mayin7759`). En este modo los cambios se guardan solo en el navegador de quien edita, y así lo indica un aviso en el panel.

## Panel de administración

Botón discreto **"Admin"** en el pie de página (o abrir `/#admin`).

- **Tienda**: agregar, editar nombre, precio, categoría y tallas, cambiar foto, marcar como agotado, reordenar y eliminar.
- **Café**: editar productos, descripciones y precios; agregar o eliminar productos.
- **Membresías**: precios, beneficios, etiqueta y cuál tarjeta va destacada.
- **Instalaciones**: subir las fotos reales del gym y editar textos.
- **Contacto y redes**: WhatsApp, Instagram, TikTok, publicaciones destacadas, dirección, mapa y horario.

Las fotos se reducen automáticamente en el navegador antes de subirse.

## Pendientes por confirmar con el dueño

- [ ] Cambiar el acceso de prueba por uno definitivo (`ADMIN_USER` / `ADMIN_PASSWORD`, y `DEMO_USER` / `DEMO_PASSWORD` en `js/admin.js`)
- [ ] Número de WhatsApp (Panel › Contacto y redes)
- [ ] Cuenta de TikTok
- [ ] Precios reales del café
- [ ] Fotos reales de las instalaciones (las actuales son de referencia)
- [ ] Fotos reales de la ropa y catálogo definitivo
- [ ] Logo oficial en vector (reemplazar `assets/img/logo.svg`, `assets/img/logo-referencia.jpg` es la imagen recibida)
- [ ] Mapa incrustado con el pin exacto (Google Maps › Compartir › Insertar mapa)
- [ ] Enlaces de publicaciones o videos para la sección de redes
