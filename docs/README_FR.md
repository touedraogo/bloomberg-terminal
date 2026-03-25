# Bloomberg Terminal - Documentation FR

## Présentation

**Bloomberg Terminal Clone** - Interface de terminal financier professionnelle avec IA.

⭐ **951+ stars** | 🍴 **164 forks** | [GitHub](https://github.com/feremabraz/bloomberg-terminal)

---

## Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| **Données en temps réel** | Mises à jour simulées avec taux de rafraîchissement configurable |
| **Vues multiples** | Market data, News, Market Movers, Volatility |
| **Interface interactive** | Style terminal avec raccourcis clavier |
| **Watchlist** | Créer et gérer des listes d'instruments financiers |
| **Dark/Light Mode** | Basculer entre les thèmes |
| **Design responsive** | Compatible desktop et tablette |
| **IA Intégrée** | Assistant IA avec OpenAI |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 15 App                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │   Header    │  │  Sidebar    │  │      Main Content       ││
│  │  - Status   │  │  - Menu     │  │  ┌───────────────────┐  ││
│  │  - Search   │  │  - Views    │  │  │  Market View     │  ││
│  │  - Settings │  │  - Watchlist│  │  │  News View       │  ││
│  └─────────────┘  └─────────────┘  │  │  Movers View     │  ││
│                                    │  │  Volatility View  │  ││
│                                    │  │  AI Assistant    │  ││
│                                    │  └───────────────────┘  ││
│                                    └─────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                     State Management                            │
│  ┌─────────────────┐         ┌─────────────────────────────┐   │
│  │  Jotai (local) │         │   React Query (server)       │   │
│  └─────────────────┘         └─────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │ Upstash     │  │ AlphaVantage │  │   OpenAI API           ││
│  │ Redis       │  │ Market Data  │  │   AI Assistant         ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack Technique

| Technologie | Usage |
|-------------|-------|
| **Next.js 15** | Framework React avec App Router |
| **React 19** | Bibliothèque UI |
| **TypeScript** | Typage statique |
| **Tailwind CSS** | Styling utility-first |
| **shadcn/ui** | Composants UI (Radix) |
| **Jotai** | Gestion d'état locale |
| **React Query** | Gestion d'état serveur |
| **Upstash Redis** | Cache et stockage |
| **AlphaVantage** | API données marché |
| **OpenAI** | Fonctionnalités IA |
| **Recharts** | Visualisation de données |
| **Motion** | Animations |

---

## Installation

### 1. Prérequis

```bash
# Node.js LTS requis
node --version  # >= 18.17.0

# pnpm recommandé (ou npm)
npm install -g pnpm
```

### 2. Cloner le repository

```bash
cd /home/ubuntu/Projets_All
git clone https://github.com/touedraogo/bloomberg-terminal.git
cd bloomberg-terminal
```

### 3. Installer les dépendances

```bash
npm install --legacy-peer-deps
```

### 4. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Éditer `.env.local` avec vos clés API :

```env
# Upstash Redis
UPSTASH_REDIS_REST_URL=votre_url_redis
UPSTASH_REDIS_REST_TOKEN=votre_token_redis

# Alpha Vantage (données marché)
ALPHA_VANTAGE_API_KEY=votre_cle_alpha_vantage

# OpenAI (IA)
OPENAI_API_KEY=votre_cle_openai

# Origines autorisées
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.2.2:3000
```

### 5. Obtenir les clés API

| Service | Description | Lien |
|---------|-------------|------|
| **Upstash Redis** | Cache en temps réel | https://upstash.com |
| **AlphaVantage** | Données financières | https://www.alphavantage.co |
| **OpenAI** | IA Assistant | https://platform.openai.com |

### 6. Démarrer

```bash
# Développement
npm run dev

# Production
npm run build
npm run start
```

---

## Structure du Projet

```
bloomberg-terminal/
├── app/                      # Pages Next.js App Router
├── components/
│   ├── bloomberg/           # Composants Terminal
│   │   ├── api/             # Clients API
│   │   ├── atoms/           # Atoms Jotai
│   │   ├── core/            # Composants core
│   │   ├── hooks/           # Hooks React
│   │   ├── layout/           # Layout terminal
│   │   ├── providers/       # Context providers
│   │   ├── ui/              # Composants UI
│   │   └── views/           # Vues principales
│   └── ui/                  # Composants shadcn/ui
├── lib/                      # Utilitaires partagés
├── hooks/                    # Hooks globaux
├── styles/                   # Styles globaux
├── public/                   # Assets statiques
├── docs/                     # Documentation
└── .env.local               # Variables d'environnement
```

---

## Vues Principales

### Market View
- Vue d'ensemble des marchés
- Indices principaux (S&P 500, NASDAQ, etc.)
- Données en temps réel

### News View
- Actualités financières
- Filtres par catégorie
- Recherche

### Market Movers
- Top gainers/losers
- Volume anormal
- Tendances

### Volatility View
- Indice de volatilité
- Graphiques historiques
- Analyse du risque

### AI Assistant
- Chat IA pour analyse
- Recommandations
- Questions sur les données

---

## Commandes

```bash
# Développement
npm run dev          # Démarrer serveur dev

# Production
npm run build        # Build production
npm run start        # Démarrer serveur prod

# Qualité code
npm run lint         # Linting Biome
npm run format       # Formatage
npm run typecheck    # Vérification types
```

---

## Configuration

### Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `UPSTASH_REDIS_REST_URL` | URL Redis | ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | Token Redis | ✅ |
| `ALPHA_VANTAGE_API_KEY` | Clé AlphaVantage | ✅ |
| `OPENAI_API_KEY` | Clé OpenAI | Optionnel |
| `ALLOWED_ORIGINS` | Origines autorisées | ✅ |

### Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + K` | Recherche |
| `M` | Vue Markets |
| `N` | Vue News |
| `W` | Watchlist |
| `I` | AI Assistant |
| `Esc` | Fermer modal |

---

## Sécurité

- **Origin Restriction** : API limitée aux domaines autorisés
- **Rate Limiting** : Limitation des requêtes par IP
- **Input Validation** : Validation Zod de toutes les entrées
- **Environment Variables** : Clés stockées dans `.env`

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Port déjà utilisé | Next.js utilise le port suivant disponible |
| Clé API invalide | Vérifier `.env.local` |
| Erreur Redis | Vérifier credentials Upstash |
| Données manquantes | Vérifier limite AlphaVantage (5 req/min) |

---

## Licence

MIT
