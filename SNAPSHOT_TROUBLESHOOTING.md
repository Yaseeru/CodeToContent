# Snapshot Generation Troubleshooting Guide

## Problem
The "Generate Snapshots" button shows loading state for a few seconds, then returns to initial state without generating snapshots or showing an error.

## Debugging Steps

### Step 1: Check Browser Console
1. Open your browser (where the app is running)
2. Press **F12** to open DevTools
3. Go to the **Console** tab
4. Click "Generate Snapshots" button
5. Look for logs starting with `[SnapshotSelector]`

**What to look for:**
```
[SnapshotSelector] Starting snapshot generation for repository: <id>
[SnapshotSelector] Snapshot generation error: <error details>
```

### Step 2: Check Network Tab
1. In DevTools, go to the **Network** tab
2. Click "Generate Snapshots" button
3. Look for a request to `/api/snapshots/generate`
4. Click on it to see details

**Check the response:**
- **Status 401**: Not authenticated → Log in again
- **Status 404**: Repository not found → Add repository first
- **Status 400**: Bad request → Repository needs to be analyzed first
- **Status 503**: Service unavailable → Check backend logs

### Step 3: Check Backend Logs
Look at the terminal where `npm run dev:backend` is running.

**Look for these log entries:**
```
[INFO] Snapshot generation request received
[WARN] Unauthorized snapshot generation attempt
[WARN] Repository not found or unauthorized
[INFO] Calling VisualSnapshotService.generateSnapshotsForRepository
```

## Common Issues & Solutions

### Issue 1: Not Authenticated (401 Error)
**Symptoms:**
- Network tab shows 401 status
- Console shows authentication error

**Solution:**
1. Log out and log in again with GitHub
2. Check that JWT token exists: `localStorage.getItem('jwt')` in console
3. If token is missing, the OAuth flow might have failed

### Issue 2: Repository Not Found (404 Error)
**Symptoms:**
- Network tab shows 404 status
- Backend logs: "Repository not found or unauthorized"

**Solution:**
1. Go to Dashboard
2. Make sure the repository is in your list
3. If not, click "Add Repository" and connect it from GitHub

### Issue 3: Repository Not Analyzed (400 Error)
**Symptoms:**
- Error message: "Please analyze the repository before generating snapshots"

**Solution:**
1. Go to the repository page
2. Click "Analyze Repository" button
3. Wait for analysis to complete (10-30 seconds)
4. Then try generating snapshots again

### Issue 4: Gemini API Error (503 Error)
**Symptoms:**
- Network tab shows 503 status
- Backend logs show Gemini API errors

**Solution:**
1. Check if `GEMINI_API_KEY` is set in `backend/.env`
2. Verify the API key is valid at https://aistudio.google.com/apikey
3. Check if you've hit rate limits
4. Wait a few minutes and try again

### Issue 5: Puppeteer Initialization Failed
**Symptoms:**
- Backend logs show "Failed to initialize ImageRenderingService"
- 503 error when generating snapshots

**Solution:**
1. Check if Chrome/Chromium is installed
2. On Windows, Puppeteer should download Chrome automatically
3. If it fails, install Chrome manually
4. Restart the backend server

### Issue 6: Silent Failure (No Error Shown)
**Symptoms:**
- Loading state appears then disappears
- No error message shown in UI
- No console errors

**Possible causes:**
1. Error is being caught but not set in state
2. Component is unmounting before error displays
3. Error response format doesn't match expected structure

**Solution:**
Check the browser console for the detailed error logs we added:
```javascript
[SnapshotSelector] Snapshot generation error: <details>
```

## Testing the Endpoint Directly

Use the provided test script:

```bash
node test-snapshot-endpoint.js
```

This will help identify if the issue is in the frontend or backend.

## Quick Checklist

Before generating snapshots, ensure:
- [ ] Backend server is running (`npm run dev:backend`)
- [ ] Frontend is running (`npm run dev:frontend`)
- [ ] You're logged in with GitHub
- [ ] Repository is added to your account
- [ ] Repository has been analyzed
- [ ] `GEMINI_API_KEY` is set in `backend/.env`
- [ ] MongoDB is connected (check backend logs)
- [ ] Redis is connected (check backend logs)

## Still Not Working?

1. **Check backend logs** for detailed error messages
2. **Check browser console** for frontend errors
3. **Check Network tab** for API response details
4. **Try the test script** to isolate the issue
5. **Restart both servers** (backend and frontend)
6. **Clear browser cache** and localStorage
7. **Try a different repository** to see if it's repo-specific

## Expected Successful Flow

When everything works correctly, you should see:

**Browser Console:**
```
[SnapshotSelector] Starting snapshot generation for repository: 67...
[SnapshotSelector] Snapshot generation response: { count: 5, snapshots: [...] }
[SnapshotSelector] Fetched snapshots: 5
```

**Backend Logs:**
```
[INFO] Snapshot generation request received
[INFO] Repository found
[INFO] Calling VisualSnapshotService.generateSnapshotsForRepository
[INFO] Starting snapshot generation
[INFO] Snippet selection cache miss, performing selection
[INFO] Scoring candidate snippets
[INFO] Selected top snippets for rendering
[INFO] Successfully generated snapshots
```

**UI:**
- Loading spinner appears
- After 10-30 seconds, 5 snapshot thumbnails appear
- You can click on them to preview
- You can select one to attach to content

## Need More Help?

Share the following information:
1. Browser console logs (with `[SnapshotSelector]` prefix)
2. Network tab response for `/api/snapshots/generate`
3. Backend logs (last 50 lines)
4. Steps you took before the error occurred
