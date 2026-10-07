# Italiano para hispanohablantes — Cómo publicar la app (gratis)

La app es un conjunto de archivos. Se publica una vez en GitHub Pages (gratuito) y después
se instala en el iPhone desde Safari. Una vez instalada funciona sin internet.

## 1. Crear la cuenta y el espacio para la app (una sola vez)
1. Entra en https://github.com y pulsa **Sign up**. Crea una cuenta gratuita (correo, contraseña y un nombre de usuario).
2. Ya dentro, pulsa el **+** de arriba a la derecha → **New repository**.
3. En *Repository name* escribe: `italiano`
4. Marca **Public** y pulsa **Create repository**.

## 2. Subir los archivos
1. En la página del repositorio recién creado, pulsa el enlace **uploading an existing file**
   (o *Add file → Upload files*).
2. Descomprime el ZIP en tu ordenador y **arrastra todo el contenido de la carpeta**
   (index.html, app.js, app.css, data.js, sw.js, manifest.webmanifest y la carpeta *icons*)
   a la zona de subida. Hazlo desde un ordenador con Chrome o Edge.
3. Abajo, pulsa **Commit changes** y espera a que termine.

## 3. Activar la publicación
1. En el repositorio, ve a **Settings** (pestaña de arriba) → **Pages** (menú de la izquierda).
2. En *Build and deployment* → *Source*, elige **Deploy from a branch**.
3. En *Branch*, elige **main** y la carpeta **/ (root)**. Pulsa **Save**.
4. Espera 1–3 minutos y recarga esa página: aparecerá la dirección de tu app, del tipo
   `https://TU-USUARIO.github.io/italiano/`

## 4. Instalarla en el iPhone
1. Abre esa dirección en **Safari**.
2. Pulsa **Compartir** (el cuadrado con la flecha) → **Añadir a pantalla de inicio** → **Añadir**.
3. Abre la app desde el icono **una vez con internet**. A partir de ahí funciona sin conexión.
4. Instala la voz italiana: Ajustes del iPhone → Accesibilidad → Contenido leído → Voces → Italiano
   (elige una versión *Mejorada* si aparece). Luego elígela en Ajustes dentro de la app.

## 5. Actualizar cuando haya una versión nueva
1. En el repositorio: *Add file → Upload files* y arrastra los archivos nuevos (sustituyen a los antiguos).
2. Pulsa **Commit changes**.
3. La próxima vez que abras la app con internet verás el aviso «Hay una versión nueva»: pulsa **Actualizar**.
   Tu progreso no se pierde.

## Notas
- El repositorio es público: cualquiera con la dirección puede ver la app, pero **tu progreso solo
  está en tu teléfono** y nadie más puede verlo.
- Haz de vez en cuando una copia de seguridad en la app (Ajustes → Guardar copia), por ejemplo en
  iCloud Drive o en Archivos. Sirve también para pasar tu progreso al ordenador.
- Para probarla en el ordenador sin publicarla, basta con abrir `index.html` con Chrome o Edge
  (en ese modo no funciona sin conexión ni se puede instalar, pero sí todo lo demás).

## Si no se ve en el iPhone
1. **No abras el archivo desde Archivos, WhatsApp o el correo.** En el iPhone la app solo funciona
   desde su dirección de internet (`https://TU-USUARIO.github.io/italiano/`). En el ordenador sí se
   puede abrir el archivo directamente, por eso allí funciona.
2. **Comprueba la dirección:** debe llevar tu usuario, `.github.io/` y el nombre del repositorio al final.
3. **Comprueba que los archivos están en la raíz del repositorio:** al entrar en el repositorio en
   github.com deben verse directamente `index.html`, `app.js`, `data.js`… y la carpeta `icons`.
   Si están dentro de otra carpeta, la dirección cambia o la página no aparece.
4. **El repositorio debe ser Public** y en Settings → Pages debe poner que el sitio está publicado.
5. Tras subir archivos, espera 2–3 minutos. Si sigues viendo una versión antigua, prueba en una
   pestaña privada de Safari.
6. Si aparece la pantalla «No se ha podido abrir la app», haz una captura: incluye los datos
   necesarios para saber qué ha fallado.
