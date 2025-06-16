<p align="center">
  <img src="https://github.com/satoshi-create/complexity-and-network-webdesign/blob/main/docs/branding-mvp-launch/images/logos/logo_cultural-emergent.png" alt="CANW Logo" width="100"/>
</p>

<h1 align="center">Emakimono: Interactive Picture Scroll Viewer</h1>

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Part of CANW](https://img.shields.io/badge/CANW-ecosystem-blueviolet)](https://github.com/satoshi-create/complexity-and-network-webdesign)
[![Contributors](https://img.shields.io/github/contributors/satoshi-create/emakimono-next?color=brightgreen)](https://github.com/satoshi-create/emakimono-next/graphs/contributors)

[![Emaki Screenshot](./public/hero-img_new.png)](https://emakimono.com/)

📘 Read this in other languages:

- [🇯🇵 日本語](./README_ja.md)

> **“Making every emakimono scroll interactively explorable.”**

This project reimagines traditional Japanese picture scrolls (emaki) as interactive digital experiences.  
It brings together frontend technology, storytelling, and cultural heritage — in an open, collaborative spirit.

🌟 Try the MVP site here:  
👉 [https://emakimono.com/](https://emakimono.com/)

---
### 📀 System Architecture (Current & Future)

```mermaid
graph TD

  %% === Frontend Layer ===
  subgraph Frontend[💻 Frontend Layer]
    UI[🖼️ Emakimono Viewer UI - Next.js_Tailwind-CSS]
    Lang[i18n - multi-language support]
    Scroll[Horizontal scroll display]
  end

  %% === Backend Layer ===
  subgraph Backend[🚰 Backend Layer - API endpoints]
    MetadataAPI[📦 API - emaki, annotations, image links]
    Auth[🔐 Authentication]
  end

  %% === Asset & Data Layer ===
  subgraph Assets[📁 Asset & Data Management]
    Cloudinary[☁️ Cloudinary - image hosting]
    Annotations[📝 Annotations - JSON files]
    Translation[🌐 Translations - YAML or JSON]
  end

  %% === Current Connections ===
  UI -->|fetch| MetadataAPI
  MetadataAPI --> Cloudinary
  MetadataAPI --> Annotations
  Lang --> UI
  Auth --> UI
  Translation --> Lang

  %% === Future Enhancements ===
  subgraph Future["🚀 Future Enhancements (Planned)"]
    Pixi[🎮 PixiJS - smooth horizontal rendering]
    TSUI[⚙️ Refactor - TypeScript and full TailwindCSS]
    Supabase[(📃 Supabase - PostgreSQL RLS)]
  end

  Scroll -.-> Pixi
  UI -.-> TSUI
  Annotations -.-> Supabase
```

### ✅ Sections Overview

- **Frontend Layer**: Current implementation with Next.js and partial Tailwind CSS usage
- **Backend Layer**: Lightweight API endpoints handling annotations and image links
- **Asset & Data Layer**: Cloudinary for image hosting, JSON/YAML for metadata and i18n
- **Future Enhancements**:
  - Replace scroll with **PixiJS**
  - Refactor UI using **TypeScript + Tailwind CSS**
  - Migrate metadata storage to **Supabase (PostgreSQL)**

---
## 🧭 Contribution Roadmap

We welcome contributors who share our vision to make cultural storytelling dynamic, accessible, and web-native.

The roadmap below shows an overview of the project's phased development.  
➡️ **For full descriptions of each phase, visit the [📍 Wiki Roadmap](https://github.com/satoshi-create/emakimono-next/wiki/Contribution-Roadmap)**

### 🗺 Roadmap Overview

```mermaid
journey
  title Emaki Scrolls OSS Roadmap
  section Phase 1 OSS Infrastructure Refactoring
    Upgrade from Next.js 12 to latest version: 4:Developers
    Introduce TypeScript with explicit type definitions: 3:Developers
    Migrate to Tailwind CSS: 3:Developers
    Restructure components and project folders: 3:Developers
  section Phase 2 Data Structure Redesign
    Migrate from JSON to RDB (e.g. Supabase): 4:Developers
    Design schema using Prisma/Zod: 3:Developers
    Integrate image and text metadata management: 3:Developers
  section Phase 3 Interactive UX Enhancements
    Add thumbnail navigation and scroll position tracking: 4:UX Team
    Visualize current position and scroll direction: 4:UX Team
    Connect with GIS maps for location-based access: 3:Frontend/Geospatial Team
    Model inter-scroll relationships (theme, geography, era): 3:AI/Cultural Team
  section Phase 4 Internationalization & Cultural Networks
    Implement i18n using next-i18next: 3:Translators
    Translate README/Wiki and improve outreach: 3:All Contributors
    Publish project site via GitHub Pages: 2:All Contributors
    Link with uta-makura, shrines, and linked-verse networks: 2:Cultural Researchers

```

---

## 🎨 Screenshot

[![Screenshot](./public/demo_kusouzu.gif)](https://emakimono.com/en)

> **Try the experience:**  
[📜 Nine Stages of Decay（九相図巻）](https://emakimono.com/kusouzumaki)

---

## 🧭 How to Explore the Scroll

- The scroll proceeds **left to right**, just like traditional emakimono.
- On smartphones: swipe with your finger.  
  On desktop: use trackpad or `shift + scroll` to move horizontally.
- Navigation buttons and thumbnail previews help you jump between scenes.
- Even if you don’t read Japanese, **feel free to interpret the imagery** intuitively!

📝 More stories on [note (in Japanese)](https://note.com/enjoy_emakimono/n/n449f765b4876)

---


## 🧠 Related Projects

- [📜 Horizontal Scroll Emaki (CANW Project)](https://github.com/satoshi-create/complexity-and-network-webdesign/tree/main/projects/horizontal-scroll-emaki)
- [🌐 CANW GitHub Repository](https://github.com/satoshi-create/complexity-and-network-webdesign)

---


## 💬 Get Involved

This project is open source and part of a broader ecosystem.

- Suggest improvements via [Issues](../../issues)
- Join conversations in [CANW Discussions](https://github.com/satoshi-create/complexity-and-network-webdesign/discussions)
- Explore new ideas via [Project Proposals](https://github.com/satoshi-create/complexity-and-network-webdesign/discussions/categories/-proposals)
  
---
## 📚 Documentation

For full documentation and contributor guides, please visit the [Emaki Project Wiki](https://github.com/satoshi-create/emakimono-next/wiki).

---
## 🌟 Contributors!

Thanks to all the contributors who help make Emakimono Project! 🌱

<a href="https://github.com/satoshi-create/emakimono-next/contributors">
  <img src="https://contrib.rocks/image?repo=satoshi-create/emakimono-next" />
</a>

---

## 📘 License

MIT License  
(C) 2024 satoshi-create
