/**
 * Environment Variable Validator
 * 
 * Validates that all required environment variables are present and non-empty
 * at application startup. Throws descriptive errors if validation fails.
 */

export interface EnvConfig {
     GITHUB_ID: string
     GITHUB_SECRET: string
     AUTH_SECRET: string
     DATABASE_URL: string
     GEMINI_API_KEY: string
     NODE_ENV: 'development' | 'production' | 'test'
}

/**
 * Validates that all required environment variables are present and non-empty.
 * 
 * @throws {Error} If any required environment variable is missing or empty
 * @returns {EnvConfig} Typed configuration object with all validated environment variables
 */
export function validateEnv(): EnvConfig {
     const requiredVars = [
          'GITHUB_ID',
          'GITHUB_SECRET',
          'AUTH_SECRET',
          'DATABASE_URL',
          'GEMINI_API_KEY',
     ] as const

     const missingVars: string[] = []
     const emptyVars: string[] = []

     // Check each required variable
     for (const varName of requiredVars) {
          const value = process.env[varName]

          if (value === undefined) {
               missingVars.push(varName)
          } else if (value.trim() === '') {
               emptyVars.push(varName)
          }
     }

     // Validate NODE_ENV
     const nodeEnv = process.env.NODE_ENV
     if (!nodeEnv || !['development', 'production', 'test'].includes(nodeEnv)) {
          missingVars.push('NODE_ENV (must be development, production, or test)')
     }

     // Build error message if any variables are missing or empty
     if (missingVars.length > 0 || emptyVars.length > 0) {
          const errorParts: string[] = ['Environment validation failed:']

          if (missingVars.length > 0) {
               errorParts.push(`\nMissing required environment variables: ${missingVars.join(', ')}`)
          }

          if (emptyVars.length > 0) {
               errorParts.push(`\nEmpty environment variables: ${emptyVars.join(', ')}`)
          }

          errorParts.push('\nPlease check your .env file and ensure all required variables are set.')

          throw new Error(errorParts.join(''))
     }

     // Return typed configuration object
     return {
          GITHUB_ID: process.env.GITHUB_ID!,
          GITHUB_SECRET: process.env.GITHUB_SECRET!,
          AUTH_SECRET: process.env.AUTH_SECRET!,
          DATABASE_URL: process.env.DATABASE_URL!,
          GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
          NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
     }
}

// Export validated config for use throughout the application
export const env = validateEnv()
