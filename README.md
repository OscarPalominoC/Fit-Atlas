# FitAtlas: Biological Intelligence Engine

FitAtlas is a high-performance training intelligence platform designed to bridge the gap between biomechanical data and physical evolution. Featuring a interactive Neural Atlas, real-time stress analysis, and RPG-inspired progression systems.

![FitAtlas Banner](/frontend/public/favicon.ico) *Note: High-fidelity dashboard visualization*

## 🚀 Overview

FitAtlas 2.0 represents the cutting edge of workout tracking. It is built for operators who demand precision, efficiency, and data-driven insights into their physiological development.

- **Neural Atlas**: Interactive 3D/2D muscle mapping for surgical exercise selection.
- **Stress Engine**: Real-time mechanical tension and volume distribution tracking.
- **RPG Evolution**: Gamified progression system with attribute leveling and tier ranks.
- **Tactical Management**: Advanced routine architect supporting supersets and recovery windows.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Framer Motion, Tailwind CSS 4.
- **Backend**: FastAPI (Python), MongoDB (Motor/Beanie), JWT Auth.
- **Visuals**: High-fidelity GIF animation library (>200 exercises).

## 📦 Project Structure

```text
/
├── frontend/          # React + Vite application
├── backend/           # FastAPI + MongoDB service
├── scripts/           # Data seeding and asset management
└── LICENSE            # CC BY-NC 4.0 (Non-Commercial)
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Gym Tracker"
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## ⚖️ License

Distributed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**. 
**Commercial use of this software is strictly prohibited.**

---
*Crafted for the top 1%.*
