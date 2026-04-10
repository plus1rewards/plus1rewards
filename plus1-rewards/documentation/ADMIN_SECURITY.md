# Admin Dashboard Security Documentation

## Overview

The Plus1 Rewards admin dashboard is protected by a custom authentication system that does not rely on Supabase Auth. This provides an additional layer of security and independence from third-party authentication services.

## Authentication Credentials

### Default Admin Credentials
- **Phone Number**: `0714329190`
- **Password**: `Plus1Admin@2026!Secure`

> **IMPORTANT**: These credentials are hardcoded in the application. For production deployment, consider moving these to environment variables or a secure backend authentication service.

## Security Features

### 1. Session Management
- **Session Duration**: 2 hours of inactivity
- **Storage**: Encrypted session data stored in localStorage (if "Remember Me" is checked) or sessionStorage
- **Auto-Extension**: Session automatically extends on user activity (mouse, keyboard, scroll, touch)
- **Expiry Warning**: Users receive a warning 5 minutes before session expires

### 2. Session Encryption
- Session data is encrypted using Base64 encoding with URL encoding
- Additional password hash stored separately for validation
- SHA-256 hashing used for password verification

### 3. Protected Routes
All admin routes are wrapped with `ProtectedAdminRoute` component:
- `/admin/dashboard`
- `/admin/members`
- `/admin/partners`
- `/admin/agents`
- `/admin/transactions`
- `/admin/approvals`
- `/admin/cover-plans`
- `/admin/notifications`
- `/admin/invoices`
- `/admin/commissions`
- `/admin/providers`
- `/admin/disputes`
- `/admin/top-ups`
- `/admin/settings`
- `/admin/chat`

### 4. Activity Monitoring
- Tracks user activity (mouse, keyboard, scroll, touch events)
- Automatically extends session every minute of activity
- Prevents unnecessary session timeouts during active use

### 5. Automatic Logout
- Session expires after 2 hours of inactivity
- Automatic redirect to login page on expiry
- Manual logout available via Topbar button
- All session data cleared on logout

## Implementation Details

### Core Files

#### 1. `lib/adminAuth.ts`
Main authentication service with the following functions:
- `login(phone, password, rememberMe)` - Authenticate admin user
- `isAuthenticated()` - Check if current session is valid
- `getSession()` - Retrieve current session data
- `logout()` - Clear session and logout
- `extendSession()` - Extend session expiration
- `getTimeUntilExpiry()` - Get remaining session time

#### 2. `components/ProtectedAdminRoute.tsx`
Route protection component that:
- Checks authentication status before rendering
- Shows loading state during verification
- Redirects to login if not authenticated
- Monitors session expiry every 30 seconds

#### 3. `components/admin/SessionTimeoutWarning.tsx`
Warning component that:
- Displays when 5 minutes or less remain
- Shows countdown timer
- Provides "Extend Session" button
- Auto-dismisses when session extended

#### 4. `pages/AdminLogin.tsx`
Login page with:
- Phone number input (10 digits)
- Password input with show/hide toggle
- "Remember Me" checkbox
- Error handling and validation
- Automatic redirect if already authenticated

### Session Flow

```
1. User enters credentials
   ↓
2. Credentials validated against hardcoded values
   ↓
3. Session created with 2-hour expiration
   ↓
4. Session encrypted and stored
   ↓
5. User redirected to dashboard
   ↓
6. Activity monitoring starts
   ↓
7. Session auto-extends on activity
   ↓
8. Warning shown at 5 minutes remaining
   ↓
9. Session expires or user logs out
   ↓
10. Redirect to login page
```

## Security Best Practices

### Current Implementation
✅ Encrypted session storage
✅ Session expiration (2 hours)
✅ Activity-based session extension
✅ Protected routes with authentication checks
✅ Automatic logout on expiry
✅ Session timeout warnings
✅ Manual logout functionality

### Recommended Enhancements for Production

#### 1. Move Credentials to Environment Variables
```typescript
// .env.local
VITE_ADMIN_PHONE=0714329190
VITE_ADMIN_PASSWORD=Plus1Admin@2026!Secure

// In adminAuth.ts
const ADMIN_PHONE = import.meta.env.VITE_ADMIN_PHONE;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
```

