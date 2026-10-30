# GPV · Portafolio profesional
Sitio estático en español. Diseño y contenido aprobados de Germán Antonio Parra Villa.

Dirección prevista: https://gpvnoel-afk.github.io/portafolio-gpv/
Repositorio previsto: gpvnoel-afk/portafolio-gpv · rama main.

Esta carpeta es una exportación preparada localmente. No se ha conectado GitHub ni se ha realizado la primera publicación. La primera publicación ya está autorizada en el catálogo; la activación remota y el acceso a GitHub siguen pendientes. No hay documentos autorizados individualmente.

Editar content/catalogo-publico.json para el contenido del repositorio. Las nuevas referencias deben estar revisadas y no contener datos de revisión privada. Los documentos requieren además aprobación individual registrada con su SHA256 en content/autorizaciones-publicacion.json.

Construir y comprobar:
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Construir.ps1 -Datos content/catalogo-publico.json
powershell -NoProfile -ExecutionPolicy Bypass -File .\tests\Validar.ps1 -Datos content/catalogo-publico.json

GitHub Actions comprueba las solicitudes de cambios y los envíos a main. Después de la autorización y activación documentadas, los envíos aprobados a main actualizan la misma dirección. Solo se carga dist como artefacto de Pages.

Consultar PUBLICACION.md para los pasos de activación, certificados, mantenimiento y LinkedIn. No introducir originales, carpetas privadas, respaldos ni informes de revisión en este repositorio.