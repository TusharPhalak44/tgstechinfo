# Clear Builder LocalStorage (Troubleshooting)

If you're experiencing issues with the Visual Builder (blank page, errors, crashes), try clearing the localStorage data:

## Method 1: Via Browser Console

1. Open the page with the builder
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Paste this code and press Enter:

```javascript
// Clear all builder auto-save data
Object.keys(localStorage)
  .filter(key => key.startsWith('builder_autosave_'))
  .forEach(key => {
    console.log('Removing:', key);
    localStorage.removeItem(key);
  });
console.log('✅ Builder localStorage cleared!');
location.reload();
```

## Method 2: Via Application Tab

1. Open Developer Tools (`F12`)
2. Go to **Application** tab
3. In left sidebar, expand **Local Storage**
4. Click on your domain (e.g., `http://localhost:3000`)
5. Find keys starting with `builder_autosave_`
6. Right-click each one and select **Delete**
7. Refresh the page

## Method 3: Clear All Site Data (Nuclear Option)

**Warning:** This will log you out and clear all saved settings!

1. Open Developer Tools (`F12`)
2. Go to **Application** tab
3. Click **Clear site data** button
4. Confirm
5. Refresh page and log back in

## When to Use This

Clear localStorage if you see:
- Blank page in builder
- "Uncaught error" in console
- Builder won't load
- Corrupted data errors
- After updating builder code

## Prevention

To prevent corruption:
- Wait for green "Saved" checkmark before closing browser
- Don't interrupt during "Saving..."
- Keep browser updated
- Use modern browsers (Chrome, Firefox, Edge)

---

**After clearing, the builder will start fresh and work normally.**
