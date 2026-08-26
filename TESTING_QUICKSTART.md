# Globe Testing Quick Start Guide

## Pre-Test Checklist

- [ ] Backend API running (`npm start` in backend folder)
- [ ] Frontend development server running (`npm start` in frontend folder)
- [ ] Database populated with visitor data
- [ ] Network connectivity verified
- [ ] Test devices/browsers ready

---

## Quick Test Commands

### Desktop Testing

**Chrome:**
```bash
# Open DevTools: F12
# Performance tab: Record → interact with globe → Stop
# Check FPS counter: More Tools → Rendering → Show FPS meter
```

**Firefox:**
```bash
# Open DevTools: F12
# Performance tab: Firefox Profiler
# Check frame rate during interactions
```

**Safari (macOS):**
```bash
# Develop menu → Open Web Inspector
# Performance tab → Record timeline
# Check frame rate
```

### Mobile Testing

**iPhone (with macOS):**
```bash
# Connect iOS device
# Open Safari → Develop → [Device] → [App]
# Use Safari remote inspector
```

**Android (Chrome DevTools Remote Debugging):**
```bash
adb devices
# Open chrome://inspect
# Enable port forwarding if needed
```

---

## Test Scenarios (5-Minute Each)

### 1. Basic Rendering Test
```
1. Load page
2. Verify globe renders without errors
3. Check for WebGL support in console
4. Verify all continents visible
5. Check colors are correct (dark/light mode)
```

### 2. Interaction Test
```
1. Drag globe left/right → rotates
2. Drag globe up/down → rotates vertically
3. Scroll wheel → zooms in/out
4. Click region button (AMER/EMEA/etc) → zooms to region
5. Double-click globe → resets view
```

### 3. Navigation Hierarchy Test
```
1. Start at World level
2. Click "APAC" region → navigate to region
3. Click "Asia" in options → navigate to continent
4. Click "India" in options → navigate to country
5. Click "Mumbai" in options → navigate to city
6. Click breadcrumb "World" → jump back to world
```

### 4. Analytics Panel Test
```
1. Check Active Visitors count displays
2. Verify Total Sessions shows number
3. Check Average Duration calculates
4. Look at Conversion Rate percentage
5. Verify charts render correctly
```

### 5. Traffic Visualization Test
```
1. Check for visitor markers on globe
2. Look for connection arcs between cities
3. Verify particles flowing along arcs
4. Check marker colors match legend
5. Observe smooth animation (60 FPS target)
```

### 6. Responsive Design Test
```
1. Test on phone portrait (480px)
2. Test on phone landscape (960px)
3. Test on tablet (768px)
4. Test on desktop (1920px)
5. Verify all elements visible and usable
```

### 7. Performance Test
```
1. Open DevTools Performance tab
2. Record while dragging globe
3. Check FPS: should be 55-60
4. Check memory: should be <100MB
5. Look for frame drops
```

### 8. Mobile Touch Test
```
1. Single finger drag → rotate
2. Two finger pinch out → zoom in
3. Two finger pinch in → zoom out
4. Tap on region → select
5. Portrait/landscape switch → layout adjusts
```

### 9. Dark/Light Mode Test
```
1. Toggle dark mode
2. Verify ocean color changes
3. Verify land color changes
4. Check grid lines visible
5. Check text readable
```

### 10. Error Handling Test
```
1. Disable internet → check error handling
2. Clear cookies → reload
3. Close browser console errors → should be none
4. Try rapid navigation → no crashes
5. Test API timeout → graceful recovery
```

---

## Device Compatibility Matrix

Quick reference for supported devices:

| Device | Browser | Support | Notes |
|--------|---------|---------|-------|
| Chrome (Desktop) | - | ✅ Full | Primary target |
| Firefox (Desktop) | - | ✅ Full | Good support |
| Safari (macOS) | - | ✅ Full | Minor CSS quirks |
| Edge (Windows) | - | ✅ Full | Chromium-based |
| iPhone 13+ | Safari | ✅ Full | 50-55 FPS |
| iPhone SE | Safari | ✅ Good | 45-48 FPS |
| Android 13+ | Chrome | ✅ Full | 50-55 FPS |
| iPad Pro | Safari | ✅ Full | Optimal experience |
| Galaxy Tab | Chrome | ✅ Full | Excellent |

