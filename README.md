# Digital Storefront Platform

A modern, production-grade Digital Storefront built with a microservices architecture. It demonstrates Real-world engineering & cloud deployment techniques, perfect for showcasing React development coupled with Flask backends.

## 🚀 Technologies Used

- **Frontend**: React, React Router, Redux Toolkit, Tailwind CSS, Vite
- **Backend**: Python, Flask, SQLAlchemy, JWT
- **Databases**: PostgreSQL (Relational Data), Redis (Caching)
- **Containerization**: Docker, Docker Compose

## 🏗️ Architecture

This project is built using a Microservices Architecture:
- `Frontend`: React Application Served natively via Vite/Nginx
- `Identity Service`: Handles Authentication and Users (Flask)
- `Catalog Service`: Handles Products and Categories (Flask)
- `Commerce Service`: Handles Cart and Orders (Flask)

## 🐳 How to Run (Docker)

To run the full stack including databases and all microservices, simply use Docker Compose:

```bash
docker-compose up --build
```

The application will be available at:
- Web Frontend: `http://localhost:3000`
- Identity API: `http://localhost:5001/api/...`
- Catalog API: `http://localhost:5002/api/...`
- Commerce API: `http://localhost:5003/api/...`

### Seed Data
The database handles schema generation on startup. To seed the catalog with products run:
```bash
curl -X POST http://localhost:3000/api/products/seed
```

## ☁️ Azure Deployment Strategy

This repository is intentionally structured to be easily deployed to Azure natively:
- **Frontend** -> Azure Static Web Apps
- **Identity/Catalog/Commerce** -> Azure App Service / Azure Container Apps
- **Postgres** -> Azure Database for PostgreSQL
- **Redis** -> Azure Cache for Redis

## Mock Env Note
*(Note: If you run the frontend independently using `npm run dev` outside of docker, it utilizes a custom Axios interceptor to mock data since the backend isn't mounted!)*
