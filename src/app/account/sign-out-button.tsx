import { signOut } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="btn-secondary">
        Sign out
      </button>
    </form>
  );
}
