# 🩸 BloodNet+ - Real-Time Blood Donation Platform

A comprehensive, production-ready web application that connects blood donors, recipients, and hospitals in real-time. Built with modern technologies and featuring a beautiful, responsive UI.

## 🌟 Features

### 👥 Multi-Role System
- **Recipients**: Search for donors, create blood requests, track request status
- **Donors**: View donation requests, accept/reject donations, manage availability
- **Hospitals**: Manage blood inventory, respond to requests, track statistics

### 🔄 Real-Time Features
- **Live Notifications**: Instant updates via Socket.IO
- **Real-Time Request Updates**: See request status changes instantly
- **Location-Based Matching**: Find nearby donors and hospitals
- **Real-Time Inventory Updates**: Live blood stock tracking

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on mobile and desktop
- **Beautiful Animations**: Smooth transitions with Framer Motion
- **Modern Medical Theme**: Clean, professional interface
- **Accessibility**: WCAG compliant design
- **Collapsible Sections**: Card-like buttons for better organization

### 🔐 Security & Performance
- **JWT Authentication**: Secure token-based auth system
- **Role-Based Access**: Proper authorization for each user type
- **Input Validation**: Comprehensive form validation
- **Password Hashing**: Secure password storage with bcrypt
- **CORS Protection**: Cross-origin resource sharing security

### � Advanced Features
- **Certificate Generation**: Digital donation certificates
- **Impact Tracking**: Lives saved statistics
- **Donation History**: Complete donation records
- **Hospital Analytics**: Comprehensive statistics
- **Map Integration**: Google Maps for location services

## �🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **multer** - File upload handling
- **qrcode** - QR code generation
- **dotenv** - Environment variable management

### Frontend
- **React.js** - UI framework with Hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Heroicons** - Icon library
- **Socket.IO Client** - Real-time communication

