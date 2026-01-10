import { signIn } from "@/lib/auth"

export default function Home() {
  return (
    <main className="container" style={{ paddingTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold' }}>CodeToContent</h1>
      <p style={{ color: 'var(--foreground-secondary)', fontSize: '18px', textAlign: 'center', maxWidth: '600px' }}>
        Turn real code into real content—automatically.
      </p>

      <div style={{ marginTop: '32px', padding: '32px', background: 'var(--background-secondary)', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <p style={{ marginBottom: '16px' }}>Sign in to get started</p>
        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/dashboard" })
          }}
        >
          <button type="submit" style={{
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 600
          }}>
            Sign in with GitHub
          </button>
        </form>
      </div>
    </main>
  );
}
