# FitAtlas Backend Service

The tactical core of the FitAtlas intelligence engine. Built with FastAPI and MongoDB for low-latency data processing and biomechanical calculations.

## 🏗 Architecture

- **FastAPI**: Modern, high-performance web framework.
- **Beanie ODM**: Asynchronous Python object-document mapper for MongoDB.
- **JWT Security**: Secure operator authentication and state persistence.
- **Seed System**: Automated data propagation for exercise libraries and muscle mappings.

## 📂 Structure

- `app/main.py`: Application entry point and router integration.
- `app/models.py`: Data schemas for Exercises, Routines, and Sessions.
- `app/logic/`: Core business logic (Efficiency, Recovery, Focus Distribution).
- `app/routers/`: API endpoints categorized by domain.
- `scripts/`: Maintenance and data seeding scripts.

## 🔧 Local Development

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Database Configuration**:
   Ensure MongoDB is running at `mongodb://localhost:27017` or configure via environment variables.

3. **Seeding Data**:
   ```bash
   $env:PYTHONPATH="."
   python scripts/seed.py
   ```

4. **Launch Service**:
   ```bash
   uvicorn app.main:app --reload
   ```

## 🧪 API Documentation
Once running, visit `http://localhost:8000/docs` for the interactive Swagger UI.
