# Contributing to Project Arjun

Thank you for your interest in contributing to Project Arjun — God's Eye India! This guide will help you get started.

## 🏗️ Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (v22 recommended)
- npm (comes with Node.js)
- Git

### Getting Started

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/project-arjun.git
cd project-arjun

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## 📁 Project Structure

- `src/layers/` — Map layer implementations (each layer extends `BaseLayer`)
- `src/components/` — UI components (Dashboard, Timeline, etc.)
- `src/data/` — Data fetching, caching, and store
- `public/data/` — Static data files (GeoJSON, JSON)

## 🧑‍💻 Adding a New Data Layer

1. Create a new file in `src/layers/` extending `BaseLayer`:

```typescript
import { BaseLayer } from './BaseLayer';
import { Viewer } from 'cesium';
import { DataStore } from '../data/DataStore';

export class MyNewLayer extends BaseLayer {
  constructor(viewer: Viewer, dataStore: DataStore) {
    super(viewer, dataStore, 'my-new-layer', 'My New Layer');
  }

  async load(): Promise<void> {
    // Fetch and display data
  }

  unload(): void {
    // Clean up entities
  }
}
```

2. Register it in `LayerManager.ts`:

```typescript
import { MyNewLayer } from './MyNewLayer';

// In initialize():
this.layers.push(new MyNewLayer(this.viewer, this.dataStore));
```

3. Data files go in `public/data/` as GeoJSON or JSON.

## 🔧 Code Style

- **TypeScript** — All code must be TypeScript with proper types
- **No `any`** — Use proper types or `unknown`
- **Comments** — Document complex logic, not obvious code
- **Imports** — Use path aliases (`@/`) for internal modules

## 🐛 Bug Reports

1. Check existing [issues](https://github.com/yodha/gods-eye-maharashtra/issues) first
2. Include: browser, OS, steps to reproduce, expected vs actual behavior
3. Screenshots or screen recordings help a lot

## ✨ Feature Requests

1. Open an issue with the `enhancement` label
2. Describe the use case and expected behavior
3. Include mockups or examples if possible

## 📝 Pull Request Process

1. Fork the repo and create a branch from `main`
2. Keep PRs focused — one feature or fix per PR
3. Write meaningful commit messages
4. Update documentation if you change public behavior
5. Test your changes locally before submitting

### Commit Messages

Use conventional commits:

```
feat: add water quality heatmap layer
fix: correct district boundary coordinates
docs: update README with new data sources
chore: update dependencies
```

## 📊 Data Sources

When adding new data sources:

- Prefer open/public data (OGD India, CPCB, IMD)
- Document the source URL and license
- Include data attribution in the layer description
- Cache aggressively — avoid hammering government APIs

## ❓ Questions?

Open an issue with the `question` label, or reach out to the maintainers.

---

Thank you for helping build transparent governance tools for India! 🇮🇳