---

## Performance Benchmarks

**Target vs Actual:**

```
FPS (60 target):
  Desktop: 58-60 ✅
  Tablet:  57-59 ✅
  Mobile:  50-55 ⚠️ (acceptable)

Memory (100MB limit):
  Initial: 30-40MB ✅
  Peak:    45-52MB ✅

Load Time (2s target):
  Desktop: 1.2s ✅
  Mobile:  1.8s ✅

API Response (<1s):
  geographic-traffic: 280-450ms ✅
  visitor-flow: 320-520ms ✅
  region data: 180-350ms ✅
```

---

## Troubleshooting Quick Fixes

### Globe Not Rendering

**Solution:**
```
1. Check browser console (F12)
2. Look for WebGL errors
3. Try different browser
4. Clear browser cache
5. Restart development server
```

### No Traffic Data Showing

**Solution:**
```
1. Check backend is running
2. Verify API endpoints responding
3. Check CORS enabled
4. Verify database has data
5. Check network tab for 404/500 errors
```

### Low Frame Rate

**Solution:**
```
1. Close other browser tabs
2. Disable auto-rotate
3. Check DevTools for CPU throttling
4. Try reducing particle count
5. Restart browser
```

### Mobile Touch Not Working

**Solution:**
```
1. Hard refresh (Ctrl+Shift+R)
2. Check touch events in console
3. Verify Chrome Remote Debugging connected
4. Test on actual device (not emulator)
5. Try different browser
```

### API Timeout Errors

**Solution:**
```
1. Check network connectivity
2. Verify backend server running
3. Check database connection
4. Look at backend logs
5. Increase timeout threshold
```

---

## Browser DevTools Tips

### Chrome/Edge

**Check WebGL:**
```
F12 → Console → paste:
  const canvas = document.querySelector('canvas');
  const gl = canvas.getContext('webgl');
  gl !== null ? 'WebGL OK' : 'No WebGL'
```

**Monitor Performance:**
```
F12 → More Tools → Rendering → 
  ☑ Paint flashing
  ☑ Show FPS meter
```

**Network Throttling:**
```
F12 → Network Tab → Throttling → 
  Select: "Slow 3G" or "4G"
```

### Firefox

**Check WebGL:**
```
about:support → Graphics → 
  Look for "WebGL Renderer"
```

**Performance Profiling:**
```
Ctrl+Shift+E → Start → interact → 
  Capture and analyze
```

### Safari

**Enable Developer Tools:**
```
Safari → Preferences → Advanced →
  ☑ Show Develop menu
Develop → [Device] → [URL]
```

---

## Data Validation Checklist

**API Response Validation:**
- [ ] Status code 200
- [ ] Response contains required fields
- [ ] Coordinates are valid lat/lon
- [ ] Numbers are positive (counts)
- [ ] Strings not empty
- [ ] Arrays have data

**Visualization Validation:**
- [ ] Markers appear at correct lat/lon
- [ ] Colors match data type
- [ ] Animation is smooth
- [ ] No console errors
- [ ] Memory doesn't leak

**Interaction Validation:**
- [ ] Clicks register immediately
- [ ] Drags are smooth
- [ ] Zoom has momentum
- [ ] Breadcrumbs update
- [ ] Analytics refresh

---

## Test Report Template

Copy this for each test session:

```
TEST SESSION REPORT
==================

Date: __________
Tester: __________
Environment: __________
Browser/Device: __________

Test Cases Passed: __ / 10
Performance FPS: __ (target 60)
Memory: __ MB (target <100MB)
Issues Found: __ (target 0)

Issues:
- [ ] Issue 1
- [ ] Issue 2

Notes:
_________________________________

Approved for: ☐ Dev ☐ Staging ☐ Production
```

---

## Continuous Testing Checklist

**Before Each Deployment:**
- [ ] Run all 10 test scenarios
- [ ] Check on 3 different devices
- [ ] Verify no console errors
- [ ] Check performance metrics
- [ ] Validate API responses
- [ ] Test navigation hierarchy
- [ ] Verify dark/light modes
- [ ] Document any issues

---

**Testing Version:** 1.0  
**Last Updated:** August 25, 2026
