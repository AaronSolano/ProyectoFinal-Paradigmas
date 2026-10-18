# Reglas del Proyecto

### Regla de Flujo de Trabajo: "Sube cambios"

Cuando reciba la instrucción exacta "Sube cambios", se ejecutará estrictamente el siguiente procedimiento automatizado:

1. **Validación de entorno:**
   - Confirmar que el directorio de trabajo se encuentra en la rama `Feature-Aaron`.
   - Si se encuentra en otra rama, detener el proceso e informar el estado actual sin ejecutar cambios.

2. **Guardado de trabajo local (Commit previo):**
   - Ejecutar: `git add .`
   - Generar un commit con un mensaje descriptivo y conciso de los cambios: `git commit -m "<descripción clara de los cambios realizados>"`.

3. **Verificación y sincronización con origin dev:**
   - Descargar el estado más reciente del repositorio: `git fetch origin dev`.
   - Traer y actualizar la rama local `dev` con respecto a `origin/dev`: `git fetch origin dev:dev`.
   - Integrar los cambios de `dev` dentro de `Feature-Aaron`: `git merge dev`.

4. **Gestión de conflictos:**
   - Si surgen conflictos de integración:
     1. Detener el flujo de subida de inmediato.
     2. Reportar al usuario cuáles archivos presentan colisiones y en qué bloques de código.
     3. Aplicar las correcciones correspondientes.
     4. Concluir el merge commit tras la resolución.

5. **Publicación limpia en origin dev:**
   - Pasar a la rama local `dev`: `git checkout dev`.
   - Integrar los cambios limpios y probados de `Feature-Aaron`: `git merge Feature-Aaron`.
   - Subir los cambios al remoto: `git push origin dev`.
   - Regresar de inmediato a la rama de trabajo: `git checkout Feature-Aaron`.
   - Notificar al usuario la confirmación de la subida exitosa.

### Regla de Flujo de Trabajo: "Trae cambios"

Cuando reciba la instrucción exacta "Trae cambios", se ejecutará estrictamente el siguiente procedimiento automatizado:

1. **Validación de entorno:**
   - Confirmar que el directorio de trabajo se encuentra en la rama `Feature-Aaron`.
   - Si se encuentra en otra rama, detener el proceso e informar el estado actual sin ejecutar cambios.

2. **Protección de trabajo no guardado:**
   - Verificar si existen modificaciones locales no commiteadas (`git status --porcelain`).
   - Si hay cambios pendientes, guardarlos temporalmente en un stash seguro: `git stash push -m "temp_before_pull"`.

3. **Descarga y actualización de dev:**
   - Obtener los últimos cambios del repositorio remoto: `git fetch origin dev`.
   - Actualizar la rama `dev` local para que coincida exactamente con `origin/dev`: `git fetch origin dev:dev`.

4. **Integración en Feature-Aaron:**
   - Fusionar los cambios recientes de `dev` dentro de `Feature-Aaron`: `git merge dev`.
   - Si se utilizó stash en el paso 2, restaurar los cambios guardados: `git stash pop`.

5. **Detección y resolución de conflictos:**
   - Si no hay conflictos, notificar al usuario que la rama `Feature-Aaron` y la rama `dev` local están completamente al día.
   - Si surgen conflictos (durante el merge o al restaurar el stash):
     1. Detener el proceso inmediatamente.
     2. Listar detalladamente qué archivos presentan colisión y los bloques de código afectados.
     3. Aplicar las correcciones necesarias para resolverlos de forma limpia.
     4. Concluir el merge commit y confirmar la sincronización exitosa al usuario.
