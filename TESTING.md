# 🧪 BloodNet+ Testing Guide

## 📋 Overview

This guide covers testing strategies, test setup, and best practices for the BloodNet+ application.

## 🏗️ Testing Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Unit Tests     │    │  Integration    │    │   E2E Tests     │
│                 │    │    Tests        │    │                 │
│ • Jest          │    │ • Supertest     │    │ • Cypress       │
│ • React Testing │    │ • MongoDB Memory│    │ • Playwright    │
│ • Library       │    │ • Test Database │    │ • Selenium      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Backend Testing

### Setup

Install testing dependencies:

```bash
cd backend
npm install --save-dev jest supertest mongodb-memory-server @types/jest
```

### Jest Configuration

Create `backend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};
```

### Test Setup

Create `backend/tests/setup.js`:

```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

### Unit Tests

#### Model Tests

Create `backend/tests/models/User.test.js`:

```javascript
const User = require('../../models/User');

describe('User Model', () => {
  test('should create a valid user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'donor',
      bloodGroup: 'A+',
      location: {
        lat: 40.7128,
        lng: -74.0060,
        address: '123 Main St'
      }
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.password).not.toBe(userData.password); // Should be hashed
    expect(savedUser.role).toBe(userData.role);
  });

  test('should require email', async () => {
    const user = new User({
      name: 'John Doe',
      password: 'password123'
    });

    await expect(user.save()).rejects.toThrow();
  });

  test('should validate blood group', async () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      bloodGroup: 'Z+' // Invalid blood group
    });

    await expect(user.save()).rejects.toThrow();
  });
});
```

#### Controller Tests

Create `backend/tests/controllers/authController.test.js`:

```javascript
const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'donor',
        bloodGroup: 'A+'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
    });

    test('should not register user with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        role: 'donor'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should not register user with duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'donor'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'donor'
      });
      await user.save();
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    test('should not login with invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
```

### Integration Tests

Create `backend/tests/integration/requests.test.js`:

```javascript
const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Request = require('../../models/Request');

describe('Requests Integration', () => {
  let donorToken, recipientToken;

  beforeEach(async () => {
    // Create donor
    const donorResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'donor@example.com',
        password: 'password123',
        role: 'donor',
        bloodGroup: 'A+'
      });
    donorToken = donorResponse.body.token;

    // Create recipient
    const recipientResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Smith',
        email: 'recipient@example.com',
        password: 'password123',
        role: 'recipient'
      });
    recipientToken = recipientResponse.body.token;
  });

  describe('POST /api/requests/create', () => {
    test('should create blood request with authentication', async () => {
      const requestData = {
        bloodGroup: 'A+',
        unitsNeeded: 2,
        urgency: 'urgent',
        location: {
          lat: 40.7128,
          lng: -74.0060,
          address: '123 Main St'
        }
      };

      const response = await request(app)
        .post('/api/requests/create')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.request.bloodGroup).toBe(requestData.bloodGroup);
      expect(response.body.request.status).toBe('pending');
    });

    test('should not create request without authentication', async () => {
      const requestData = {
        bloodGroup: 'A+',
        unitsNeeded: 2,
        urgency: 'urgent'
      };

      const response = await request(app)
        .post('/api/requests/create')
        .send(requestData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/requests', () => {
    beforeEach(async () => {
      // Create a test request
      await request(app)
        .post('/api/requests/create')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({
          bloodGroup: 'A+',
          unitsNeeded: 2,
          urgency: 'urgent',
          location: {
            lat: 40.7128,
            lng: -74.0060,
            address: '123 Main St'
          }
        });
    });

    test('should get requests with authentication', async () => {
      const response = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.requests)).toBe(true);
      expect(response.body.requests.length).toBe(1);
    });
  });
});
```

## 🎨 Frontend Testing

### Setup

Install testing dependencies:

```bash
cd frontend
npm install --save-dev @testing-library/jest-dom @testing-library/user-event @testing-library/react jest-environment-jsdom
```

### Jest Configuration

Update `frontend/package.json`:

```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:ci": "react-scripts test --coverage --watchAll=false --ci"
  }
}
```

### Component Tests

Create `frontend/src/components/__tests__/Navbar.test.js`:

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { AuthProvider } from '../../contexts/AuthContext';

const MockedNavbar = () => (
  <BrowserRouter>
    <AuthProvider>
      <Navbar />
    </AuthProvider>
  </BrowserRouter>
);

describe('Navbar Component', () => {
  test('renders navigation links', () => {
    render(<MockedNavbar />);
    
    expect(screen.getByText('BloodNet+')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('shows user menu when logged in', () => {
    // Mock authenticated user
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'donor'
    };

    render(
      <BrowserRouter>
        <AuthProvider value={{ user: mockUser }}>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('handles logout click', () => {
    const mockLogout = jest.fn();
    
    render(
      <BrowserRouter>
        <AuthProvider value={{ user: { name: 'John Doe' }, logout: mockLogout }}>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });
});
```

