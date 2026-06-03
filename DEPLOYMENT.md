# Deployment Guide

This guide covers deploying Aetheris Enterprise Analytics Platform to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Security](#security)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker & Docker Compose v3.8+
- PostgreSQL 15+ (can use Docker container)
- Redis 7+ (for caching)
- Nginx or reverse proxy
- At least 2GB RAM, 2 CPU cores
- Stable internet connection

## Environment Setup

### 1. Clone and Prepare Repository

```bash
git clone https://github.com/aetheris-enterprise/analytics-platform.git
cd analytics-platform
```

### 2. Create Production Environment Files

**backend/.env**

```env
DATABASE_URL=postgresql://aetheris_admin:SecurePassword2026!@db:5432/aetheris_analytics
SECRET_KEY=your-secure-secret-key-here-minimum-32-chars
USE_MOCK_SAP=False
SAP_HOST=your-sap-system.com
SAP_USERNAME=sap_user
SAP_PASSWORD=sap_password
REDIS_URL=redis://redis:6379/0
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

**frontend/.env**

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=APP_NAME
```

### 3. Secure Configuration

Never commit `.env` files with secrets. Use:

- GitHub Secrets for CI/CD
- Cloud provider secret managers (AWS Secrets Manager, Azure Key Vault)
- Kubernetes Secrets (for K8s deployments)

## Docker Deployment

### Quick Start (Single Machine)

```bash
docker-compose up -d
```

Services will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production Deployment

```bash
# Build images
docker-compose build

# Start services with resource limits
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health Checks

```bash
# Check service status
curl http://localhost:8000/health

# Check database connectivity
curl http://localhost:8000/health/db

# Check Redis connectivity
curl http://localhost:8000/health/cache
```

## Configuration

### Backend Configuration

Key environment variables in `backend/app/config.py`:

```python
DATABASE_URL          # PostgreSQL connection string
SECRET_KEY            # JWT secret (min 32 chars)
USE_MOCK_SAP          # Enable mock SAP data (True for testing)
SAP_HOST              # SAP system hostname
SAP_OData_VERSION     # OData API version (v2 or v4)
JWT_EXPIRATION_HOURS  # Token expiration time
REDIS_URL             # Redis connection string
CORS_ORIGINS          # Allowed CORS origins
```

### Frontend Configuration

Key build variables in `frontend/.env`:

```env
VITE_API_URL          # Backend API endpoint
VITE_APP_NAME         # Application title
VITE_LOG_LEVEL        # Debug, info, warn, error
```

### Database Initialization

The backend automatically seeds the database on first run:

- Admin user credentials
- RBAC roles
- Sample SAP data (mock mode)
- Initial ETL configurations

### PostgreSQL Setup

If running PostgreSQL separately:

```bash
# Create database and user
createuser aetheris_admin -P
createdb -O aetheris_admin aetheris_analytics

# Initialize schema
psql -U aetheris_admin -d aetheris_analytics < schema.sql
```

## Database Setup

### Migrations

Backend uses SQLAlchemy with automatic schema creation:

```bash
# Check current schema version
curl http://localhost:8000/health/db

# Manual schema update (if needed)
cd backend
python -c "from app.database import Base; Base.metadata.create_all()"
```

### Backups

Regular backups are critical:

```bash
# Daily backup with cron
0 2 * * * docker exec aetheris_db pg_dump -U aetheris_admin aetheris_analytics > /backups/aetheris_$(date +\%Y\%m\%d).sql

# To restore from backup
psql -U aetheris_admin aetheris_analytics < /backups/aetheris_20260525.sql
```

## Security

### SSL/TLS Configuration

Use a reverse proxy (Nginx) with SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Secret Management

1. **Rotate Secrets Regularly**
   - Change `SECRET_KEY` monthly
   - Update SAP credentials per policy
   - Rotate database passwords quarterly

2. **Access Control**
   - Use IAM roles for cloud deployments
   - Restrict network access with firewalls
   - Enable API rate limiting

3. **Data Encryption**
   - Enable PostgreSQL encryption at rest
   - Use TLS for all network traffic
   - Encrypt sensitive fields in database

### Secrets Management Best Practices

```bash
# Use environment variables for secrets
export DATABASE_URL="postgresql://user:pass@host/db"
export SECRET_KEY="your-secure-key"

# Never commit secrets
echo ".env" >> .gitignore
```

## Monitoring

### Logging

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Structured logging to file
docker-compose logs backend > logs/backend.log
```

### Performance Monitoring

Key metrics to track:

- API response times (target: <500ms)
- Database query duration
- ETL pipeline execution time
- Memory usage
- CPU utilization

### Health Checks

The backend provides health check endpoints:

```bash
# Overall health
GET /health

# Database connection
GET /health/db

# Redis cache
GET /health/cache

# ETL pipeline status
GET /api/etl/status
```

### Alerts

Set up monitoring for:

- Database connection failures
- Redis cache unavailability
- High API response times
- ETL pipeline failures
- Out of memory errors

## Troubleshooting

### Common Issues

**1. Database Connection Error**

```
Error: could not connect to server

Solution:
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Ensure network connectivity
- Check firewall rules
```

**2. Authentication Failures**

```
Error: Invalid token or credentials

Solution:
- Verify SECRET_KEY hasn't changed
- Check JWT_EXPIRATION_HOURS setting
- Clear browser cookies and retry
- Check system time synchronization
```

**3. SAP OData Connection Issues**

```
Error: Failed to connect to SAP

Solution:
- Verify SAP credentials
- Check SAP_HOST is correct
- Verify network access to SAP system
- Check OData endpoint availability
```

**4. High Memory Usage**

```
Solution:
- Check database connection pool size
- Review ETL batch sizes
- Monitor cache memory usage
- Increase available memory or scale out
```

### Debug Mode

Enable debug logging:

```env
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=DEBUG
```

### Accessing Container Shells

```bash
# Backend container
docker exec -it aetheris_backend bash

# Frontend container
docker exec -it aetheris_frontend sh

# Database
docker exec -it aetheris_db psql -U aetheris_admin -d aetheris_analytics
```

## Scaling & Performance

### Horizontal Scaling

For production:

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "1"
          memory: 1G
```

### Load Balancing

Use Nginx or cloud load balancer:

```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

### Caching Strategy

Redis caching for:

- User sessions
- SAP OData query results (TTL: 1 hour)
- Dashboard aggregations (TTL: 30 minutes)

## Disaster Recovery

### Backup Strategy

1. **Daily database backups** (automated)
2. **Weekly full snapshots** (S3/Cloud storage)
3. **Monthly offsite copies** (disaster recovery)

### Recovery Procedure

```bash
# Stop services
docker-compose down

# Restore from backup
psql -U aetheris_admin aetheris_analytics < latest_backup.sql

# Restart services
docker-compose up -d

# Verify integrity
curl http://localhost:8000/health
```

## Support

For deployment issues:

- Check logs: `docker-compose logs`
- Review [ARCHITECTURE.md](ARCHITECTURE.md)
- Open an issue on GitHub

---
