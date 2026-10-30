# Preparación y activación de GitHub Pages

Cuenta indicada por el titular: gpvnoel-afk.
Repositorio previsto: portafolio-gpv.
Rama de publicación: main.
Dirección permanente prevista: https://gpvnoel-afk.github.io/portafolio-gpv/

La dirección aún no está publicada ni se ha comprobado su disponibilidad. No se creó un repositorio, no se conectó ninguna cuenta y no se realizó ningún despliegue. Configurar el flujo local no configura los ajustes de una cuenta de GitHub.

## Estado de autorización
El titular autorizó expresamente la primera publicación el 30/10/2026; publication.authorized está en true. La variable de repositorio PAGES_ENABLED no se ha creado ni activado. El registro de documentos content/autorizaciones-publicacion.json está vacío: no hay copias autorizadas para Internet. La autorización para mostrar documentos en localhost no autoriza subirlos a un repositorio, ni siquiera privado.

El diseño y las siete secciones se mantienen. La revisión local tiene 19 fichas; la fuente pública conserva 15 referencias. Las cuatro fichas adicionales y sus imágenes siguen en revisión local. No se promueven automáticamente a la publicación.

## Qué subir y qué no subir
El proyecto de trabajo contiene información privada y no debe subirse completo. El script scripts/Preparar-repositorio-publicacion.ps1 -Exportar genera una carpeta nueva con una lista explícita de archivos permitidos en _private/repositorio-publicacion-FECHA. Usar esa carpeta como raíz del repositorio, no C:\Portafolio_Profesional_German.

La exportación incluye HTML, CSS, JavaScript, catálogo público separado, flujo, pruebas de producción y copias expresamente autorizadas. Excluye documentos originales, los dos registros no verificados, las cuatro fichas locales, OCR, inventarios, respaldos, ZIP, imágenes de revisión, rutas originales y servidores locales. Los scripts y la documentación incluyen referencias genéricas al área privada, nunca sus documentos.

El flujo genera y carga solamente dist. Verificar-produccion.ps1 rechaza archivos ajenos a la lista de producción, vínculos y documentos que no tengan autorización individual y SHA256 coincidente. El control se ejecuta antes de copiar documentos y después de generar la distribución. El registro de autorización no sustituye la revisión visual del certificado ni certifica que sus metadatos estén saneados.

.gitignore es una prevención adicional: no protege archivos ya comprometidos ni impide una inclusión forzada. No usar git add -f sobre el proyecto de trabajo completo.

## Preparar una exportación limpia desde Codex
En PowerShell, dentro del proyecto de trabajo:

    .\scripts\Preparar-repositorio-publicacion.ps1 -Exportar

Sin -Exportar solo sincroniza content/catalogo-publico.json y comprueba la distribución. No ejecuta Git ni accede a Internet. Mantener content/portfolio.json como fuente local; no editar únicamente dist.

Cada exportación crea una carpeta nueva y no sobrescribe repositorios ni copias anteriores. Para futuras actualizaciones, usar Codex para trasladar únicamente los archivos permitidos de la nueva exportación al repositorio limpio existente. No copiar la raíz del proyecto ni la carpeta _private. Revisar git diff antes de confirmar.

## Pasos exactos para activar, únicamente después de autorización expresa
1. Obtener la autorización del titular para la primera publicación, el texto público y cada copia documental. Decidir por separado si se autorizan las cuatro fichas locales; mientras tanto quedan excluidas. Confirmar también el enlace del perfil personal de LinkedIn, que todavía no se ha facilitado.
2. Tras esa autorización, establecer publication.authorized en true en content/portfolio.json del proyecto de trabajo. Si se trabaja directamente en el repositorio limpio, modificar content/catalogo-publico.json. Este cambio ya se aplicó al recibir la autorización expresa del titular el 30/10/2026.
3. Preparar de nuevo la exportación limpia con el comando anterior. Git no está instalado o disponible en esta computadora durante esta preparación: instalarlo/configurarlo antes de los comandos siguientes, sin entregar contraseñas a Codex.
4. En GitHub, crear un repositorio dedicado gpvnoel-afk/portafolio-gpv, sin README automático. No reutilizar otro proyecto. Elegir la visibilidad según el plan: GitHub Free permite Pages en repositorios públicos; Pages en repositorios privados depende del plan. Un repositorio privado no garantiza que el sitio Pages sea privado.
5. Abrir PowerShell en la carpeta limpia exportada. No ejecutar estos comandos en el proyecto de trabajo:

    git init -b main
    git add .
    git status --short
    git diff --cached --stat
    git diff --cached

Comprobar que no hay originales, informes privados, datos de revisión ni certificados no autorizados. Si hubiera un certificado autorizado, incluir únicamente su ruta revisada ignorada, por ejemplo:

    git add -f content/approved/intec-2024.png

Solo ejecutar esa inclusión tras aprobación individual y registro SHA256. Después de revisar lo preparado:

    git commit -m "Preparar portafolio GPV aprobado"
    git remote add origin https://github.com/gpvnoel-afk/portafolio-gpv.git
    git push -u origin main

Este primer envío comprueba el proyecto, pero NO despliega mientras PAGES_ENABLED esté ausente o sea false.
6. En GitHub: Settings → Pages → Build and deployment → Source → GitHub Actions.
7. En Settings → Environments → github-pages, permitir despliegues únicamente desde main. Configurar protección de main para que entren únicamente cambios revisados; exigir el control «Comprobar producción y privacidad» antes de integrar solicitudes de cambios. Las opciones disponibles dependen del plan.
8. Después de confirmar la autorización de primera publicación: Settings → Secrets and variables → Actions → Variables → New repository variable. Nombre: PAGES_ENABLED. Valor: true. No es una contraseña ni requiere un token personal.
9. Ir a Actions → GPV - comprobar y publicar cambios aprobados → Run workflow → elegir main → escribir PUBLICAR → Run workflow. Este paso sí puede realizar la primera publicación: NO se ha ejecutado.
10. Esperar el éxito de verificar, preparar y publicar. Copiar la dirección devuelta por GitHub Pages y comprobar que corresponde a la prevista. Revisar el sitio y cada certificado con sesión cerrada, en escritorio y móvil.

