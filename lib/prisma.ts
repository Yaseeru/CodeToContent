import { PrismaClient } from "@prisma/client"
import { validateEnv } from "@/lib/env"

// Validate environment variables before initializing Prisma
validateEnv()

const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient
     schemaValidated: boolean
}

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

/**
 * Verify that the database schema matches the Prisma schema
 * This should be called on application startup to ensure migrations are applied
 */
async function verifyDatabaseSchema(): Promise<void> {
     // Skip verification if already done in this process
     if (globalForPrisma.schemaValidated) {
          return
     }

     try {
          // Attempt a simple query to verify database connectivity and schema
          // This will fail if the schema is out of sync or migrations haven't been applied
          await prisma.$queryRaw`SELECT 1`

          // Verify that key tables exist by attempting to count records
          // This ensures the schema is properly initialized
          await prisma.user.count()
          await prisma.account.count()
          await prisma.session.count()
          await prisma.contentDraft.count()

          // Mark schema as validated for this process
          globalForPrisma.schemaValidated = true
     } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)

          // Check if this is a schema-related error
          if (
               errorMessage.includes('relation') ||
               errorMessage.includes('table') ||
               errorMessage.includes('column') ||
               errorMessage.includes('does not exist')
          ) {
               throw new Error(
                    'Database schema is out of sync with Prisma schema. ' +
                    'Please run "npx prisma migrate deploy" to apply pending migrations. ' +
                    `Original error: ${errorMessage}`
               )
          }

          // Re-throw other errors (connection issues, etc.)
          throw new Error(
               `Failed to verify database schema: ${errorMessage}`
          )
     }
}

// Verify schema on module load in production
// In development, we skip this to allow for easier schema changes
if (process.env.NODE_ENV === "production") {
     verifyDatabaseSchema().catch((error) => {
          console.error("Database schema verification failed:", error)
          process.exit(1)
     })
}

export { verifyDatabaseSchema }
