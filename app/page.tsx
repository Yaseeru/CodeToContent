import { signIn } from "@/lib/auth"
import styles from "./page.module.css"

export default function Home() {
  return (
    <main className={`container ${styles.main}`}>
      <h1 className={styles.title}>CodeToContent</h1>
      <p className={styles.description}>
        Turn real code into real content—automatically.
      </p>

      <div className={styles.signInCard}>
        <p className={styles.signInPrompt}>Sign in to get started</p>
        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/dashboard" })
          }}
        >
          <button type="submit" className={styles.signInButton}>
            Sign in with GitHub
          </button>
        </form>
      </div>
    </main>
  );
}
