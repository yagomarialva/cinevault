# 🎬 CineVault — Catálogo Pessoal de Filmes e Séries

Um catálogo pessoal estilo Netflix para busca e exibição de filmes e séries, com links magnéticos de torrent.

![Dark Theme](https://img.shields.io/badge/theme-dark-000000)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-22-339933)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

## ✨ Funcionalidades

- 🎬 **Hero Banner** — Destaque aleatório com auto-rotate
- 🎠 **Carrosséis** — Populares, Bem Avaliados, Lançamentos, Séries
- 🔍 **Busca** — Filmes e séries com paginação
- 🧲 **Torrents** — Links magnéticos de múltiplas fontes (1337x, TPB, EZTV)
- 🌐 **i18n** — Português (BR) e Inglês
- 📱 **Responsivo** — Desktop, tablet e mobile
- 🐳 **Docker** — Build e deploy com um comando

## 🚀 Como Rodar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone o projeto

```bash
cd /Volumes/320GB/Documents/Projects/cinevault
```

### 2. Suba os containers

```bash
docker-compose up --build
```

### 3. Acesse

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### Parar os containers

```bash
docker-compose down
```

## 🛠 Desenvolvimento Local (sem Docker)

### Backend

```bash
cd backend
npm install
npm run dev
# Roda em http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Roda em http://localhost:5173
```

## 📁 Estrutura do Projeto

```
cinevault/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/        # Navbar, Hero, Carousel, Card, Modal, etc.
│   │   ├── pages/             # Home, Search
│   │   ├── hooks/             # useDebounce
│   │   ├── services/          # API client
│   │   ├── i18n/              # Traduções (en, pt-BR)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css          # Design system completo
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── routes/            # movies, series, torrents
│   │   ├── services/          # YTS, TVMaze, TorrentScraper
│   │   ├── middleware/        # Error handler
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yaml
└── README.md
```

## 🎨 Fontes de Dados

| Fonte | Tipo | Cadastro? | Uso |
|-------|------|-----------|-----|
| [YTS API](https://yts.mx/api) | REST API | ❌ Não | Filmes + Torrents |
| [TVMaze API](https://api.tvmaze.com) | REST API | ❌ Não | Séries |
| [1337x](https://1337x.to) | Scraping | ❌ Não | Torrents extras |
| [EZTV](https://eztv.re/api) | REST API | ❌ Não | Torrents de séries |
| [The Pirate Bay](https://apibay.org) | REST API | ❌ Não | Torrents (fallback) |

> **⚠️ Aviso Legal**: Este projeto é apenas para fins educacionais. O download de conteúdo protegido por direitos autorais pode ser ilegal na sua jurisdição. Use por sua conta e risco.

## 📄 Licença

MIT
# cinevault