### External Services
- **Google Maps API** - Location services
- **MongoDB Atlas** - Cloud database (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google Maps API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bloodnet-plus.git
   cd bloodnet-plus
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your credentials
   
   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or connect to MongoDB Atlas
   ```

5. **Run the application**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm start
   
   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Usage

### For Recipients
1. Register as a recipient
2. Create blood donation requests
3. Track request status in real-time
4. View nearby donors and hospitals

### For Donors
1. Register as a donor with health details
2. Set availability status
3. View and accept donation requests
4. Track donation history and certificates

### For Hospitals
1. Register as a hospital
2. Manage blood inventory
3. Respond to blood requests
4. View analytics and statistics

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
MONGODB_URI=mongodb://localhost:27017/bloodnet
PORT=5000
JWT_SECRET=your_secure_jwt_secret_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
```

#### Frontend (.env)
```bash
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NAME=BloodNet+
REACT_APP_VERSION=1.0.0
NODE_ENV=development
```

### Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Maps JavaScript API" and "Geocoding API"
4. Create API key with appropriate restrictions
5. Add API key to both frontend and backend .env files

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/donation-history` - Get donation history
- `POST /api/users/search-donors` - Search nearby donors

### Request Endpoints
- `POST /api/requests/create` - Create blood request
- `GET /api/requests` - Get all requests
- `PUT /api/requests/:id/accept` - Accept request
- `PUT /api/requests/:id/reject` - Reject request

### Hospital Endpoints
- `GET /api/hospitals/inventory` - Get blood inventory
- `PUT /api/hospitals/inventory` - Update inventory
- `GET /api/hospitals/stats` - Get hospital statistics

### Real-time Events
- `newBloodRequest` - New blood request created
- `requestUpdate` - Request status updated
- `newNotification` - New notification received

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage
- Authentication flows
- Request creation and management
- Real-time updates
- API endpoints
- UI components

## 📦 Deployment

### Production Deployment

#### Using Docker
```bash
# Build Docker images
docker-compose build

# Run containers
docker-compose up -d
```

#### Manual Deployment
1. Set production environment variables
2. Build frontend: `npm run build`
3. Start backend: `npm start`
4. Use reverse proxy (Nginx) for production

#### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bloodnet
JWT_SECRET=super_secure_production_secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Blood donors and recipients worldwide
- Medical professionals and healthcare workers
- Open source community
- Google Maps Platform
- MongoDB Atlas

## 📞 Support

For support, email support@bloodnetplus.com or create an issue on GitHub.

## 🔗 Links

- [Live Demo](https://bloodnetplus-demo.herokuapp.com)
- [Documentation](https://docs.bloodnetplus.com)
- [API Reference](https://api.bloodnetplus.com)
- [GitHub Repository](https://github.com/your-username/bloodnet-plus)

---

**Made with ❤️ for saving lives**

### Database
- **MongoDB** - NoSQL database
- **Collections**: Users, Requests, Notifications, BloodInventory

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd BloodNet-2
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Environment Setup**

Create a `.env` file in the `backend` directory:
```env
MONGODB_URI=mongodb://localhost:27017/bloodnet
PORT=5000
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

5. **Start MongoDB**
```bash
# Make sure MongoDB is running on your system
mongod
```

6. **Run the Application**

Start the backend server:
```bash
cd backend
npm start
```

Start the frontend development server:
```bash
cd frontend
npm start
```

7. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
BloodNet-2/
├── backend/
│   ├── models/          # MongoDB models
│   │   ├── User.js
│   │   ├── Request.js
│   │   ├── Notification.js
│   │   └── BloodInventory.js
│   ├── controllers/     # API controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── requestController.js
│   │   ├── hospitalController.js
│   │   └── notificationController.js
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── requests.js
│   │   ├── hospitals.js
│   │   └── notifications.js
│   ├── middleware/      # Custom middleware
│   │   └── auth.js
│   ├── config/          # Configuration files
│   ├── .env            # Environment variables
│   └── server.js       # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   │   ├── Navbar.js
│   │   │   └── ProtectedRoute.js
│   │   ├── pages/        # Page components
│   │   │   ├── LandingPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── RecipientDashboard.js
│   │   │   ├── DonorDashboard.js
│   │   │   └── HospitalDashboard.js
│   │   ├── contexts/     # React contexts
│   │   │   ├── AuthContext.js
│   │   │   └── NotificationContext.js
│   │   ├── services/     # API services
│   │   │   └── api.js
│   │   ├── utils/        # Utility functions
│   │   ├── hooks/        # Custom hooks
│   │   ├── assets/       # Static assets
│   │   ├── App.js       # Main App component
│   │   ├── App.css      # Global styles
│   │   └── index.js     # Entry point
│   ├── public/           # Public files
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Users
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/availability` - Update donor availability
- `GET /api/users/donation-history` - Get donation history
- `GET /api/users/search` - Search nearby donors
- `GET /api/users/notifications` - Get user notifications

### Blood Requests
- `POST /api/requests/create` - Create blood request
- `GET /api/requests/my` - Get user's requests
- `GET /api/requests/nearby` - Get nearby requests
- `PUT /api/requests/:id/respond` - Respond to request
- `GET /api/requests/:id` - Get request details

### Hospitals
- `GET /api/hospitals/nearby` - Get nearby hospitals
- `GET /api/hospitals/inventory` - Get hospital inventory
- `PUT /api/hospitals/inventory` - Update inventory
- `GET /api/hospitals/requests` - Get all blood requests
- `GET /api/hospitals/stats` - Get hospital statistics

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🎯 User Roles & Features

### 🧑 Recipients (Patients)
- **Search Donors**: Find compatible blood donors by location
- **Create Requests**: Submit blood donation requests with urgency levels
- **Track Status**: Monitor request status in real-time
- **Emergency Mode**: Mark requests as emergency for priority matching

### 🩸 Donors
- **View Requests**: See nearby blood requests matching their blood type
- **Accept/Reject**: Respond to donation requests
- **Manage Availability**: Toggle donation availability status
- **Donation History**: Track past donations
- **Health Guidelines**: View donation requirements and tips

### 🏥 Hospitals
- **Inventory Management**: Track blood stock levels by type
- **Low Stock Alerts**: Get notified when supplies run low
- **Request Management**: View and respond to blood requests
- **Statistics Dashboard**: Monitor donation metrics and trends
- **Expiry Tracking**: Monitor blood bag expiration dates

## 🌍 Location Features

The application uses geolocation to:
- Find nearby donors and hospitals within specified radius
- Calculate accurate distances between users
- Provide location-based matching algorithms
- Support emergency location services

## 🔔 Real-Time Notifications

System provides instant notifications for:
- New blood requests
- Request status updates (accepted/rejected/completed)
- Low stock alerts for hospitals
- Donor availability changes
- System announcements

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive server-side validation
- **Role-Based Authorization**: Proper access control
- **CORS Protection**: Cross-origin resource sharing security
- **Rate Limiting**: Prevent API abuse (recommended for production)

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Touch-Friendly**: Large tap targets and touch gestures
- **Adaptive Layout**: Responsive grid system
- **Progressive Enhancement**: Works on all modern browsers

## 🎨 UI/UX Highlights

- **Modern Medical Theme**: Professional healthcare color scheme
- **Smooth Animations**: Micro-interactions and transitions
- **Intuitive Navigation**: Clear user flow and information architecture
- **Accessibility**: WCAG 2.1 AA compliance
- **Loading States**: Skeleton screens and progress indicators
- **Error Handling**: User-friendly error messages

## 🧪 Testing & Development

### Development Scripts
```bash
# Backend development
cd backend
npm start          # Start server
npm test           # Run tests

# Frontend development
cd frontend
npm start          # Start dev server
npm run build      # Build for production
npm test           # Run tests
```

### Environment Variables
```env
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/bloodnet
PORT=5000
JWT_SECRET=your_secure_jwt_secret
GOOGLE_MAPS_API_KEY=your_maps_api_key

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, DigitalOcean)
4. Ensure proper CORS settings for production domain

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy static files to hosting service (Netlify, Vercel, AWS S3)
3. Configure environment variables for production API URL
4. Set up proper routing for SPA

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Join our community discussions

## 🎉 Acknowledgments

- Blood donors and recipients who inspired this project
- Healthcare professionals for their valuable insights
- Open-source community for amazing tools and libraries
- Modern web development ecosystem

---

**Built with ❤️ to save lives through technology**
