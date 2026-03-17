# GitHub Custom Deployment Protection Rules

<div align="center">

[![YouTube Channel Subscribers](https://img.shields.io/youtube/channel/subscribers/UC140iBrEZbOtvxWsJ-Tb0lQ?style=for-the-badge&logo=youtube&logoColor=white&color=red)](https://www.youtube.com/c/GiselaTorres?sub_confirmation=1)
[![GitHub followers](https://img.shields.io/github/followers/0GiS0?style=for-the-badge&logo=github&logoColor=white)](https://github.com/0GiS0)
[![LinkedIn Follow](https://img.shields.io/badge/LinkedIn-Sígueme-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/giselatorresbuitrago/)
[![X Follow](https://img.shields.io/badge/X-Sígueme-black?style=for-the-badge&logo=x&logoColor=white)](https://twitter.com/0GiS0)

</div>

---

¡Hola developer 👋🏻! Este proyecto te muestra cómo implementar **Custom Deployment Protection Rules** en GitHub Actions utilizando GitHub Apps. Aprenderás a crear un servicio que verifica automáticamente las alertas de seguridad (code scanning) antes de aprobar o rechazar despliegues en tus entornos.

<a href="https://youtu.be/L7XKNMlZK8s">
 <img src="https://img.youtube.com/vi/L7XKNMlZK8s/maxresdefault.jpg" alt="13. Controlar el paso entre entornos con aprobaciones y security gates" width="100%" />
</a>

## 📑 Tabla de Contenidos
- [Características](#-características)
- [Tecnologías](#️-tecnologías-utilizadas)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Sígueme](#-sígueme-en-mis-redes-sociales)

## ✨ Características

- 🔒 **Validación de seguridad automatizada** - Verifica alertas de code scanning antes de cada despliegue
- 🎯 **Reglas por entorno** - Comportamiento diferente para `dev` (permisivo) y `prod` (estricto)
- 🤖 **Integración con GitHub Apps** - Autenticación segura mediante GitHub Apps
- ⚡ **Respuesta automática** - Aprueba o rechaza despliegues basándose en alertas de severidad alta
- 📊 **Logging detallado** - Información completa de cada decisión de despliegue

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web para manejar webhooks
- **Octokit** - SDK oficial de GitHub para interactuar con la API
- **dotenv** - Gestión de variables de entorno
- **GitHub Apps** - Autenticación y autorización
- **ngrok** - Túnel para exponer el servicio local (desarrollo)
- **Dev Containers** - Entorno de desarrollo containerizado

## 📋 Requisitos Previos

- Node.js 20.x o superior
- Una [GitHub App](https://docs.github.com/en/apps/creating-github-apps) configurada con los siguientes permisos:
  - **Repository permissions:**
    - `Actions`: Read and write
    - `Code scanning alerts`: Read
    - `Deployments`: Read
  - **Subscribe to events:**
    - `Deployment protection rule`
- [ngrok](https://ngrok.com/) o similar para exponer tu servicio local (desarrollo)
- Un repositorio con [Code Scanning](https://docs.github.com/en/code-security/code-scanning) habilitado

## 🚀 Instalación

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/0GiS0/gh-custom-deploy-protection-rules.git
cd gh-custom-deploy-protection-rules
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar la GitHub App

1. Crea una GitHub App en tu organización o cuenta personal
2. Descarga la clave privada y guárdala como `private-key.pem` en la raíz del proyecto
3. Instala la GitHub App en el repositorio donde quieras usar las reglas de protección

### Paso 4: Configurar variables de entorno

Crea un archivo `.env` con las siguientes variables:

```bash
GH_APP_ID=tu_app_id
PORT=3000  # Opcional, por defecto 3000
```

### Paso 5: Exponer el servicio (desarrollo)

Si estás en local, necesitarás exponer tu servicio para que GitHub pueda enviar webhooks:

```bash
ngrok http 3000
```

### Paso 6: Configurar el webhook en GitHub

1. Ve a la configuración de tu GitHub App
2. Establece la URL del webhook con la URL de ngrok + `/hook` (ej: `https://xxxx.ngrok.io/hook`)

### Paso 7: Ejecutar el proyecto

```bash
npm start
```

## 💻 Uso

### Configurar Custom Deployment Protection Rules en tu repositorio

1. Ve a **Settings** > **Environments** en tu repositorio
2. Selecciona el entorno (`dev` o `prod`)
3. En **Deployment protection rules**, activa tu GitHub App

### Lógica de las reglas

| Entorno | Comportamiento |
|---------|----------------|
| `dev` | ✅ Siempre aprueba el despliegue (con advertencia si hay alertas) |
| `prod` | ❌ Rechaza si hay alertas `high` o `error` abiertas en la rama `main` |

### Ejemplo de flujo

```
Push a main
    │
    ▼
┌─────────────────┐
│  Workflow se    │
│  ejecuta        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Job: dev       │──► GitHub llama a tu webhook ──► Verifica alertas ──► ✅ Aprueba
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Job: prod      │──► GitHub llama a tu webhook ──► Verifica alertas ──► ✅/❌
└─────────────────┘
```

## 📁 Estructura del Proyecto

```
gh-custom-deploy-protection-rules/
├── .devcontainer/
│   └── devcontainer.json       # Configuración del Dev Container
├── .github/
│   └── workflows/
│       └── custom-deploy-rule-demo.yaml  # Workflow de ejemplo
├── .gitignore
├── index.js                    # Servidor Express con la lógica principal
├── package.json
├── package-lock.json
├── private-key.pem            # 🔒 Tu clave privada (no incluida)
└── README.md
```

## 🌐 Sígueme en Mis Redes Sociales

Si te ha gustado este proyecto y quieres ver más contenido como este, no olvides suscribirte a mi canal de YouTube y seguirme en mis redes sociales:

<div align="center">

[![YouTube Channel Subscribers](https://img.shields.io/youtube/channel/subscribers/UC140iBrEZbOtvxWsJ-Tb0lQ?style=for-the-badge&logo=youtube&logoColor=white&color=red)](https://www.youtube.com/c/GiselaTorres?sub_confirmation=1)
[![GitHub followers](https://img.shields.io/github/followers/0GiS0?style=for-the-badge&logo=github&logoColor=white)](https://github.com/0GiS0)
[![LinkedIn Follow](https://img.shields.io/badge/LinkedIn-Sígueme-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/giselatorresbuitrago/)
[![X Follow](https://img.shields.io/badge/X-Sígueme-black?style=for-the-badge&logo=x&logoColor=white)](https://twitter.com/0GiS0)

</div>