No usar PUBLICAR desde otra rama: el flujo lo rechaza por su condición de main. Las solicitudes de cambios solo ejecutan comprobaciones; no se publican. Mantener PAGES_ENABLED=false hasta estar listo evita una publicación al subir el primer conjunto de archivos.

## Mantenimiento sin cambiar la dirección
Con la primera publicación autorizada, publication.authorized=true y PAGES_ENABLED=true, cada actualización aprobada enviada a main construye, comprueba y despliega solamente dist. Los cambios al contenido o certificados no cambian la URL. Conservar el usuario gpvnoel-afk y el nombre portafolio-gpv; renombrarlos o cambiar dominio sí puede cambiarla.

En Codex: solicitar el cambio, revisar la vista previa y el diff, autorizar lo que corresponda, sincronizar el repositorio limpio, integrar en main y comprobar Actions. No conectar LinkedIn para actualizar el sitio: el perfil mantiene el mismo enlace.

Para detener futuros despliegues: poner PAGES_ENABLED=false. Esto no retira el sitio que ya estuviera publicado. Para retirarlo, usar las opciones de Pages en GitHub; no se ha ejecutado ninguna retirada ni publicación durante esta preparación.

Para volver a una versión anterior: revertir el commit de cambios en main y enviarlo. La automatización reconstruye en la misma URL. No forzar el historial. Los respaldos privados se restauran siguiendo RESTAURACION.md en el proyecto local, nunca subiéndolos al repositorio.

## Agregar o sustituir certificados con autorización individual
1. Conservar el original en cv o en el área privada. Verificar titular, título, institución y fecha; separar duplicados. Revisar cédulas, domicilio, teléfonos, matrículas, firmas, identificadores y metadatos sobre una copia.
2. Antes de autorización: conservar la ficha/evidencia en la revisión local. No editar catalogo-publico.json ni incluir el documento en el repositorio.
3. Tras autorización del contenido público, incorporar el registro revisado a certificates en content/portfolio.json. Para trasladar una de las fichas locales, quitar localOnly y sus rutas de fuente/revisión; mantener título, institución, fecha, tipo, categoría y descripción autorizados. No pasar indiscriminadamente todo formacion-adicional.json. Ejecutar el preparador para sincronizar el catálogo público. No modificar HTML/CSS/JavaScript.
4. Si solo se autoriza la ficha, dejar approved=false y file vacío: no se publica el documento.
5. Si se autoriza también la copia, colocarla en content/approved con un nombre simple. Establecer verified=true, approved=true y file con la ruta assets/documents/NOMBRE.pdf o .png/.jpg. format debe ser pdf o image, según corresponda.
6. Registrar en documents de content/autorizaciones-publicacion.json un objeto con file, sha256, authorizedBy y authorizedAt. Obtener la huella exacta con:

    Get-FileHash -LiteralPath .\content\approved\NOMBRE.pdf -Algorithm SHA256

Ejemplo de estructura, NO una autorización real:

    {
      "file": "assets/documents/NOMBRE.pdf",
      "sha256": "SUSTITUIR_POR_64_CARACTERES_HEXADECIMALES",
      "authorizedBy": "Germán Antonio Parra Villa",
      "authorizedAt": "FECHA_Y_HORA_ISO_CON_ZONA"
    }

No copiar el ejemplo como autorización. La huella debe corresponder a la copia que el titular revisó. Cualquier sustitución, incluso una mejora visual, necesita revisar y registrar de nuevo esa copia antes de publicarla.
7. Ejecutar la preparación y pruebas, revisar el visor, exportar y trasladar únicamente los archivos permitidos al repositorio limpio. Incluir expresamente solo cada documento revisado con git add -f a su ruta de content/approved.
8. Revisar git diff y enviar el cambio aprobado a main. Los filtros se actualizan según los registros visibles; no existe un máximo fijo de certificados.

Al revocar un documento: approved=false, file vacío, quitar su autorización, retirar su copia del repositorio limpio y desplegar. La construcción retira copias revocadas de dist. Si el documento estuvo en un repositorio público o en Internet, revisar también historial, cachés y copias previas; un despliegue nuevo no borra todas esas copias.

## LinkedIn
Después de publicar y verificar la URL, añadirla manualmente al perfil como enlace de portafolio. La ubicación exacta de «Destacado» o de los enlaces de contacto depende de la interfaz y cuenta.

URL: https://gpvnoel-afk.github.io/portafolio-gpv/
Título: Portafolio profesional · Germán Antonio Parra Villa
Descripción: Formación, trayectoria y competencias profesionales de Germán Antonio Parra Villa.

No usar localhost ni una ruta de Windows. No se necesita sincronización de cuentas: LinkedIn apunta a una dirección estable y GitHub Pages actualiza su contenido. La actualización de la miniatura o caché de LinkedIn puede no ser inmediata.

## Comprobaciones y límites
Las comprobaciones locales verifican estructura, privacidad conocida, lista de archivos, aprobación por SHA256, filtros y visores. No se ha ejecutado Actions en GitHub ni verificado el repositorio o URL remotos. No se declara el sitio publicado ni la cuenta conectada.

Documentación oficial consultada el 30/10/2026:
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/actions/reference/security/secure-use