# Password Change Fix - Profile Page

## Issue
The password change functionality on the user profile page was failing because the endpoint `/api/auth/change-password` did not exist in the backend.

## Root Cause
- **Frontend** (`UserProfile.jsx`) was calling `POST /api/auth/change-password`
- **Backend** (`authRoutes.js`) did not have this route defined
- Only `forgot-password` and `reset-password` endpoints existed

## Solution Implemented

### 1. Added `changePassword` Controller Function
**File:** `backend/src/controllers/authController.js`

**Features:**
- ✅ Validates current password
- ✅ Validates new password complexity (12+ chars, uppercase, lowercase, number, special char)
- ✅ Prevents using same password as current
- ✅ Updates password in database
- ✅ Logs audit trail
- ✅ Invalidates all other sessions (except current) for security
- ✅ Returns clear error messages

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456@"
}
```

**Responses:**

**Success (200):**
```json
{
  "message": "Password changed successfully. Other sessions have been logged out."
}
```

**Errors:**
- `400` - Missing fields, password too short, weak password, same as current
- `401` - Current password incorrect
- `404` - User not found
- `500` - Server error

### 2. Added Route
**File:** `backend/src/routes/authRoutes.js`

```javascript
router.post('/change-password', authenticate, authController.changePassword);
```

**Endpoint:** `POST /api/auth/change-password`
**Auth Required:** Yes (JWT token via cookies or headers)

## Security Features

### Password Validation
- **Minimum Length:** 12 characters
- **Complexity Required:**
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*...)

### Security Measures
1. **Current Password Verification** - Ensures user knows current password
2. **No Password Reuse** - Prevents setting same password as current
3. **Session Invalidation** - Logs out all other devices for security
4. **Audit Logging** - Records all password change attempts
5. **Rate Limiting** - Prevents brute force attacks (via authenticate middleware)

## Frontend Integration

The frontend form (`UserProfile.jsx`) sends:
```javascript
await axios.post('/api/auth/change-password', {
  current_password: values.current_password,
  new_password: values.new_password,
  confirm_password: values.confirm_password  // validated client-side
});
```

**Form Fields:**
1. Current Password (required)
2. New Password (required, with strength indicator)
3. Confirm Password (required, must match new password)

**Password Strength Indicator:**
- Weak (0-39%) - Red
- Fair (40-59%) - Orange
- Good (60-79%) - Yellow
- Strong (80-100%) - Green

## Testing

### Manual Test
1. Login to the application
2. Navigate to Profile page
3. Click on "Security" tab
4. Fill in password change form:
   - Current Password: Your current password
   - New Password: A strong password (min 12 chars)
   - Confirm Password: Same as new password
5. Click "Change Password"

**Expected Result:**
- ✅ Success message displayed
- ✅ Other sessions logged out
- ✅ Can login with new password

### Test via API (cURL)
```bash
# Get auth token first (login)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"CurrentPass123!"}'

# Change password (use cookies from login)
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{
    "current_password":"CurrentPass123!",
    "new_password":"NewSecurePass456@"
  }'
```

## Database Impact

**Table:** `users`
**Column Updated:** `password_hash`
**Additional Actions:** Clears `reset_token` and `reset_token_expires` if set

**Table:** `user_sessions`
**Action:** Deactivates all sessions except current

**Table:** `audit_logs`
**Action:** Logs password change attempt (success/failure)

## Error Scenarios Handled

| Scenario | HTTP Status | Message |
|----------|-------------|---------|
| Missing current password | 400 | "Current password and new password are required" |
| Missing new password | 400 | "Current password and new password are required" |
| New password too short | 400 | "New password must be at least 12 characters" |
| Weak password | 400 | "Password must include uppercase, lowercase, number and special character" |
| Current password wrong | 401 | "Current password is incorrect" |
| New password same as current | 400 | "New password must be different from current password" |
| User not found | 404 | "User not found" |
| Server error | 500 | "Server error" |

## Code Flow

```
User submits form
    ↓
Frontend sends POST /api/auth/change-password
    ↓
authenticate middleware verifies JWT token
    ↓
changePassword controller:
    1. Validate input
    2. Get user from database
    3. Verify current password
    4. Check new password complexity
    5. Check new password ≠ current password
    6. Hash new password
    7. Update database
    8. Log audit entry
    9. Invalidate other sessions
    ↓
Return success message
    ↓
Frontend displays success
```

## Files Modified

1. `backend/src/controllers/authController.js` - Added `changePassword` function
2. `backend/src/routes/authRoutes.js` - Added route for password change

## Related Endpoints

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `POST /api/auth/forgot-password` | Request password reset via email | No |
| `POST /api/auth/reset-password` | Reset password using token from email | No |
| `POST /api/auth/change-password` | Change password when logged in | Yes |

## Status
✅ **FIXED** - Password change functionality is now working on the profile page.

## Additional Notes

- Password change invalidates all other sessions for security
- Current session remains active (user stays logged in)
- Audit log created for compliance and security monitoring
- Frontend includes real-time password strength indicator
- All password validations match registration requirements
