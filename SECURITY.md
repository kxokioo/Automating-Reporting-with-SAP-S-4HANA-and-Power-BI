# Security Policy

## Reporting Security Vulnerabilities

**IMPORTANT:** Do not report security vulnerabilities in public GitHub issues.

If you discover a security vulnerability in Aetheris, please email: **report privately**

Please include:

- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Suggested fix (if available)

We will acknowledge your report within 48 hours and provide an estimated timeline for resolution.

## Security Best Practices

### For Users

#### Password Security

- Use strong, unique passwords (minimum 12 characters)
- Enable MFA if available
- Never share credentials
- Change password if compromised

#### API Key Management

- Treat API keys like passwords
- Rotate keys regularly
- Don't commit keys to version control
- Use `.env` files with `.gitignore`

#### Data Access

- Only request access you need
- Report unauthorized access immediately
- Regularly review your active sessions
- Log out after sensitive operations

### For Developers

#### Code Security

**Dependency Management:**

```bash
# Regular updates
npm audit
pip check

# Lock versions
package-lock.json (always commit)
requirements.txt (pin versions)
```

**Secrets Management:**

```python
# WRONG
SECRET_KEY = "my-super-secret-key"
DATABASE_PASSWORD = "admin123"

# CORRECT
from decouple import config
SECRET_KEY = config('SECRET_KEY')
DATABASE_PASSWORD = config('DATABASE_PASSWORD')
```

**Input Validation:**

```python
# Always validate user input
from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    table_name: str = Field(..., min_length=1, max_length=50)
    limit: int = Field(default=100, ge=1, le=10000)
```

**SQL Injection Prevention:**

```python
# VULNERABLE
query = f"SELECT * FROM users WHERE id = {user_id}"

# SAFE
from sqlalchemy import text
query = text("SELECT * FROM users WHERE id = :id")
db.execute(query, {"id": user_id})
```

**XSS Prevention:**

```jsx
// VULNERABLE
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// SAFE - React escapes by default
<div>{userInput}</div>
```

#### Authentication Security

**JWT Best Practices:**

```python
# Use strong algorithms
JWT_ALGORITHM = "HS256"  # or RS256 for asymmetric

# Short expiration times
JWT_EXPIRATION_HOURS = 24

# Include minimal claims
payload = {
    "sub": user_id,
    "role": user_role,
    "iat": datetime.utcnow(),
    "exp": datetime.utcnow() + timedelta(hours=24)
}
```

**Password Hashing:**

```python
# Use bcrypt with proper cost factor
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash(password, rounds=12)
```

#### Authorization Security

**RBAC Implementation:**

```python
 Always check permissions
from fastapi import Depends, HTTPException

async def require_role(required_role: str):
    async def check_role(current_user = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user
    return check_role

@router.post("/etl/trigger")
async def trigger_etl(user = Depends(require_role("admin"))):
    # ETL logic
    pass
```

#### API Security

**Rate Limiting:**

```python
# Implement rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/data")
@limiter.limit("100/minute")
async def get_data():
    pass
```

**CORS Configuration:**

```python
# Restrict CORS origins
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://app.yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
```

**HTTPS Only:**

```python
# Force HTTPS in production
if settings.environment == "production":
    assert settings.api_url.startswith("https://")
```

### For Operators/DevOps

#### Environment Configuration

**.env Protection:**

```bash
# Secure .env file
chmod 600 .env
echo ".env" >> .gitignore

# Use secrets manager
export SECRET_KEY=$(aws secretsmanager get-secret-value --secret-id aetheris/secret-key)
```

#### Database Security

**PostgreSQL Configuration:**

```sql
-- Strong password policies
ALTER USER aetheris_admin WITH PASSWORD 'VerySecurePassword!#@2026';

-- Restrict connections
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/cert.pem';

-- Row-level security
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON sensitive_data
    USING (user_id = current_user_id());
```

**Backup Security:**

