import { z } from 'zod'

// Base configuration for Zod
// This module provides validation schemas and helper functions for API input validation

// Validation schema for generate content endpoint
export const GenerateContentSchema = z.object({
     repoName: z.string()
          .trim()
          .min(1, 'Repository name is required')
          .max(100, 'Repository name must be 100 characters or less'),
     owner: z.string()
          .trim()
          .min(1, 'Owner is required')
          .max(100, 'Owner must be 100 characters or less'),
     commitSha: z.string()
          .trim()
          .regex(/^[a-f0-9]{40}$/i, 'Commit SHA must be a valid 40-character hexadecimal string')
})

// Export TypeScript type inferred from schema
export type GenerateContentInput = z.infer<typeof GenerateContentSchema>

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
     try {
          // Parse and validate the data
          const validatedData = schema.parse(data)
          return validatedData
     } catch (error) {
          // Format Zod validation errors
          if (error instanceof z.ZodError) {
               const fieldErrors = error.issues.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
               }))

               // Import ValidationError dynamically to avoid circular dependencies
               const { ValidationError } = require('./errors')
               throw new ValidationError('Validation failed', { fields: fieldErrors })
          }

          // Re-throw unexpected errors
          throw error
     }
}
