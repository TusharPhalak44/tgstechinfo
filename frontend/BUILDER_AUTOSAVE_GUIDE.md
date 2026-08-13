# Visual Builder Auto-Save Quick Guide

## What is Auto-Save?

The Visual Builder automatically saves your work as you create content. You no longer need to worry about losing your work due to browser crashes, accidental page closes, or other interruptions.

## How It Works

### 🔄 Automatic Saving
- **Saves automatically** after 1 second of inactivity
- **Works with all changes**: dragging widgets, editing text, changing styles
- **No manual action needed** - just build and it saves

### 📊 Status Indicator
Look at the top-left of the builder:

| Icon | Status | Meaning |
|------|--------|---------|
| 🔄 **Saving...** | In Progress | Your changes are being saved right now |
| ✅ **Saved** | Complete | All your changes are safely stored |
| ⚠️ **Error** | Failed | Something went wrong (rare) |

## Key Features

### 1. Crash Recovery
**What happens:** Browser crashes or tab closes accidentally

**Protection:**
- Your work is backed up to browser storage every 0.3 seconds
- When you return, you'll see: *"We found unsaved changes from your previous session. Would you like to restore them?"*
- Click **OK** to restore your work

**Note:** Recovery data is kept for 24 hours

### 2. Continuous Backup
- **Local Backup:** Saved to your browser (300ms)
- **Server Backup:** Saved to database (1 second)
- **Double protection** against data loss

### 3. Smart Navigation
If you try to leave the page with very recent changes:
- Browser shows a warning
- You can choose to stay and let auto-save complete
- Or leave anyway (work is already mostly saved)

## Usage Examples

### Creating New Content

```
1. Open "Create Content"
2. Switch to "Drag & Drop Builder" tab
3. Start dragging widgets
   ⏱️ Wait 1 second...
   ✅ "Saved" appears
4. Continue working - it keeps auto-saving
5. When done, click "Submit for Review"
```

### Editing Existing Content

```
1. Open your draft
2. Make changes in builder
   ⏱️ Auto-saves after 1 second
3. Make more changes
   ⏱️ Auto-saves again
4. Click "Submit for Review" when ready
```

### Recovering After Crash

```
1. Reopen the page
2. See prompt: "Restore unsaved changes?"
3. Click OK
4. Your work appears exactly as you left it
5. Continue working
```

## Tips & Best Practices

### ✅ DO:
- Watch for the green checkmark (✅ Saved)
- Accept restore prompts if you see them
- Wait a moment after making changes before closing browser
- Trust the auto-save - it's reliable!

### ❌ DON'T:
- Don't close the browser while it says "🔄 Saving..."
- Don't worry about manually saving every minute
- Don't panic if your browser crashes - your work is safe!

## Common Questions

### Q: Do I still need to click "Save Draft"?
**A:** Only once at the start to create the draft. After that, auto-save handles everything.

### Q: How often does it save?
**A:** Every 1 second after you stop making changes.

### Q: What if I lose internet connection?
**A:** Your work is backed up locally in your browser. When connection returns, it syncs to the server.

### Q: Can I undo auto-saved changes?
**A:** Auto-save preserves your latest work. Use Ctrl+Z in the builder to undo recent actions.

### Q: What happens when I submit for review?
**A:** Auto-save data is automatically cleaned up. Your content is now in the review system.

## Troubleshooting

### "I don't see the status indicator"
- Make sure you're in the "Drag & Drop Builder" tab
- Status only shows when builder is embedded (creating/editing content)

### "Changes aren't saving"
1. Check for green checkmark (✅ Saved)
2. Look for error messages
3. Try manual "Save Draft" button
4. Check internet connection
5. Refresh and try again

### "Restore prompt doesn't appear"
- Data might be older than 24 hours
- You may have already declined once
- Data was cleared by browser cleanup

### "Frequent 'Saving...' indicator"
- This is normal! It means auto-save is working
- Each change triggers a new save
- Wait for green checkmark to confirm

## Privacy & Storage

### What's Saved Where?

**Browser LocalStorage:**
- Temporary backup for crash recovery
- Stored on your device only
- Expires after 24 hours
- Cleared after successful server save

**Server Database:**
- Permanent storage
- Accessible from any device
- Included in backups
- Remains until you delete the draft

### Storage Limits
- LocalStorage: Up to 5-10MB per domain
- Visual Builder typically uses < 1MB per page
- Old recovery data is automatically cleaned

## Need Help?

If auto-save isn't working:
1. Check browser console (F12 → Console tab)
2. Screenshot any error messages
3. Note what you were doing when it failed
4. Contact support with these details

## Video Tutorial

🎥 **Coming Soon:** Watch a video guide showing auto-save in action!

---

**Remember:** Auto-save is your safety net. Keep creating amazing content without worry! ✨
