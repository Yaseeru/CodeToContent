# Test Setup Instructions

## MongoDB Memory Server Requirements

The property-based tests use MongoDB Memory Server, which requires Visual C++ Redistributable on Windows.

### Windows Setup

If you encounter the error:
```
Instance closed unexpectedly with code "3221225781"
```

You need to install Visual C++ Redistributable:

1. Download the latest version from Microsoft:
   https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170

2. Install both x64 and x86 versions

3. Restart your terminal/IDE

4. Run tests again: `npm test`

### Alternative: Use Real MongoDB

If you prefer not to install vc_redist, you can configure tests to use a real MongoDB instance:

1. Start MongoDB locally (default port 27017)
2. Update `backend/src/test/setup.ts` to use real MongoDB instead of Memory Server
3. Ensure you have a test database that can be cleared between tests

### Verifying Installation

After installing vc_redist, run:
```bash
npm test -- analysis.persistence.test.ts
```

The test should complete successfully in ~10-20 seconds.