### Page Tests

Create `frontend/src/pages/__tests__/LoginPage.test.js`:

```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';

const MockedLoginPage = () => (
  <BrowserRouter>
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  </BrowserRouter>
);

describe('LoginPage', () => {
  test('renders login form', () => {
    render(<MockedLoginPage />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    render(<MockedLoginPage />);
    
    const loginButton = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    const mockLogin = jest.fn();
    
    render(
      <BrowserRouter>
        <AuthProvider value={{ login: mockLogin }}>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });

    const loginButton = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123'
      });
    });
  });
});
```

### Hook Tests

Create `frontend/src/hooks/__tests__/useAuth.test.js`:

```javascript
import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../useAuth';

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  test('should return initial state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(true);
  });

  test('should login user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'donor'
    };

    await act(async () => {
      await result.current.login(mockUser.email, 'password123');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  test('should logout user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // First login
    await act(async () => {
      await result.current.login('john@example.com', 'password123');
    });

    // Then logout
    await act(async () => {
      result.current.logout();
    });

    expect(result.current.user).toBe(null);
  });
});
```

## 🔄 E2E Testing

### Cypress Setup

Install Cypress:

```bash
npm install --save-dev cypress
npx cypress open
```

### Cypress Configuration

Create `cypress.config.js`:

```javascript
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720
  }
};
```

### E2E Tests

Create `cypress/e2e/auth.cy.js`:

```javascript
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should register a new user', () => {
    cy.get('[data-testid="register-link"]').click();
    
    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="confirm-password-input"]').type('password123');
    cy.get('[data-testid="role-select"]').select('donor');
    cy.get('[data-testid="blood-group-select"]').select('A+');
    
    cy.get('[data-testid="register-button"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-name"]').should('contain', 'John Doe');
  });

  it('should login with valid credentials', () => {
    cy.get('[data-testid="login-link"]').click();
    
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    
    cy.get('[data-testid="login-button"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-name"]').should('contain', 'John Doe');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid="login-link"]').click();
    
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
  });
});
```

Create `cypress/e2e/blood-requests.cy.js`:

```javascript
describe('Blood Requests', () => {
  beforeEach(() => {
    // Login as recipient
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('recipient@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
  });

  it('should create a blood request', () => {
    cy.get('[data-testid="create-request-button"]').click();
    
    cy.get('[data-testid="blood-group-select"]').select('A+');
    cy.get('[data-testid="units-needed-input"]').type('2');
    cy.get('[data-testid="urgency-select"]').select('urgent');
    cy.get('[data-testid="location-input"]').type('123 Main St, New York');
    cy.get('[data-testid="medical-reason-input"]').type('Surgery');
    
    cy.get('[data-testid="submit-request-button"]').click();
    
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="request-list"]').should('contain', 'A+');
  });

  it('should display request status updates', () => {
    // Create request first
    cy.get('[data-testid="create-request-button"]').click();
    cy.get('[data-testid="blood-group-select"]').select('A+');
    cy.get('[data-testid="units-needed-input"]').type('2');
    cy.get('[data-testid="urgency-select"]').select('urgent');
    cy.get('[data-testid="submit-request-button"]').click();
    
    // Check status
    cy.get('[data-testid="request-status"]').should('contain', 'pending');
    
    // Simulate donor acceptance (this would need backend mocking)
    cy.get('[data-testid="request-status"]').should('contain', 'accepted');
  });
});
```

