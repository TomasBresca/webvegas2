# Timbaya - Sitio Web con Versiones Múltiples

Este proyecto utiliza Astro para crear un sitio web con múltiples versiones, cada una con su propio componente Hero y configuración específica de WhatsApp y Facebook Pixel.

## Estructura de Versiones

El sitio tiene 9 versiones diferentes, accesibles a través de diferentes URL:

- `/01` - Versión 1 (Hero(1).astro)
- `/02` - Versión 2 (Hero(2).astro)
- ...y así sucesivamente hasta `/09`

## Configuración específica por versión

Cada versión tiene su propia configuración para:

1. **Componente Hero**: Cada versión usa un Hero diferente de la carpeta `src/heros/`
2. **Enlaces de WhatsApp**: Cada versión tiene sus propios enlaces de WhatsApp (`whatsappLink1` y `whatsappLink2`)
3. **Enlace de Registro**: Cada versión tiene su propio enlace de registro (`registrationLink`)
4. **Evento de Facebook Pixel**: Cada versión utiliza el mismo token de Pixel pero con un evento diferente

## Cómo funciona

El sistema usa rutas dinámicas en Astro (archivo `[id].astro`) que detecta el parámetro en la URL y carga la configuración específica para esa versión.

La configuración de todas las versiones se encuentra en el archivo `src/pages/[id].astro`, donde hay un objeto `versions` que contiene la configuración para cada versión.

## Desarrollo

Para ejecutar el proyecto en desarrollo:

```bash
npm run dev
```

## Despliegue

Al construir el proyecto, se generarán todas las versiones como rutas estáticas:

```bash
npm run build
```

## Personalización

Para modificar la configuración de una versión específica:

1. Edita el objeto `versions` en `src/pages/[id].astro`
2. Actualiza los enlaces de WhatsApp, registro y el evento de Pixel según necesites
3. Si necesitas cambiar un Hero, modifica el archivo correspondiente en `src/heros/`

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
