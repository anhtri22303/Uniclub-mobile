# UniClub Mobile App - Authentication System

This document explains the authentication system setup for the UniClub mobile app.

## 🚀 Features

- **Login/Signup**: Email and password authentication
- **Google OAuth**: Google sign-in integration (ready for implementation)
- **Forgot Password**: Password reset functionality
- **Secure Storage**: JWT tokens stored securely using Expo SecureStore
- **Auto-login**: Automatic login on app restart if valid token exists
- **Role-based Access**: Support for different user roles (student, club_leader, uni_staff, admin, staff)

## 📁 File Structure

```
src/
├── models/auth/
│   └── auth.types.ts          # TypeScript interfaces for auth
├── services/
│   └── auth.service.ts        # Authentication API calls
├── stores/
│   └── auth.store.ts          # Zustand store for auth state
├── components/auth/
│   ├── LoginScreen.tsx        # Main login/signup screen
│   ├── MajorSelector.tsx      # Major selection component
│   └── AuthWrapper.tsx        # Authentication wrapper
├── configs/
│   ├── axios.ts               # Axios configuration with interceptors
│   └── environment.ts         # Environment configuration
└── app/
    ├── login.tsx              # Login route
    └── _layout.tsx            # Root layout with auth wrapper
```

## 🔧 Setup Instructions

### 1. Environment Configuration

Update `src/configs/environment.ts` to set your API URL:

```typescript
export const ENV = {
  API_URL: 'http://localhost:8080', // Your backend URL
  // or for production:
  // API_URL: 'https://uniclub-qyn9a.ondigitalocean.app/',
};
```

### 2. Backend API Endpoints

The app expects these endpoints on your backend:

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Password reset
- `POST /auth/google` - Google OAuth login

### 3. API Response Format

#### Login Response
```typescript
{
  token: string;
  userId: number | string;
  email: string;
  fullName: string;
  role: string;
  staff: boolean;
  clubIds?: number[];
}
```

#### Signup Request
```typescript
{
  email: string;
  password: string;
  fullName: string;
  phone: string;
  roleName: string; // "MEMBER"
  studentCode: string;
  majorName: string;
}
```

## 🎨 UI Design

The login screen features:
- **Modern Design**: Clean, mobile-optimized interface
- **Gradient Background**: Emerald to teal gradient
- **Logo Section**: UniClub branding with app download button
- **Form Toggle**: Switch between login and signup modes
- **Input Validation**: Client-side validation for all fields
- **Password Visibility**: Toggle to show/hide passwords
- **Major Selection**: Modal picker for major selection
- **Google Sign-in**: Ready for Google OAuth integration

## 🔐 Security Features

- **JWT Tokens**: Secure token-based authentication
- **Secure Storage**: Tokens stored in Expo SecureStore
- **Request Interceptors**: Automatic token attachment to API requests
- **Input Validation**: Client-side validation for all forms
- **Error Handling**: Comprehensive error handling and user feedback

## 🚦 Usage

### Authentication Flow

1. **App Launch**: AuthWrapper checks for existing token
2. **Login Required**: If no valid token, redirect to `/login`
3. **Login/Signup**: User can switch between modes
4. **Authentication**: API call to backend with credentials
5. **Token Storage**: JWT token stored securely
6. **Navigation**: Redirect to main app after successful login

### Using Auth Store

```typescript
import { useAuthStore } from '@stores/auth.store';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  // Check authentication status
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  // Access user data
  console.log(user?.fullName, user?.role);
}
```

### Making Authenticated API Calls

```typescript
import { axiosClient } from '@configs/axios';

// The axiosClient automatically includes JWT token in headers
const response = await axiosClient.get('/protected-endpoint');
```

## 🎯 User Roles

The system supports these user roles:
- **student**: Regular student member
- **club_leader**: Club leader/manager
- **uni_staff**: University staff member
- **admin**: System administrator
- **staff**: General staff member

## 🔄 Navigation Flow

```
App Launch
    ↓
AuthWrapper checks token
    ↓
┌─ Has Valid Token? ─┐
│                   │
Yes                 No
│                   │
↓                   ↓
Main App          Login Screen
    ↓                   ↓
Home/Explore      Login/Signup
    ↓                   ↓
User Actions      Authentication
    ↓                   ↓
Logout              Main App
    ↓                   ↓
Login Screen       User Actions
```

## 🛠 Development

### Running the App

```bash
npm start
# or
expo start
```

### Testing Authentication

1. Start your backend server
2. Update API URL in `src/configs/environment.ts`
3. Run the mobile app
4. Test login/signup functionality

### Adding New Features

1. **New API Endpoints**: Add to `AuthService` class
2. **New User Fields**: Update types in `auth.types.ts`
3. **UI Components**: Create in `src/components/auth/`
4. **Navigation**: Update routes in `app/` directory

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**: Check API URL in environment config
2. **Token Not Stored**: Ensure Expo SecureStore is properly configured
3. **Navigation Issues**: Check route configuration in `_layout.tsx`
4. **Validation Errors**: Review form validation logic in LoginScreen

### Debug Mode

Enable debug logging by setting:
```typescript
// In your environment config
IS_DEV: true
```

## 📱 Mobile-Specific Features

- **Keyboard Handling**: KeyboardAvoidingView for better UX
- **Touch Feedback**: Haptic feedback for interactions
- **Responsive Design**: Optimized for mobile screens
- **Safe Areas**: Proper handling of device safe areas
- **Loading States**: Activity indicators for async operations

## 🔮 Future Enhancements

- [ ] Google OAuth integration
- [ ] Biometric authentication
- [ ] Push notifications
- [ ] Offline mode support
- [ ] Social login options
- [ ] Multi-factor authentication

---

**Note**: This authentication system is designed to work with your existing backend API. Make sure your backend endpoints match the expected format and implement the required authentication logic.
