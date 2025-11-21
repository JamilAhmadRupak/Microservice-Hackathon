# Contributing to CareForAll

## Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Install dependencies: `npm install` in each service
4. Make your changes
5. Run tests: `npm test`
6. Commit: `git commit -m "Add your feature"`
7. Push: `git push origin feature/your-feature`
8. Create a Pull Request

## Code Standards

- Use CommonJS (require/module.exports)
- Follow existing code structure
- Add tests for new features
- Update documentation
- Use meaningful commit messages

## Testing

- Unit tests required for new services
- Integration tests encouraged
- Test idempotency and state machines
- Aim for >80% coverage

## Service Architecture

Each service should:
- Be stateless
- Use shared utilities
- Implement proper error handling
- Include logging with correlation IDs
- Support graceful shutdown

## Pull Request Guidelines

- One feature per PR
- Include tests
- Update README if needed
- Pass all CI checks
- Get at least one review
