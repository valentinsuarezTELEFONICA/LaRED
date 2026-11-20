# Documentación del proyecto LaRED

Dashboard "La red de Telefónica en cifras" (`index.html`) y su editor (`editor.html`).

| Documento | Contenido |
|---|---|
| [`01-layout-y-coordenadas.md`](01-layout-y-coordenadas.md) | Pantalla 4K, zona visible, unidades (píxeles 4K frente a unidades de diseño), tabla de las 10 cajas, cabecera |
| [`02-imagenes-de-referencia.md`](02-imagenes-de-referencia.md) | Captura original, imagen con reglas, JSON de coordenadas y cómo regenerarlas |
| [`03-pendientes.md`](03-pendientes.md) | Tareas pendientes, decisiones abiertas y preguntas para el usuario |
| [`referencia/`](referencia/) | Archivos de apoyo: captura, `coordenadas_4k.json`, `coordenadas_4k_reglas.jpg` y `generar_reglas.py` |

Otros documentos del proyecto (en la raíz del repo):

- [`../HANDOFF.md`](../HANDOFF.md): traspaso técnico para quien continúe el desarrollo (arquitectura, modelo de datos, bugs resueltos, cómo probar).
- [`../LEEME.txt`](../LEEME.txt): manual para el usuario final no técnico.

## Datos clave (resumen)

- Pantalla real **3840 × 2160**; zona visible **3784 × 1290**, anclada en (0, 0).
- En el **editor** las coordenadas se escriben en **píxeles 4K**; en `data/datos.js` se **guardan a la mitad** (lienzo de 1920 × 1080).
- La fuente real del layout es `data/datos.js`. `referencia/coordenadas_4k.json` es solo una copia legible.
