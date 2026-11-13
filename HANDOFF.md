# HANDOFF – Dashboard "LA RED DE TELEFÓNICA EN CIFRAS"

Documento para el agente que continúe este proyecto. Léelo entero antes de tocar nada.
Usuario: Valen (habla español; responde siempre en español, tono directo y breve).

## 1. Qué se está construyendo
Migración de un dashboard hecho en After Effects (4 paneles de imagen arriba + 6 tarjetas de datos abajo, ES/EN) a:
- `index.html`: dashboard local, offline, animado, ES/EN. Sin dependencias, sin servidor, se abre con doble clic (file://) en Chrome/Edge.
- `editor.html`: CMS para una persona **sin conocimientos técnicos**: edita datos (una sola vez para los dos idiomas), textos por idioma, coordenadas/tamaño/orden de cajas, degradado de fondo, título, tamaños de fuente, banderas e iconos propios.
- Entrega: ZIP que el usuario descomprime en su escritorio. Las referencias deben ser relativas.

Pantalla real: **3840x2160**, solo visible la esquina superior izquierda **3784x1290** (anchor 0,0). El resto (zona roja) no se ve.

## 2. Estado actual (verificado en Chromium headless, 2026-11-13)
- `tests/smoke.js` pasa: index y editor cargan sin errores JS, 10 cajas.
- Captura 4K del index: título, 4 paneles-imagen (placeholders), 6 tarjetas, banderas circulares, degradado, todo dentro de ~1892x645 unidades de diseño.
- **El usuario NO ha confirmado la última versión en su Chrome.**

### Problemas visibles que quedan (prioridad alta)
1. Tarjeta **Red de Telefónica en cifras** (col. izquierda): el contenido se corta por abajo (bloque "5G – ciudades y pueblos" queda recortado). Hay que compactar más o dejar que la caja crezca/escale el contenido.
2. Tarjeta **Consumo medio de tráfico por usuario**: el bloque "datos móviles" se corta por abajo.
3. Tarjeta **Tráfico por categoría**: en la leyenda del donut, la 2ª columna pierde el valor (%) por la derecha (se ve "22", "6", "4"…).
4. Revisar legibilidad de textos pequeños (hay muchas fuentes de ~7-9 px de diseño ×2).
5. Eje X de "evolución del consumo energético" (2018…2025) con etiquetas pegadas.
Idea de solución: auto-fit por caja (medir `scrollHeight` vs alto y reducir escala/tipografía), y/o reducir paddings; mostrar aviso en el editor cuando una caja desborda (ya existe `markOverflow` para zona visible, ampliar a desborde interno).

### Preguntas abiertas para el usuario (sin responder)
- Las capturas ES y EN mostraban cifras distintas (+160% vs +117%, +162M vs +170M) pero el modelo guarda los números **una sola vez**. ¿Quiere números distintos por idioma? (Si no, son datos de prueba inconsistentes.)
- ¿"Guardar cambios" funciona ya? Hipótesis: antes recordaba (IndexedDB) una carpeta antigua → se eliminó esa persistencia; ahora el handle vive solo en memoria y el estado muestra el nombre de la carpeta. Sin confirmar.
- Cabecera original (logo, engranaje, campana, bandera) no replicada; solo botones ES/EN que se ocultan por inactividad.
- Recorte de las imágenes superiores (caja h=160 con imágenes 858x500).

## 3. Arquitectura
Vanilla HTML/CSS/JS. IIFEs envueltas en try/catch que pintan un banner rojo con el error (patrón imprescindible: los fallos eran invisibles antes).

```
index.html            dashboard (carga flags.js, datos.js, dashboard.js)
editor.html           CMS (+ editor.js, editor.css)
css/dashboard.css     estilos del dashboard (.stage 1920x1080 es CRÍTICO)
css/editor.css
js/dashboard.js       render: window.Dashboard = {build, fillBox, play, start, imageOverrides, esc, num}
js/editor.js          CMS completo
data/datos.js         window.DASHBOARD_DATA = {...}   <- fuente real (file:// bloquea fetch)
data/dashboard.json   copia idéntica, solo para importar/exportar
data/flags.js         window.FLAGS_LIST [{PAIS,ISO,IMAGEN}]  (49 entradas)
img/flags/            PNG de banderas (+ estrella.png sin usar)
img/panel1-4.png      placeholders de los 4 paneles
img/icons/            (se crea al subir iconos propios desde el editor)
tests/smoke.js        prueba Playwright
LEEME.txt             manual para el usuario final (no técnico)
```

### Modelo de datos (`data/datos.js`)
- `meta`: `defaultLang`, `stepSeconds`, `loopSeconds`, `canvas {3840,2160}`, `safe {3784,1290}`, `bg [5 colores]`, `topTitleSize`, `cardTitleSize`.
- `ui`: `title`, `replay`, `full`, `missing` (textos `{es,en}`), `title_pos {x,y,size}`.
- `boxes[10]`: cada una `{id,type,x,y,w,h,step,...}`; tipos `image, network, area, stat, stacked, multi`. `step` = orden de aparición (mismo step = a la vez).
- Textos: `{es:"",en:""}` ; números una sola vez; helper `t()`.
- `network` (Red en cifras) usa `blocks` con tipos `gauges, icons, chips (con grupos), note, trend` y `col` (1/2) para 2 columnas.
- Items con `image` usan icono subido (círculo `.ic-img`), si no `ICONS[icon]`.
- Banderas: país por código ISO propio del `flags.json` del usuario (ENG→gb.png, GER→de.png, SCO→gb-sct.png, ESP→es.png, BRA→br.png…). Si no hay imagen, se deja el texto/valor como estaba.

### Escalado
Lienzo de diseño 1920x1080 escalado ×2 a 3840x2160, anclado en (0,0). Zona visible = 1892x645 unidades. `fit()` en dashboard.js: `scale = min(innerW/cw, innerH/ch)*(cw/1920)`. En el editor `CANVAS` y `DESIGN_SCALE=0.5` están **hardcodeados** (debería leerse de `meta`).

### Layout por defecto (`DEFAULT_LAYOUT` en editor.js)
Superiores y=86 h=160; inferiores y=256: red-en-cifras 389h; trafico-total (513,256,429,190); consumo-medio (513,456,429,189); trafico-categorias (978,256,429,389); semanal-fibra (1443,256,429,190); semanal-cobre (1443,456,429,189). Columnas x = 48, 513, 978, 1443; ancho 429.

### Editor (resumen)
- Esquemas `SCHEMA`/`BLOCK` con campos `text/num/str/sel/color/nums/strs/texts/image/list/country/countries`.
- Guardar: File System Access API (`showDirectoryPicker`, solo Chromium) escribe `data/datos.js`, `data/dashboard.json` e imágenes pendientes en `img/`. Fallback: descarga `datos.js`. Borrador en localStorage (`dashboard-editor-borrador-v1`).
- `ensureMeta()` rellena campos que falten (borradores/JSON antiguos sin `meta.safe` rompieron el editor).
- Arrastrar/redimensionar cajas, flechas para empujar, rectángulo rayado de zona no visible, aviso "⚠ fuera de la zona visible".

## 4. Bugs ya resueltos (no repetir)
| Síntoma | Causa raíz | Arreglo |
|---|---|---|
| Pantalla en blanco (index y editor) | `.stage` perdió `width:1920px;height:1080px` en CSS | restaurado; detector de canvas 0x0 con banner |
| `TypeError … reading 'w'` en `safeInput` | JSON/borrador sin `meta.safe` | `ensureMeta()` + código defensivo |
| Error invisible en index | `Dashboard.start()` fuera del try/catch | envuelto + banner |
| Carpetas basura | `data/banderas.*` y carpeta literal `{css,js,data,img}` | eliminadas |
| Edit fallando | cadenas no coincidentes | leer antes de editar / reemplazo en Python |

## 5. Cómo probar
- Real: `cd tests/.. && node tests/smoke.js captura.png` (Playwright ya instalado en el entorno cloud; si no, `npm i playwright`). Chromium headless: `/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell --no-sandbox --window-size=3840,2160 --virtual-time-budget=9000 --screenshot=out.png file:///ruta/index.html`.
- jsdom NO calcula layout/CSS: no sirve para comprobar visuales.
- Mira siempre la captura (`Read` de la PNG) antes de dar algo por bueno.

## 6. Reglas de trabajo con este usuario
- Entregar **siempre el ZIP completo** (`dashboard-telefonica.zip`) con `SendUserFile` al final de cada ronda; en una ocasión no se devolvió y lo reclamó. Sobrescribe el anterior.
- Sin dependencias, sin servidor, offline, rutas relativas.
- El editor lo usará alguien no técnico: textos claros en español, sin jerga.
- El usuario habla de "v4": cuando termine los ajustes pendientes quiere trabajar en una v4.
- Si algo falla visualmente, mostrar errores en pantalla (banners), no silenciosos.

## 7. Siguientes pasos sugeridos
1. Resolver los desbordes de la sección 2 (auto-fit interno), regenerar captura 4K y comprobar.
2. Preguntar/confirmar al usuario: números por idioma, "Guardar cambios", cabecera original.
3. Leer `CANVAS` desde `meta` en el editor.
4. Sustituir datos inventados por reales (4G/sitios, series semanales, tráfico) cuando el usuario los pase.
5. Actualizar `LEEME.txt` y entregar ZIP.
