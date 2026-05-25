# Contributing to Aetheris

Thank you for your interest in contributing to Aetheris Enterprise Analytics Platform! We welcome contributions from the community. This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before participating in this project.

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- Docker & Docker Compose (for production deployment)
- Git

### Local Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/yourusername/aetheris-platform.git
   cd aetheris-platform
   ```

2. **Set up environment variables**

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Install backend dependencies**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   ```

5. **Start development servers**
   - Terminal 1 (Backend): `cd backend && python app/main.py`
   - Terminal 2 (Frontend): `cd frontend && npm run dev`

## Development Workflow

### Branch Naming

- Feature: `feature/description` (e.g., `feature/sap-integration`)
- Bugfix: `bugfix/description` (e.g., `bugfix/auth-token-expiry`)
- Hotfix: `hotfix/description` (e.g., `hotfix/critical-data-loss`)

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Example:

```
feat(etl): add multi-threaded SAP OData sync

Implement thread-safe ETL pipeline for concurrent data extraction
from SAP S/4HANA OData endpoints with proper error handling.

Fixes #123
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes and commit with meaningful messages
3. Push to your fork and create a Pull Request
4. Ensure all tests pass in CI/CD pipeline
5. Request review from maintainers
6. Address review feedback
7. Once approved, your PR will be merged

### Code Style

**Python:**

- Follow PEP 8
- Use type hints
- Max line length: 100 characters
- Format with `black` (recommended)

**TypeScript/React:**

- Use ESLint & Prettier
- Follow React best practices
- Use functional components with hooks
- Props should be properly typed

### Testing

**Backend:**

```bash
cd backend
pytest              # Run all tests
pytest -v           # Verbose output
pytest --cov        # With coverage
```

**Frontend:**

```bash
cd frontend
npm run test        # Run tests (when available)
npm run build       # Build for production
```

### Running the Full Stack

Using Docker Compose:

```bash
docker-compose up --build
```

Then access:

- Frontend: http://127.0.0.1:3000
- Backend API: http://127.0.0.1:8000
- API Docs: http://127.0.0.1:8000/docs

## Reporting Issues

### Security Issues

**Do NOT open public issues for security vulnerabilities.** Please email security@aetheris.dev with details.

### Bug Reports

Include:

- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node/Python versions)
- Screenshots if applicable

### Feature Requests

- Describe the use case
- Explain the expected behavior
- Provide examples/mockups if helpful

## Documentation

- Update README.md for major changes
- Document new API endpoints
- Add docstrings to functions and classes
- Update ARCHITECTURE.md for structural changes
- Keep DEPLOYMENT.md current with deployment procedures

## Areas for Contribution

### High Priority

- [ ] Enhanced SAP OData query filtering
- [ ] Performance optimization for large datasets
- [ ] Additional RLS (Row-Level Security) scenarios
- [ ] Mobile-responsive dashboard improvements

### Medium Priority

- [ ] Additional authentication methods (OAuth, SAML)
- [ ] Export formats (CSV, Excel, PDF)
- [ ] Audit logging enhancements
- [ ] Webhook support for ETL events

### Low Priority

- [ ] UI/UX refinements
- [ ] Documentation improvements
- [ ] Example usage guides
- [ ] Performance monitoring tools

## Questions?

- Check existing [GitHub Issues](../../issues)
- Review [Architecture Documentation](ARCHITECTURE.md)
- Check [Deployment Guide](DEPLOYMENT.md)

## License

By contributing to Aetheris, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🚀
