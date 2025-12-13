# Testing Documentation

## Overview
This project uses Jest as the testing framework with React Native Testing Library for component testing.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in CI mode
```bash
npm run test:ci
```

## Test Structure

```
src/__tests__/
├── __mocks__/          # Mock utilities
│   ├── axiosMock.ts    # Axios mocking helpers
│   └── fileMock.js     # File mock for assets
├── setup.ts            # Global test setup
├── services/           # Service layer tests
│   ├── auth.service.test.ts
│   ├── event.service.test.ts
│   └── club.service.test.ts
├── integration/        # Integration tests
│   └── auth-flow.test.ts
└── components/         # Component tests
    ├── ui.test.tsx
    └── ui.snapshot.test.tsx
```

## Test Coverage Goals

Target coverage: **70%** for:
- Branches
- Functions
- Lines
- Statements

Current test files:
-   Auth Service (15 tests)
-   Event Service (15 tests)
-   Club Service (7 tests)
-   Authentication Flow Integration (12 tests)
-   UI Components (16 tests)

**Total: 65+ tests**

## Writing Tests

### Unit Tests for Services

```typescript
import { AuthService } from '@services/auth.service';
import { axiosPublic } from '@configs/axios';
import { mockAxiosResponse } from '../__mocks__/axiosMock';

jest.mock('@configs/axios');

describe('AuthService', () => {
  it('should login successfully', async () => {
    const mockResponse = { token: 'jwt-token' };
    axiosPublic.post.mockResolvedValue(mockAxiosResponse(mockResponse));
    
    const result = await AuthService.login(credentials);
    expect(result.token).toBe('jwt-token');
  });
});
```

### Integration Tests

```typescript
describe('Authentication Flow', () => {
  it('should complete full login flow', async () => {
    // 1. Mock dependencies
    // 2. Execute actions
    // 3. Verify state changes
    // 4. Verify side effects
  });
});
```

### Snapshot Tests

```typescript
import { render } from '@testing-library/react-native';

it('should match snapshot', () => {
  const { toJSON } = render(<Button>Click Me</Button>);
  expect(toJSON()).toMatchSnapshot();
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Mock API calls, storage, etc.
3. **Clear Test Names**: Use descriptive test names
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Update Snapshots**: Review snapshot changes carefully

## Continuous Integration

Tests run automatically on:
- Push to `master` or `develop` branches
- Pull requests to `master` or `develop`

CI Pipeline includes:
- Unit tests
- Integration tests
- Coverage reporting
- TypeScript type checking
- Build verification

## Coverage Reports

After running tests with coverage, open the HTML report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Troubleshooting

### Tests failing after dependency update
```bash
npm ci
npm test
```

### Mock not working
Check that the mock is properly configured in `src/__tests__/setup.ts`

### Snapshot mismatch
```bash
npm test -- -u  # Update snapshots
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
