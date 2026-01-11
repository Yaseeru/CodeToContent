import { signIn } from "@/lib/auth"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Logo } from "@/components/ui/Logo"

/**
 * Landing Page
 * 
 * Clean, minimal landing page following developer-focused UI redesign.
 * Uses design tokens for consistent spacing, typography, and colors.
 * 
 * Requirements:
 * - 2.1: Spacing scale compliance
 * - 3.1-3.7: Typography system
 * - 4.1-4.13, 5.1-5.11: Theme-appropriate colors
 * - 13.1-13.8: Visual design constraints (no emojis, gradients, animations)
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-xl px-lg md:px-xl bg-bg-app transition-none">
      {/* Header section with logo and title */}
      <div className="flex flex-col items-center gap-lg text-center">
        <Logo size="lg" className="text-accent-neutral" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-text-primary">CodeToContent</h1>
        <p className="text-base text-text-secondary max-w-[600px]">
          Turn real code into real content—automatically.
        </p>
      </div>

      {/* Sign in card */}
      <Card className="w-full max-w-[400px] text-center" padding="lg">
        <p className="text-sm text-text-secondary mb-lg">Sign in to get started</p>
        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/dashboard" })
          }}
        >
          <Button type="submit" variant="primary" className="w-full">
            Sign in with GitHub
          </Button>
        </form>
      </Card>
    </main>
  );
}
