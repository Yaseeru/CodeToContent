@echo off
echo Cleaning git history to remove exposed credentials...
echo.
echo WARNING: This will rewrite git history!
echo Press Ctrl+C to cancel, or
pause

git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/.env.production" --prune-empty --tag-name-filter cat -- --all

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Now cleaning up...
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    echo.
    echo ========================================
    echo Git history cleaned successfully!
    echo ========================================
    echo.
    echo Next step: Force push to GitHub
    echo Run: git push origin --force --all
    echo.
) else (
    echo.
    echo ERROR: Git filter-branch failed!
    echo Try using git-filter-repo instead.
    echo.
)

pause
