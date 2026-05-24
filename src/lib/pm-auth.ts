/** Emails allowed to access the PM Portal. */
export const PM_PORTAL_EMAILS = ["hbgstrategies@gmail.com"];

export function isPMUser(email: string | null | undefined): boolean {
  return PM_PORTAL_EMAILS.includes((email ?? "").toLowerCase());
}