```bash
# Encrypt backups
pg_dump -U aetheris_admin aetheris_analytics | \
    gpg --encrypt --recipient backup@aetheris.dev > backup.sql.gpg

# Store securely
mv backup.sql.gpg /secure/backup/location/
chmod 600 /secure/backup/location/backup.sql.gpg
```

#### Container Security

**Dockerfile Best Practices:**

```dockerfile
# Use minimal base images
FROM python:3.10-slim

# Don't run as root
RUN useradd -m appuser
USER appuser

# Use secrets, not ENV
RUN --mount=type=secret,id=secret_key \
    SECRET=$(cat /run/secrets/secret_key) && \
    export SECRET=$SECRET
```

**Container Registry Security:**

```bash
# Scan for vulnerabilities
docker scan aetheris_backend

# Use image signing
docker trust signer add --key cert.pem mykey registry.example.com/aetheris
```

#### Network Security

**Firewall Rules:**

```bash
# Restrict database access
ufw allow from 10.0.1.0/24 to any port 5432

# API access only from trusted networks
ufw allow from 0.0.0.0/0 to any port 443
ufw deny from 0.0.0.0/0 to any port 8000  # Internal only
```

**VPN/SSL Configuration:**

```nginx
# SSL/TLS with strong ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

#### Logging & Monitoring

**Security Audit Logging:**

```python
# Log all security events
def audit_log(event_type: str, user_id: str, details: dict):
    logger.info(
        "SECURITY_EVENT",
        extra={
            "event_type": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details
        }
    )

# Usage
audit_log("login_attempt", user_id, {"status": "success", "ip": "192.168.1.1"})
audit_log("unauthorized_access", user_id, {"resource": "/admin", "denied": True})
```

**Monitoring Security Alerts:**

- Failed login attempts (5+ per minute)
- Unauthorized API calls (403 errors)
- Database errors
- Suspicious patterns

#### Compliance

**Data Protection:**

- GDPR: User data retention policies
- SOX: Audit trail requirements
- HIPAA: Encryption for health data
- PCI DSS: Payment data handling

**Regular Security Tasks:**

```bash
# Monthly
- Dependency updates and audits
- Security patch reviews
- Access control review

# Quarterly
- Penetration testing
- Password rotation
- Backup restoration testing

# Annually
- Security audit
- Compliance review
- Disaster recovery drill
```

## Security Checklist

- [ ] All dependencies are up to date
- [ ] No hardcoded secrets or credentials
- [ ] HTTPS/TLS enabled in production
- [ ] Database has strong passwords
- [ ] RBAC properly enforced
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Logging/monitoring configured
- [ ] Backups tested and encrypted
- [ ] Firewall rules in place
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented

## Incident Response

### If You Discover a Vulnerability

1. **Stop using the affected system** (if critical)
2. **Immediately report** to to me
3. **Provide details** of the vulnerability
4. **Do not share** in public forums

### Our Response

1. **Acknowledgment** within 48 hours
2. **Triage** severity level
3. **Create patch** (critical: 24 hours, high: 1 week)
4. **Notify users** before public disclosure
5. **Credit** the security researcher (if desired)

## Security Updates

### Release Schedule

- Security patches: immediate for critical
- Minor fixes: weekly
- Major updates: quarterly

### Notification

- GitHub Security Advisories
- Release notes

## Third-Party Security

### Third-Party Dependencies

- Regularly updated via dependabot
- Vulnerability scanning (npm audit, pip check)
- License compliance checks

### SAP Integration Security

- Credentials encrypted at rest
- TLS for all SAP communication
- Minimal OData entity exposure
- Query result validation

## Questions & Support

- Security documentation: [SECURITY.md](SECURITY.md)
- Report vulnerability: report privately via GitHub.
- General questions: Please open a GitHub Issue or start a Discussion in this repository.

---

**Security is everyone's responsibility. Thank you for helping keep Aetheris secure!**
