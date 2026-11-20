# 02 · Imágenes de referencia

Última actualización: 2026-11-20

Todo vive en `Documentacion/referencia/`.

| Archivo | Qué es |
|---|---|
| `pantallazo_4k_original.jpg` | Captura de la maqueta original del usuario (proporción 16:9). La parte **roja** de abajo es la zona que no se ve en la pantalla real. Es la referencia de cómo debe quedar. |
| `coordenadas_4k.json` | Cajas, título y zona visible en píxeles reales 4K, derivadas de `data/datos.js` (×2). Solo de referencia: nada lo lee. |
| `coordenadas_4k_reglas.jpg` | La captura a 3840 × 2160 con las cajas dibujadas y reglas en los márgenes. Tamaño total 3990 × 2230 (los márgenes de 150 px a la izquierda y 70 px arriba son las reglas). |
| `generar_reglas.py` | Script que regenera la imagen anterior a partir del JSON y de la captura original. |

## Cómo leer `coordenadas_4k_reglas.jpg`

- **Reglas** en los márgenes blancos, arriba (X) y a la izquierda (Y): marcas cada **100 px en rojo** y los múltiplos de **500 en negro**, más gruesos.
- El **0, 0** es la esquina superior izquierda de la pantalla 4K, no del archivo. La imagen empieza en (150, 70) dentro del archivo.
- **Cuadrícula fina** sobre la imagen con las mismas marcas, para leer cualquier punto. Lleva borde blanco para que se vea también sobre la zona roja.
- **Cajas** en verde agua, numeradas 1–10, con `x,y  anchoxalto` en 4K.
- **Zona no visible del proyecto:** sombreada en rojo; la línea **amarilla** marca y = 1290 (y x = 3784).
- La zona roja que ya traía la captura original empieza en y ≈ 1453.
- Cabecera: no está dibujada en la versión con reglas; sus medidas están en `01-layout-y-coordenadas.md`.

## Cómo regenerarla

```
pip install pillow
python3 Documentacion/referencia/generar_reglas.py
```

- Lee `coordenadas_4k.json` y `pantallazo_4k_original.jpg` de su misma carpeta y vuelve a escribir `coordenadas_4k_reglas.jpg`.
- Se verificó el 2026-11-20 que reproduce la imagen entregada píxel por píxel.
- Si cambias las cajas en el editor, actualiza antes `coordenadas_4k.json` (el editor no lo hace solo). Para regenerarlo desde `data/datos.js`, multiplica por 2 `x`, `y`, `w` y `h` de cada caja y recalcula `derecha` y `abajo`.

## Origen de las cifras

- Medidas a ojo sobre la captura (2000 × 1125 mostrada, 3840 × 2160 real, factor 1,92), con ±3 px de error. Después se redondearon a la cuadrícula de unidades de diseño del proyecto, y por eso difieren en 1 px de las primeras cifras dadas (ver `01-layout-y-coordenadas.md`).
- Para ajustar a más precisión: medir con un script sobre la captura original a su resolución real.
