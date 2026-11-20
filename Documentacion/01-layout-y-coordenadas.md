# 01 · Layout y coordenadas (pantalla 4K)

Última actualización: 2026-11-20

## 1. Pantalla y zona visible

| Concepto | Valor |
|---|---|
| Pantalla real | **3840 × 2160 px** |
| Zona visible | **3784 × 1290 px**, anclada arriba a la izquierda en (0, 0) |
| Resto | Zona roja: no se ve en la pantalla real |

En el editor la zona no visible sale rayada en rojo, y las cajas que se salen llevan el aviso "⚠ fuera de la zona visible".

## 2. Dos sistemas de unidades (lo que más confunde)

| Sistema | Dónde se usa | Tamaño del lienzo |
|---|---|---|
| **Píxeles reales 4K** | Campos X, Y, Ancho, Alto de las cajas y X, Y del título **en el editor** (desde 2026-11-20) | 3840 × 2160 |
| **Unidades de diseño** | Lo que se **guarda** en `data/datos.js` y `data/dashboard.json`, y `DEFAULT_LAYOUT` en `js/editor.js` | 1920 × 1080 (la mitad exacta) |

- Relación: **píxeles 4K = unidades de diseño × 2**.
- `index.html` pinta el lienzo de 1920 × 1080 y lo escala ×2 anclado en (0, 0).
- El editor hace la conversión (constante `PX = 2` en `js/editor.js`): lo que escribes en píxeles 4K se guarda dividido entre 2.
- El tamaño de letra del título **no** se convierte: sigue en unidades de diseño.
- Antes del 2026-11-20 el editor pedía los campos en unidades de diseño. Si escribías cifras 4K, la caja salía al doble de tamaño y desplazada.

## 3. Cajas (píxeles reales 4K)

Copia legible en `referencia/coordenadas_4k.json`. Ese archivo es **solo de referencia**: el dashboard y el editor no lo leen. La fuente real es `data/datos.js`.

| N.º | id | Título | X | Y | Ancho | Alto | Derecha | Abajo |
|---|---|---|---|---|---|---|---|---|
| 1 | `img-trafico-movil` | Evolución del tráfico móvil en España por provincia y municipio | 100 | 172 | 838 | 504 | 938 | 676 |
| 2 | `img-telxius` | Mapa de la red de Telxius | 1016 | 172 | 838 | 504 | 1854 | 676 |
| 3 | `img-red-internacional` | Mapa de la red internacional de Telefónica | 1932 | 172 | 838 | 504 | 2770 | 676 |
| 4 | `img-red-ip` | La red internacional IP de Telefónica | 2834 | 172 | 838 | 504 | 3672 | 676 |
| 5 | `red-en-cifras` | La red de Telefónica en cifras | 100 | 758 | 838 | 472 | 938 | 1230 |
| 6 | `trafico-total` | Evolución del tráfico total de Internet en la red de Telefónica | 1016 | 758 | 838 | 220 | 1854 | 978 |
| 7 | `consumo-medio` | Consumo medio de tráfico por usuario de Telefónica | 1016 | 1014 | 838 | 216 | 1854 | 1230 |
| 8 | `trafico-categorias` | Evolución del tráfico por categoría de servicios | 1932 | 758 | 838 | 472 | 2770 | 1230 |
| 9 | `semanal-fibra` | Evolución semanal del tráfico por acceso de fibra, cobre residencial, fijo empresas y móvil | 2834 | 758 | 838 | 220 | 3672 | 978 |
| 10 | `semanal-cobre` | Evolución semanal del tráfico por acceso cobre residencial, fijo empresas y móvil | 2834 | 1014 | 838 | 216 | 3672 | 1230 |

Las mismas cajas en **unidades de diseño** (lo que hay en `datos.js`): divide todo entre 2. Ejemplo, la caja 1 es (50, 86, 419, 252).

### Rejilla que forman

- **Columnas (X):** 100 · 1016 · 1932 · 2834 (cada caja mide 838 de ancho).
- **Fila superior (Y):** 172 → 676.
- **Fila inferior (Y):** 758 → 1230. Las columnas 2 y 4 se dividen en dos tarjetas apiladas: 758 → 978 y 1014 → 1230.
- **Separaciones aproximadas:** ~78 px entre columnas, ~80 px entre la fila de imágenes y la de tarjetas, ~36 px entre las dos tarjetas apiladas.
- Todo termina en y = 1230, dentro de los 1290 de zona visible, y en x = 3672, dentro de los 3784.

### Ojo: 1 px de diferencia al copiar cifras

Las cifras 4K salen de multiplicar por 2 lo guardado, así que las cajas miden 172 / 838 / 504 y no 173 / 837 / 505, que fueron las que se midieron a ojo sobre la captura (margen de error de ±3 px). El encaje es el mismo. Si copias cifras del JSON o del editor, serán estas.

## 4. Cabecera (medida a ojo sobre la captura; NO está en el proyecto)

Precisión ±3 px, en píxeles 4K.

| Elemento | Medida |
|---|---|
| Franja clara de fondo | x 0 → 3840, y 0 → 134 |
| Título | empieza en x = 100, centrado verticalmente en y ≈ 63 |
| Logo circular | centro (3302, 69), diámetro ≈ 92 |
| Píldora blanca con engranaje, campana y bandera | x 3375, y 29, 296 × 79 |

El proyecto todavía no replica la cabecera original (logo, engranaje, campana, bandera). Ver `03-pendientes.md`.

## 5. Valores a decidir

- **Título del proyecto:** en `data/datos.js` está en unidades de diseño (x = 48, y = 36, tamaño 34), es decir, **96, 72 en píxeles 4K**. En la captura de referencia el título está más arriba y es algo más pequeño. Falta decidir el valor definitivo.
- **Zona visible:** el usuario indicó que el área visible es **3784 × 1290**, y es lo que usa el proyecto. En la captura de referencia el rojo empieza en y ≈ 1453, una diferencia que no se ha explicado. Las tarjetas terminan en y = 1230, así que caben en ambos casos.

## 6. Cómo se aplicó este layout

- 2026-11-20: se sustituyeron las alturas antiguas (paneles superiores h = 160 en unidades de diseño, que recortaban las imágenes de 858 × 500) por las medidas de la captura (h = 252).
- Se tocaron tres sitios: `boxes` en `data/datos.js`, lo mismo en `data/dashboard.json`, y `DEFAULT_LAYOUT` en `js/editor.js` (lo que usa el botón "Restaurar la colocación original de las cajas").
- Consecuencia conocida: las tarjetas de abajo ahora son más bajas y el contenido se corta. Ver `03-pendientes.md`.
