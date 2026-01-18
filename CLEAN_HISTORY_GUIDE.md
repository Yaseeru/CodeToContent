# Git History Cleanup Guide

## The Problem

The old credentials are still in your git history. Even though we removed the file, anyone can access old commits and see the exposed credentials.

## Solution Options

### Option 1: Using the Batch Script (Easiest for Windows)

I've created a script for you:

```bash
.\clean-git-history.bat
```

This will:
1. Remove `backend/.env.production` from all commits
2. Clean up git references
3. Optimize the repository
4. Tell you when it's done

### Option 2: Manual Command (Windows PowerShell/CMD)

Copy and paste this EXACT command (all on one line):

```bash
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/.env.production" --prune-empty --tag-name-filter cat -- --all
```

Then run cleanup:
```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Option 3: Using git-filter-repo (Recommended by Git)

**Step 1: Install git-filter-repo**

Download from: https://github.com/newren/git-filter-repo/

Or install via pip:
```bash
pip install git-filter-repo
```

**Step 2: Run the filter**

```bash
git filter-repo --path backend/.env.production --invert-paths --force
```

This is faster and safer than filter-branch.

## After Cleaning History

Once any of the above methods succeeds, you'll see:

```
Rewrite dd474d481347ef86fd8037b05ee3da602fd35df7 (104/104)
Ref 'refs/heads/main' was rewritten
```

## Final Step: Force Push

**WARNING:** This will rewrite GitHub history. Anyone who has cloned your repo will need to re-clone.

```bash
git push origin --force --all
git push origin --force --tags
```

## Verify It Worked

Check that the file is gone from history:

```bash
git log --all --full-history -- backend/.env.production
```

Should return: (nothing)

If it shows commits, the cleanup didn't work.

## Troubleshooting

### Error: "\ : Is a directory"

This happens when the command is split across lines incorrectly.

**Fix:** Use the batch script or copy the command as ONE line.

### Error: "Cannot rewrite branch(es) with a dirty working directory"

You have uncommitted changes.

**Fix:**
```bash
git status
git add .
git commit -m "Commit before cleanup"
```

Then try again.

### Error: "git-filter-branch has a glut of gotchas"

This is just a warning. You can:

**Option A:** Ignore it and proceed (it will work)

**Option B:** Use git-filter-repo instead (better tool)

**Option C:** Set the environment variable to suppress warning:
```bash
set FILTER_BRANCH_SQUELCH_WARNING=1
```
Then run the command again.

## What If It Still Fails?

### Alternative: BFG Repo-Cleaner

**Step 1: Download BFG**
https://rtyley.github.io/bfg-repo-cleaner/

Download `bfg.jar`

**Step 2: Run BFG**
```bash
java -jar bfg.jar --delete-files backend/.env.production
```

**Step 3: Cleanup**
```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**Step 4: Force push**
```bash
git push origin --force --all
```

## Quick Decision Tree

```
Can you install Python/pip?
├─ YES → Use git-filter-repo (best option)
└─ NO
   ├─ Have Java installed?
   │  ├─ YES → Use BFG Repo-Cleaner
   │  └─ NO → Use the batch script or manual command
   └─ Just want it done → Use the batch script
```

## Status Check

After cleanup, verify:

```bash
# Should show no results
git log --all --full-history -- backend/.env.production

# Should show clean status
node scripts/check-secrets.js

# Should show you're ahead of origin
git status
```

## Next Steps After Success

1. ✅ Force push to GitHub
2. ✅ Install Husky: `npm install --save-dev husky && npx husky install`
3. ✅ Test application: `npm run dev`
4. ✅ Monitor services for 30 days

---

**Need help? Check which error you're getting and follow the troubleshooting steps above.**
