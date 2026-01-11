import { signIn } from "@/lib/auth"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Logo } from "@/components/ui/Logo"

export default function Home() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-8 px-4 md:px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo size="lg" className="text-accent" aria-hidden="true" />
        <h1 className="text-h1 font-semibold">CodeToContent</h1>
        <p className="text-h3 text-foreground-secondary max-w-[600px]">
          Turn real code into real content—automatically.
        </p>
      </div>

      <Card className="w-full max-w-[400px] text-center" padding="lg">
        <p className="text-body mb-4">Sign in to get started</p>
        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/dashboard" })
          }}
        >
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Sign in with GitHub
          </Button>
        </form>
      </Card>
    </main>
  );
}
