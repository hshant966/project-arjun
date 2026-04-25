# 🌍 Project Arjun — God's Eye India

**Open-source geospatial intelligence platform for India.**

Real-time 3D intelligence dashboard that fuses open-source data onto an interactive globe — built for transparent governance, citizen oversight, and research.

> Inspired by [Bilawal Sidhu's God's Eye](https://www.youtube.com/@bilawalsidhu) — built for governance, not just geopolitics.

![License](https://img.shields.io/badge/license-MIT-green)
![Built with CesiumJS](https://img.shields.io/badge/built%20with-CesiumJS-blue)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)
![Vite](https://img.shields.io/badge/built%20with-Vite-646CFF)

---

## 📸 Screenshots

<!-- Replace these placeholders with actual screenshots -->
| Maharashtra Dashboard | India-wide Monitoring |
|:---:|:---:|
| ![Maharashtra Dashboard](docs/screenshots/maharashtra-dashboard.png) | ![India Overview](docs/screenshots/india-overview.png) |

| Data Layers | Satellite Tracking |
|:---:|:---:|
| ![Data Layers](docs/screenshots/data-layers.png) | ![Satellite Tracking](docs/screenshots/satellite-tracking.png) |

> 💡 *Screenshots will be updated with each release. To capture your own, run the app locally and take screenshots of each view.*

---

## 🎯 Features

- **🗺️ Maharashtra State Dashboard** — District-level monitoring of water quality, air quality, agriculture, health infrastructure, rainfall, and government schemes
- **🇮🇳 India-wide Monitoring** — Government scheme implementation tracking, verified news events, infrastructure projects, and incident mapping
- **🛰️ Satellite Coverage** — Track satellite passes, imagery availability, and remote sensing data
- **📊 Real-time Data Layers** — 10+ toggleable data layers with live data from government APIs and open sources
- **⏱️ Timeline Navigation** — Time-based filtering and historical data playback
- **🔍 Drill-down Views** — Click any district for detailed metrics and breakdowns
- **📱 Responsive UI** — Works on desktop and tablet browsers
- **🆓 Zero Cost** — No API keys required for basic operation, free GitHub Pages deployment

---

## 🛠️ Tech Stack

| Component | Technology | License |
|-----------|-----------|---------|
| **3D Globe Engine** | [CesiumJS](https://github.com/CesiumGS/cesium) | Apache 2.0 |
| **Build Tool** | [Vite](https://vitejs.dev/) | MIT |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Apache 2.0 |
| **Deployment** | GitHub Pages | Free |
| **Data Format** | GeoJSON, CZML, JSON | — |
| **CI/CD** | GitHub Actions | — |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (v22 recommended)
- npm (comes with Node.js)

### Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/project-arjun.git
cd project-arjun

# Install dependencies
npm install

# Copy environment config (optional — app works without API keys)
cp .env.example .env

# Start dev server
npm run dev
# Opens at http://localhost:3000
```

### Production Build

```bash
npm run build
npm run preview   # Preview the production build locally
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

Or just push to `main` — GitHub Actions handles deployment automatically.

---

## 📊 Data Layers

### Maharashtra State
| Layer | Data Sources | Status |
|-------|-------------|--------|
| 🗺️ District Boundaries | Census 2011, OpenStreetMap | ✅ Live |
| 💧 Water Quality | CPCB, State PCB, Jal Jeevan Mission | ✅ Live |
| 🌬️ Air Quality | CPCB monitoring stations | ✅ Live |
| 🏥 Health Infrastructure | MoHFW, state health dept | ✅ Live |
| 🌾 Agriculture | Agri dept, IMD, satellite data | ✅ Live |
| 🏗️ Infrastructure | State PWD, Metro, NHAI | ✅ Live |
| 🌧️ Rainfall & Weather | IMD, CWC | ✅ Live |

### India-wide
| Layer | Data Sources | Status |
|-------|-------------|--------|
| 📋 Government Schemes | OGD India, NITI Aayog | ✅ Live |
| 📰 News & Events | GDELT, verified news sources | ✅ Live |
| 🛰️ Satellite Coverage | ESA Sentinel, NASA, ISRO | ✅ Live |

---

## 📁 Project Structure

```
project-arjun/
├── src/
│   ├── main.ts                    # App entry point
│   ├── layers/                    # Map layer implementations
│   │   ├── LayerManager.ts        # Layer lifecycle manager
│   │   ├── BaseLayer.ts           # Abstract base class
│   │   ├── MaharashtraDistrictsLayer.ts
│   │   ├── WaterQualityLayer.ts
│   │   ├── AirQualityLayer.ts
│   │   ├── HealthInfrastructureLayer.ts
│   │   ├── AgricultureLayer.ts
│   │   ├── InfrastructureLayer.ts
│   │   ├── GovtSchemesLayer.ts
│   │   ├── RainfallLayer.ts
│   │   ├── NewsEventsLayer.ts
│   │   └── SatelliteLayer.ts
│   ├── components/                # UI components
│   │   ├── Dashboard.ts           # Layer controls & stats panel
│   │   └── Timeline.ts            # Time navigation
│   └── data/
│       └── DataStore.ts           # Data fetching & caching
├── public/
│   └── data/                      # Static data files (GeoJSON, JSON)
├── .github/workflows/             # CI/CD for GitHub Pages
├── docs/screenshots/              # Screenshot assets
├── vite.config.ts
├── package.json
├── .env.example                   # Environment variable template
├── CONTRIBUTING.md
├── CHANGELOG.md
└── LICENSE
```

---

## 📖 Data Sources

| Source | Description | License |
|--------|-------------|---------|
| [Open Government Data India](https://data.gov.in/) | Government datasets, schemes, statistics | Open |
| [CPCB](https://cpcb.nic.in/) | Central Pollution Control Board — air & water quality | Public |
| [IMD](https://mausam.imd.gov.in/) | India Meteorological Department — weather & rainfall | Public |
| [ISRO](https://www.isro.gov.in/) | Satellite imagery and remote sensing | Restricted |
| [ESA Copernicus](https://www.copernicus.eu/) | Sentinel satellite data | Open |
| [GDELT](https://www.gdeltproject.org/) | Global news event database | Open |
| [OpenStreetMap](https://www.openstreetmap.org/) | Base map data | ODbL |
| [NITI Aayog](https://niti.gov.in/) | Government scheme data and SDG tracking | Public |

---

## 🔮 Roadmap

- [ ] **Real-time data pipelines** — Auto-refresh from government APIs
- [ ] **GDELT integration** — Automated news event geocoding
- [ ] **Satellite imagery** — Sentinel-2 tile layer for Maharashtra
- [ ] **Heatmap layers** — Population density, scheme coverage
- [ ] **Drill-down views** — Click district for detailed metrics
- [ ] **Historical playback** — Timeline animation of data changes
- [ ] **Export capabilities** — Download reports, screenshots
- [ ] **Mobile responsive** — Touch-friendly controls
- [ ] **Multi-language** — Marathi, Hindi support
- [ ] **Multi-state expansion** — Support for all Indian states

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a PR.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for anyone to use, modify, and deploy.

---

## 🙏 Acknowledgments

- [Bilawal Sidhu](https://www.youtube.com/@bilawalsidhu) — Inspiration from God's Eye
- [CesiumJS](https://cesium.com/) — 3D globe engine
- [Open Government Data India](https://data.gov.in/) — Data sources
- CPCB, IMD, ISRO — Environmental and satellite data
- The open-source geospatial community

---

**Built with ❤️ for Maharashtra and India** 🇮🇳
