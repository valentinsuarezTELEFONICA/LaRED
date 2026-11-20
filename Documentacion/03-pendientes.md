# 03 · Pendientes y decisiones

Última actualización: 2026-11-20

## Pedidos por el usuario para la próxima sesión

1. **Subir a GitHub** lo actual y mantener la documentación sincronizada. *(En curso: ver nota al final.)*
2. **Maquetar caja por caja** para que cuadre con el diseño original del usuario y entren todos los datos. Ejemplo dado: en "Tráfico por categoría" su diseño cabían dos estadísticas; en el proyecto sale una enorme y la otra mínima. Hay que adaptarlo a los mismos tamaños y maquetar mejor (se aceptan cambios).
3. **Cabecera:** donde se elige idioma, mostrar la **bandera** del idioma activo en lugar de "ES" / "EN".
4. **Logo de Telefónica** en la cabecera, configurable desde el editor, a la **izquierda** del selector de idioma.

## Consecuencias de las nuevas medidas (alta prioridad, bloquea el punto 2)

Al ajustar el layout a la captura 4K, las tarjetas inferiores son más bajas que antes (236 vs 389 unidades de diseño; 110 vs 190 las apiladas) y el contenido se corta:
- "La red de Telefónica en cifras": pierde la parte inferior.
- "Evolución del tráfico total de Internet": queda sin gráfico.
- Las dos tarjetas semanales: cortan la leyenda.

Solución prevista: **auto-fit por caja** (medir `scrollHeight` frente al alto y escalar o ajustar tipografía/paddings) y/o rediseñar cada tarjeta para su tamaño. Ampliar `markOverflow` del editor para avisar del desborde interno, no solo de la zona no visible.

## Del HANDOFF (siguen abiertos)

- Leyenda del donut en "Tráfico por categoría": la segunda columna pierde el % por la derecha.
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
