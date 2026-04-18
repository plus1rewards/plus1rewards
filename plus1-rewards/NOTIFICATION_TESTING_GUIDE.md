# Push Notification Testing Guide

## Quick Test (5 minutes)

### Step 1: Start the App
```bash
cd plus1-rewards
npm run dev
```

### Step 2: Open Member Dashboard
1. Navigate to `http://localhost:5174/member/login`
2. Login with test member credentials
3. You should see a blue banner at the top: "Enable Notifications"

### Step 3: Enable Notifications
1. Click the "Enable" button in the banner
2. Browser will show permission dialog
3. Click "Allow" or "Accept"
4. Banner should disappear
5. You should see success message: "Notifications Enabled"

### Step 4: Test Real-Time Notification
1. Keep member dashboard open
2. Open new tab/window
3. Navigate to partner dashboard
4. Create a transaction for the test member
5. **Watch the member dashboard:**
   - Notification should appear instantly
   - Shows: "💰 Cashback Earned!"
   - Shows amount and partner name
   - Phone vibrates (on mobile)

### Step 5: Test Background Notification
1. Minimize or switch away from member dashboard
2. Create another transaction from partner dashboard
3. **You should see:**
   - System notification appears
   - Shows in notification tray/center
   - Click notification to open dashboard

## Platform-Specific Testing

### Android (Chrome/Firefox)
1. Open site in Chrome/Firefox
2. Enable notifications
3. Lock phone or switch apps
4. Create transaction
5. Notification appears in notification tray
6. Tap to open app

### iOS (Safari PWA)
**Requirements:**
- iOS 16.4 or later
- Must install as PWA

**Steps:**
1. Open site in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Open app from home screen
5. Enable notifications
6. Lock phone or switch apps
7. Create transaction
8. Notification appears

**Note:** iOS notifications ONLY work when installed as PWA, not in Safari browser.

### Desktop (Windows/macOS/Linux)
1. Open site in Chrome/Edge/Firefox
2. Enable notifications
3. Minimize browser
4. Create transaction
5. Notification appears in system tray
6. Click to focus browser

## Troubleshooting

### "Enable" Button Does Nothing
- Check browser console for errors
- Ensure HTTPS or localhost
- Try different browser
- Clear browser cache

### No Notification Appears
- Check permission status: `Notification.permission`
- Ensure service worker registered
- Check browser notification settings
- Disable Do Not Disturb mode

### iOS Not Working
- Ensure iOS 16.4+
- Must be installed as PWA
- Check Settings > Notifications > Plus1 Rewards
- Reinstall PWA if needed

### Notification Shows But No Sound/Vibration
- Check device volume
- Check notification settings
- Ensure not in silent mode
- Check browser notification preferences

## Manual Testing Checklist

- [ ] Banner appears on first visit
- [ ] Permission dialog shows when clicking "Enable"
- [ ] Banner disappears after enabling
- [ ] In-app toast notification shows
- [ ] Push notification appears
- [ ] Notification shows correct amount
- [ ] Notification shows partner name
- [ ] Vibration works (mobile)
- [ ] Sound plays (if enabled)
- [ ] Clicking notification opens dashboard
- [ ] Works when app in background
- [ ] Works when app closed (PWA)
- [ ] Multiple notifications don't spam
- [ ] Notification auto-dismisses

## Test Scenarios

### Scenario 1: First-Time User
1. New member logs in
2. Sees notification banner
3. Clicks "Enable"
4. Grants permission
5. Makes first purchase
6. Receives notification ✅

### Scenario 2: Returning User
1. Member logs in
2. No banner (already enabled)
3. Makes purchase
4. Receives notification ✅

### Scenario 3: Permission Denied
1. Member logs in
2. Clicks "Enable"
3. Denies permission
4. Banner remains
5. Makes purchase
6. Only sees in-app toast (no push) ✅

### Scenario 4: Multiple Transactions
1. Member receives 3 transactions quickly
2. Gets 3 separate notifications
3. Each shows correct amount
4. No duplicate notifications ✅

### Scenario 5: Background App
1. Member has app open
2. Switches to another app
3. Receives transaction
4. Gets push notification
5. Taps notification
6. App opens/focuses ✅

## Performance Testing

### Check Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service workers:', regs);
});
```

### Check Notification Permission
```javascript
// In browser console
console.log('Permission:', Notification.permission);
```

### Test Notification Manually
```javascript
// In browser console
new Notification('Test', {
  body: 'This is a test notification',
  icon: '/logo.png',
  vibrate: [200, 100, 200]
});
```

## Expected Results

### ✅ Success Indicators
- Banner appears for new users
- Permission dialog shows
- Notifications appear instantly
- Correct amount displayed
- Partner name shown
- Vibration works (mobile)
- Click opens dashboard
- Works in background

### ❌ Failure Indicators
- Banner doesn't appear
- Permission dialog blocked
- Notifications delayed/missing
- Wrong amount shown
- No vibration
- Click doesn't open app
- Only works when app focused

## Browser DevTools

### Check Real-Time Connection
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: WS (WebSocket)
4. Should see Supabase connection
5. Status: 101 Switching Protocols

### Check Service Worker
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers"
4. Should see sw.js registered
5. Status: Activated and running

### Check Notifications
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Notifications"
4. See notification history
5. Test notification permissions

## Production Testing

### Before Deployment
- [ ] Test on Android Chrome
- [ ] Test on iOS Safari PWA
- [ ] Test on Windows Chrome
- [ ] Test on macOS Safari
- [ ] Test on Linux Firefox
- [ ] Test with slow network
- [ ] Test with offline mode
- [ ] Test with multiple users
- [ ] Test notification spam prevention
- [ ] Test permission revocation

### After Deployment
- [ ] Verify HTTPS enabled
- [ ] Check service worker loads
- [ ] Test real transactions
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify analytics (if any)

## Support

### Common User Questions

**Q: Why don't I see notifications?**
A: Check if you enabled notifications in the banner. Also check your device notification settings.

**Q: How do I disable notifications?**
A: Go to browser settings > Site settings > Notifications > Plus1 Rewards > Block

**Q: Do notifications work on iPhone?**
A: Yes, but only on iOS 16.4+ and when installed as PWA (Add to Home Screen).

**Q: Will I get notifications when app is closed?**
A: Yes, if installed as PWA. Browser notifications work when browser is open.

**Q: Can I customize notification sound?**
A: Currently uses system default. Custom sounds coming in future update.

---

**Need Help?**
- Check browser console for errors
- Review documentation/PUSH_NOTIFICATIONS.md
- Test in different browser
- Contact development team
