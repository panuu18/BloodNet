# 📚 BloodNet+ API Documentation

## 🚀 Overview

BloodNet+ provides a comprehensive RESTful API for managing blood donations, connecting donors, recipients, and hospitals in real-time.

## 🔗 Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.bloodnetplus.com/api`

## 🔐 Authentication

All API endpoints (except auth routes) require JWT authentication.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 📝 API Endpoints

### 🧾 Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "donor|recipient|hospital",
  "phone": "+1234567890",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY"
  },
  "bloodGroup": "A+|A-|B+|B-|AB+|AB-|O+|O-",
  "age": 25,
  "gender": "male|female|other"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor"
  }
}
```

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor"
  }
}
```

#### Logout User
```http
POST /auth/logout
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 👤 User Management

#### Get User Profile
```http
GET /users/profile
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "donor",
    "bloodGroup": "A+",
    "isAvailable": true,
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "address": "123 Main St, New York, NY"
    },
    "donorHealthDetails": {
      "age": 25,
      "weight": 70,
      "hemoglobin": 14.5
    }
  }
}
```

#### Update User Profile
```http
PUT /users/profile
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY"
  },
  "isAvailable": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "phone": "+1234567890",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "address": "123 Main St, New York, NY"
    },
    "isAvailable": true
  }
}
```

#### Get Donation History
```http
GET /users/donation-history
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "donations": [
    {
      "id": "donation_id",
      "recipientName": "Jane Smith",
      "bloodGroup": "A+",
      "unitsDonated": 1,
      "donationDate": "2024-01-15T10:30:00Z",
      "hospitalName": "General Hospital",
      "certificateId": "cert_123"
    }
  ]
}
```

#### Search Nearby Donors
```http
POST /users/search-donors
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "bloodGroup": "A+",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "radius": 50
}
```

**Response:**
```json
{
  "success": true,
  "donors": [
    {
      "id": "donor_id",
      "name": "John Doe",
      "bloodGroup": "A+",
      "location": {
        "lat": 40.7130,
        "lng": -74.0062,
        "address": "125 Main St, New York, NY"
      },
      "distance": 0.2,
      "isAvailable": true,
      "donorHealthDetails": {
        "age": 25,
        "weight": 70,
        "hemoglobin": 14.5
      }
    }
  ]
}
```

### 🩸 Blood Requests

#### Create Blood Request
```http
POST /requests/create
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "bloodGroup": "A+",
  "unitsNeeded": 2,
  "urgency": "emergency|urgent|normal",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY"
  },
  "medicalReason": "Surgery",
  "notes": "Patient needs blood urgently"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blood request created successfully",
  "request": {
    "id": "request_id",
    "bloodGroup": "A+",
    "unitsNeeded": 2,
    "urgency": "emergency",
    "status": "pending",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "address": "123 Main St, New York, NY"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get All Blood Requests
```http
GET /requests
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Query Parameters:**
- `status`: `pending|accepted|rejected|completed`
- `bloodGroup`: `A+|A-|B+|B-|AB+|AB-|O+|O-`
- `limit`: Number of requests (default: 10)
- `page`: Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "request_id",
      "bloodGroup": "A+",
      "unitsNeeded": 2,
      "urgency": "emergency",
      "status": "pending",
      "recipientName": "Jane Smith",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060,
        "address": "123 Main St, New York, NY"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Accept Blood Request
```http
PUT /requests/:id/accept
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blood request accepted successfully",
  "request": {
    "id": "request_id",
    "status": "accepted",
    "donorId": "donor_id",
    "acceptedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### Reject Blood Request
```http
PUT /requests/:id/reject
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blood request rejected successfully",
  "request": {
    "id": "request_id",
    "status": "rejected",
    "rejectedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### Complete Blood Request
```http
PUT /requests/:id/complete
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "message": "Blood request completed successfully",
  "request": {
    "id": "request_id",
    "status": "completed",
    "completedAt": "2024-01-15T12:00:00Z",
    "certificateId": "cert_123"
  }
}
```

### 🏥 Hospital Management

#### Get Hospital Inventory
```http
GET /hospitals/inventory
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "inventory": [
    {
      "bloodGroup": "A+",
      "unitsAvailable": 15,
      "minThreshold": 5,
      "maxCapacity": 50,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Update Hospital Inventory
```http
PUT /hospitals/inventory
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "bloodGroup": "A+",
  "unitsAvailable": 20,
  "minThreshold": 5,
  "maxCapacity": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory updated successfully",
  "inventory": {
    "bloodGroup": "A+",
    "unitsAvailable": 20,
    "minThreshold": 5,
    "maxCapacity": 50,
    "lastUpdated": "2024-01-15T11:00:00Z"
  }
}
```

#### Get Hospital Statistics
```http
GET /hospitals/stats
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalBloodUnits": 150,
    "pendingRequests": 5,
    "completedRequests": 25,
    "donorsRegistered": 50,
    "lowStockAlerts": 2,
    "monthlyStats": [
      {
        "month": "January",
        "requestsReceived": 30,
        "requestsCompleted": 25,
        "bloodCollected": 45
      }
    ]
  }
}
```

#### Get All Blood Requests (Hospital)
```http
GET /hospitals/requests
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "request_id",
      "bloodGroup": "A+",
      "unitsNeeded": 2,
      "urgency": "emergency",
      "status": "pending",
      "recipientName": "Jane Smith",
      "distance": 2.5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 🔔 Notifications

#### Get User Notifications
```http
GET /notifications
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notification_id",
      "title": "New Blood Request",
      "message": "Emergency: 2 units of A+ blood needed",
      "type": "blood_request",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Mark Notification as Read
```http
PUT /notifications/:id/read
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### Mark All Notifications as Read
```http
PUT /notifications/read-all
```

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

## 🔄 Real-time Events (Socket.IO)

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Events

#### newBloodRequest
Fired when a new blood request is created.

```javascript
socket.on('newBloodRequest', (data) => {
  console.log('New blood request:', data.request);
});
```

**Data:**
```json
{
  "request": {
    "id": "request_id",
    "bloodGroup": "A+",
    "unitsNeeded": 2,
    "urgency": "emergency",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "address": "123 Main St, New York, NY"
    }
  },
  "type": "new_request",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### requestUpdate
Fired when a request status is updated.

```javascript
socket.on('requestUpdate', (data) => {
  console.log('Request updated:', data);
});
```

**Data:**
```json
{
  "requestId": "request_id",
  "status": "accepted",
  "updatedBy": "donor_id",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

#### newNotification
Fired when a new notification is created.

```javascript
socket.on('newNotification', (notification) => {
  console.log('New notification:', notification);
});
```

**Data:**
```json
{
  "id": "notification_id",
  "title": "New Blood Request",
  "message": "Emergency: 2 units of A+ blood needed",
  "type": "blood_request",
  "userId": "user_id",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## ❌ Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication token
- `FORBIDDEN` (403): User doesn't have permission to access resource
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `SERVER_ERROR` (500): Internal server error

## 📝 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Window**: 15 minutes
- **Max Requests**: 100 per window per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🔍 Pagination

List endpoints support pagination:

- `limit`: Number of items per page (default: 10, max: 100)
- `page`: Page number (default: 1)
- `sort`: Sort field (default: `createdAt`)
- `order`: Sort order (`asc` or `desc`, default: `desc`)

## 🌍 Geospatial Queries

Location-based endpoints support geospatial queries:

- `location.lat`: Latitude
- `location.lng`: Longitude
- `radius`: Search radius in kilometers (default: 50)

## 📊 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": {}, // or "users", "requests", etc.
  "message": "Success message",
  "pagination": {} // for list endpoints
}
```

## 🧪 Testing

### Example cURL Commands

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "donor",
    "bloodGroup": "A+"
  }'

# Login user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get user profile
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📞 Support

For API support and questions:
- Email: api-support@bloodnetplus.com
- GitHub Issues: [Create Issue](https://github.com/your-username/bloodnet-plus/issues)
- Documentation: [API Docs](https://docs.bloodnetplus.com/api)

---

**Last Updated**: January 15, 2024
**API Version**: v1.0.0
