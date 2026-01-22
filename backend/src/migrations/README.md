# Database Migrations

This directory contains database migration scripts for the CodeToContent application.

## Migration: Add contentFormat Field

**File:** `20240101_add_content_format_field.ts`

**Purpose:** Adds the `contentFormat` field to existing Content documents to support the multi-format X content engine feature.

### What This Migration Does

1. Finds all Content documents without a `contentFormat` field
2. Sets `contentFormat` to `'single'` for backward compatibility
3. Ensures `tweets` field is undefined for single posts
4. Provides verification and rollback capabilities

### Running the Migration

#### Prerequisites

- Ensure MongoDB is running
- Ensure `.env` file is configured with correct `MONGODB_URI`
- Install dependencies: `npm install`

#### Execute Migration

```bash
# From the backend directory
cd backend

# Run the migration
npx ts-node src/migrations/20240101_add_content_format_field.ts migrate
```

#### Verify Migration

```bash
# Check migration results
npx ts-node src/migrations/20240101_add_content_format_field.ts verify
```

#### Rollback Migration

```bash
# Rollback if needed (removes contentFormat field)
npx ts-node src/migrations/20240101_add_content_format_field.ts rollback
```

### Expected Output

```
Starting migration: Add contentFormat field to Content documents
Connecting to database...
Database connected successfully
Found 42 documents without contentFormat field
Progress: 100/42 documents updated

Migration completed successfully!
Statistics:
  Total documents found: 42
  Documents updated: 42
  Documents skipped: 0
  Errors: 0

Verifying migration...

Verification Results:
  Documents with contentFormat: 42
  Documents without contentFormat: 0
  Single posts: 42
  Mini threads: 0
  Full threads: 0

✓ All documents have contentFormat field

Database connection closed
```

### Testing on Development Database

1. **Backup your database first:**
   ```bash
   mongodump --uri="mongodb://localhost:27017/code-to-content" --out=./backup
   ```

2. **Run migration in dry-run mode (verify only):**
   ```bash
   npx ts-node src/migrations/20240101_add_content_format_field.ts verify
   ```

3. **Execute the migration:**
   ```bash
   npx ts-node src/migrations/20240101_add_content_format_field.ts migrate
   ```

4. **Verify results:**
   ```bash
   npx ts-node src/migrations/20240101_add_content_format_field.ts verify
   ```

5. **If something goes wrong, rollback:**
   ```bash
   npx ts-node src/migrations/20240101_add_content_format_field.ts rollback
   ```

6. **Restore from backup if needed:**
   ```bash
   mongorestore --uri="mongodb://localhost:27017/code-to-content" ./backup/code-to-content
   ```

### Rollback Procedure

If you need to rollback the migration:

1. **Execute rollback command:**
   ```bash
   npx ts-node src/migrations/20240101_add_content_format_field.ts rollback
   ```

2. **Verify rollback:**
   ```bash
   npx ts-node src/migrations/20240101_add_content_format_field.ts verify
   ```

3. **Expected output:**
   ```
   Starting rollback: Remove contentFormat field from Content documents
   Connecting to database...
   Database connected successfully
   Rollback completed. Modified 42 documents.
   
   Verifying migration...
   
   Verification Results:
     Documents with contentFormat: 0
     Documents without contentFormat: 42
     Single posts: 0
     Mini threads: 0
     Full threads: 0
   
   ⚠️  Warning: 42 documents still missing contentFormat field
   ```

### Safety Considerations

- **Always backup your database before running migrations**
- **Test on development database first**
- **Run verification before and after migration**
- **Monitor for errors during migration**
- **Keep rollback procedure ready**

### Troubleshooting

#### Error: Cannot connect to database

- Check if MongoDB is running: `mongosh`
- Verify `MONGODB_URI` in `.env` file
- Ensure network connectivity

#### Error: Permission denied

- Check MongoDB user permissions
- Ensure user has write access to the database

#### Migration shows 0 documents

- This is normal if all documents already have `contentFormat` field
- Run verify command to check current state

#### Some documents failed to update

- Check error logs for specific document IDs
- Manually inspect failed documents
- Re-run migration (it will skip already updated documents)

### Production Deployment

1. **Schedule maintenance window**
2. **Backup production database**
3. **Test migration on staging environment**
4. **Run migration during low-traffic period**
5. **Monitor application logs**
6. **Verify migration results**
7. **Keep rollback ready for 24 hours**

### Migration History

| Date | Migration | Status | Documents Affected |
|------|-----------|--------|-------------------|
| 2024-01-01 | Add contentFormat field | Pending | TBD |