## 📊 Test Coverage

### Coverage Reports

Generate coverage reports:

```bash
# Backend coverage
cd backend
npm run test:coverage

# Frontend coverage
cd frontend
npm run test:coverage
```

### Coverage Thresholds

Set coverage thresholds in `backend/jest.config.js`:

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 🚀 CI/CD Testing

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          
      - name: Run tests
        run: |
          cd backend
          npm run test:coverage
          
      - name: Upload coverage
        uses: codecov/codecov-action@v1
        with:
          file: ./backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Run tests
        run: |
          cd frontend
          npm run test:ci
          
      - name: Upload coverage
        uses: codecov/codecov-action@v1
        with:
          file: ./frontend/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
          
      - name: Start services
        run: |
          cd backend
          npm start &
          sleep 10
          cd ../frontend
          npm start &
          sleep 10
          
      - name: Run E2E tests
        run: |
          cd frontend
          npx cypress run --record --key ${{ secrets.CYPRESS_RECORD_KEY }}
```

## 📝 Test Data Management

### Test Database

Use MongoDB Memory Server for isolated testing:

```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

### Test Fixtures

Create `backend/tests/fixtures/users.js`:

```javascript
exports.validDonor = {
  name: 'John Doe',
  email: 'donor@example.com',
  password: 'password123',
  role: 'donor',
  bloodGroup: 'A+',
  location: {
    lat: 40.7128,
    lng: -74.0060,
    address: '123 Main St, New York, NY'
  },
  donorHealthDetails: {
    age: 25,
    weight: 70,
    hemoglobin: 14.5
  }
};

exports.validRecipient = {
  name: 'Jane Smith',
  email: 'recipient@example.com',
  password: 'password123',
  role: 'recipient',
  location: {
    lat: 40.7128,
    lng: -74.0060,
    address: '456 Oak Ave, New York, NY'
  }
};
```

## 🔍 Debugging Tests

### Debug Mode

Run tests in debug mode:

```bash
# Backend
cd backend
node --inspect-brk node_modules/.bin/jest --runInBand

# Frontend
cd frontend
npm test -- --runInBand --no-cache
```

### Test Logs

Add detailed logging:

```javascript
// In test files
test('should create user', async () => {
  console.log('Starting user creation test...');
  
  const user = new User(userData);
  const savedUser = await user.save();
  
  console.log('User saved:', savedUser);
  expect(savedUser.name).toBe(userData.name);
  
  console.log('Test completed successfully');
});
```

## 📈 Performance Testing

### Load Testing

Use Artillery for load testing:

```yaml
# artillery.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20

scenarios:
  - name: "Login and Create Request"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
      - post:
          url: "/api/requests/create"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            bloodGroup: "A+"
            unitsNeeded: 2
            urgency: "urgent"
```

### Performance Monitoring

Monitor test performance:

```javascript
describe('Performance Tests', () => {
  test('should respond within 200ms', async () => {
    const start = Date.now();
    
    await request(app)
      .get('/api/requests')
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
  });
});
```

## 🎯 Best Practices

1. **Test Structure**: Arrange, Act, Assert pattern
2. **Test Isolation**: Each test should be independent
3. **Descriptive Names**: Use clear, descriptive test names
4. **Mock External Services**: Mock APIs and databases
5. **Coverage**: Aim for 80%+ code coverage
6. **Continuous Testing**: Run tests on every commit
7. **Test Data**: Use consistent test fixtures
8. **Error Cases**: Test both success and failure scenarios

## 📞 Support

For testing support:
- Email: test-support@bloodnetplus.com
- Documentation: [Test Docs](https://docs.bloodnetplus.com/testing)
- Issues: [GitHub Issues](https://github.com/your-username/bloodnet-plus/issues)

---

**Last Updated**: January 15, 2024
**Version**: v1.0.0
