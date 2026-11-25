# 03 · Pendientes y decisiones

Última actualización: 2026-11-25

## Pedidos por el usuario para la próxima sesión

1. **Subir a GitHub** lo actual y mantener la documentación sincronizada. *(En curso: ver nota al final.)*
2. **Maquetar caja por caja** para que cuadre con el diseño original del usuario y entren todos los datos. Ejemplo dado: en "Tráfico por categoría" su diseño cabían dos estadísticas; en el proyecto sale una enorme y la otra mínima. Hay que adaptarlo a los mismos tamaños y maquetar mejor (se aceptan cambios).
3. **Cabecera:** donde se elige idioma, mostrar la **bandera** del idioma activo en lugar de "ES" / "EN". ✅ *Hecho 24/11: bandera redonda del idioma activo (ES=es.png, EN=gb.png); al pulsarla cambia de idioma. La tecla L sigue funcionando.*
   ↳ *Revisado 25/11 a petición del usuario: se muestran SIEMPRE las dos banderas (España y Reino Unido), cada una elige su idioma (la activa lleva aro azul; pulsar la activa no reinicia) y el menú de la cabecera ya NO se oculta por inactividad (solo se oculta el cursor).*
4. **Logo de Telefónica** en la cabecera, configurable desde el editor, a la **izquierda** del selector de idioma. ✅ *Hecho 24/11: Ajustes generales > "Logo de Telefónica" (casilla, imagen y alto). Guardado en `ui.logo = {enabled, src, height}`. El editor muestra un recuadro "LOGO" y un selector de muestra para ver su posición real. Falta que el usuario aporte la imagen del logo (no se incluye en el repo).*

## Consecuencias de las nuevas medidas (alta prioridad, bloquea el punto 2)

Al ajustar el layout a la captura 4K, las tarjetas inferiores son más bajas que antes (236 vs 389 unidades de diseño; 110 vs 190 las apiladas) y el contenido se corta:
- "La red de Telefónica en cifras": pierde la parte inferior.
- "Evolución del tráfico total de Internet": queda sin gráfico.
- Las dos tarjetas semanales: cortan la leyenda.

Solución prevista: **auto-fit por caja** (medir `scrollHeight` frente al alto y escalar o ajustar tipografía/paddings) y/o rediseñar cada tarjeta para su tamaño. Ampliar `markOverflow` del editor para avisar del desborde interno, no solo de la zona no visible.

## Maquetación caja por caja (punto 2) — estado

| Caja | Estado |
|---|---|
| 8 · Tráfico por categoría | ✅ 24/11: área a la izquierda (≈40 %), leyenda en 2 columnas (nombre + %) y donut debajo, en la columna derecha (56 %). Letra de leyenda 8,5 (×2 en 4K). Sin recortes en ES ni EN. |
| 5 · La red de Telefónica en cifras | ✅ 25/11: maquetada según `referencia/maqueta_red_en_cifras.png` (bloques enmarcados con título en el borde: velocímetros, iconos 4G/sitios/LATAM/UE con PNG propios, 5G, fibra con líneas +M, energía con icono y 4 banderas, tendencia con flecha y -49 %). Sin desbordes en ES ni EN. Datos tomados de la maqueta: +86M, UK 5G 87 %, fibra +74M/+72M (la 3.ª bandera sigue siendo Alemania; en la maqueta parece un logo azul). Editor: nuevos campos «Líneas de texto con cifra» e «Icono (imagen)». |
| 6 · Tráfico total de Internet | ⏳ queda sin gráfico (110 de alto) |
| 7 · Consumo medio por usuario | ⏳ se corta el segundo bloque |
| 9 y 10 · Semanales | ⏳ cortan la leyenda |

Método: modificar solo `js/dashboard.js` (RENDER de ese tipo) y `css/dashboard.css`; medir con Playwright (caja, gráfico, leyenda, donut y desborde) en ES y EN; captura a 4K; `node tests/smoke.js`; commit en rama y fusionar en `main`.

## Del HANDOFF (siguen abiertos)

- ~~Leyenda del donut en "Tráfico por categoría": la segunda columna pierde el % por la derecha.~~ ✅ Resuelto 24/11 al rehacer la caja.
- Textos pequeños poco legibles (muchas fuentes de ~7–9 px de diseño ×2).
- Etiquetas del eje X del "consumo energético" (2018…2025) pegadas.
- Leer `CANVAS` desde `meta` en el editor (hoy `CANVAS` y `DESIGN_SCALE` están fijos en el código, y la constante nueva `PX` depende de ellos).
- Cabecera original no replicada (logo, engranaje, campana, bandera).

## Preguntas abiertas al usuario

- ¿Quiere **números distintos por idioma**? Las capturas ES y EN mostraban cifras distintas (+160 % frente a +117 %, +162M frente a +170M), pero el modelo guarda los números una sola vez.
- ¿**"Guardar cambios"** ya le funciona en su Chrome?
- ¿Valor definitivo de la **posición y tamaño del título**? (ver `01-layout-y-coordenadas.md`, sección 5).
- Sustituir los datos inventados por reales (4G/sitios, series semanales, tráfico) cuando los pase.

## Nota sobre sincronización

- El repo de GitHub es la fuente de verdad. Esta carpeta `Documentacion/` forma parte del repo: un `git pull` la deja en la carpeta de Claude del usuario.
- `HANDOFF.md` y `LEEME.txt` también están copiados como documentos del Proyecto "LaRED" en claude.ai y deben mantenerse iguales.
- Cada vez que cambie el layout hay que actualizar `01-layout-y-coordenadas.md` y `referencia/coordenadas_4k.json`, y volver a ejecutar `generar_reglas.py`.