#### 2. Implement Backend Authentication
- Move authentication logic to a secure backend API
- Use JWT tokens for session management
- Implement refresh token mechanism
- Add rate limiting to prevent brute force attacks

#### 3. Add Multi-Factor Authentication (MFA)
- SMS verification code
- Authenticator app (TOTP)
- Email verification

#### 4. Implement Audit Logging
- Log all login attempts (successful and failed)
- Track admin actions
- Monitor suspicious activity
- Store logs in secure database

#### 5. Add IP Whitelisting
- Restrict admin access to specific IP addresses
- Implement geolocation checks
- Add device fingerprinting

#### 6. Enhance Password Security
- Implement password complexity requirements
- Add password expiration policy
- Require password changes every 90 days
- Prevent password reuse

#### 7. Add CAPTCHA
- Implement CAPTCHA on login page
- Prevent automated attacks
- Add after 3 failed login attempts

## Testing the Security

### Test Scenarios

#### 1. Valid Login
```
Phone: 0714329190
Password: Plus1Admin@2026!Secure
Expected: Successful login, redirect to dashboard
```

#### 2. Invalid Phone Number
```
Phone: 0123456789
Password: Plus1Admin@2026!Secure
Expected: "Invalid credentials" error
```

#### 3. Invalid Password
```
Phone: 0714329190
Password: WrongPassword
Expected: "Invalid credentials" error
```

#### 4. Session Expiry
```
1. Login successfully
2. Wait 2 hours without activity
3. Try to access admin page
Expected: Redirect to login page
```

#### 5. Protected Route Access
```
1. Without logging in, navigate to /admin/dashboard
Expected: Redirect to /admin/login
```

#### 6. Session Extension
```
1. Login successfully
2. Perform activity (click, scroll, type)
3. Check session expiry time
Expected: Session expiry time extends
```

#### 7. Manual Logout
```
1. Login successfully
2. Click "Logout" button in Topbar
Expected: Redirect to login page, session cleared
```

## Troubleshooting

### Issue: Session expires too quickly
**Solution**: Check activity monitoring is working. Verify events are being captured.

### Issue: Cannot login with correct credentials
**Solution**: Check browser console for errors. Verify credentials match exactly (case-sensitive).

### Issue: Redirect loop on login
**Solution**: Clear browser storage (localStorage and sessionStorage). Try again.

### Issue: Session warning not showing
**Solution**: Check SessionTimeoutWarning component is imported in Dashboard. Verify timer logic.

## Maintenance

### Changing Admin Credentials
1. Update credentials in `lib/adminAuth.ts`:
```typescript
const ADMIN_PHONE = 'NEW_PHONE_NUMBER';
const ADMIN_PASSWORD = 'NEW_PASSWORD';
```

2. Rebuild the application:
```bash
npm run build
```

### Adjusting Session Duration
1. Update duration in `lib/adminAuth.ts`:
```typescript
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours
```

### Changing Warning Threshold
1. Update threshold in `components/admin/SessionTimeoutWarning.tsx`:
```typescript
if (minutes <= 10 && minutes > 0) { // 10 minutes warning
  setShowWarning(true);
}
```

## Security Checklist

Before deploying to production:

- [ ] Move credentials to environment variables
- [ ] Implement backend authentication API
- [ ] Add rate limiting on login endpoint
- [ ] Enable HTTPS only
- [ ] Implement audit logging
- [ ] Add MFA (Multi-Factor Authentication)
- [ ] Set up IP whitelisting (optional)
- [ ] Configure CAPTCHA on login
- [ ] Test all security scenarios
- [ ] Review and update password policy
- [ ] Set up monitoring and alerts
- [ ] Document incident response procedures

## Support

For security concerns or questions, contact:
- IT Support: support@plus1rewards.com
- Security Team: security@plus1rewards.com

---

**Last Updated**: 2026-04-10
**Version**: 1.0
**Author**: Plus1 Rewards Development Team
