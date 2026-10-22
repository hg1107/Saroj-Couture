import Link from "next/link";

/**
 * There's no email service, so a forgotten password is reset on the server
 * itself (see scripts/set-owner-password.ts). This page just says so.
 */
export default function ForgotPasswordPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-surface p-margin-mobile">
      <div className="w-full max-w-[360px] bg-surface-container-lowest border border-outline-variant p-8 rounded-sm flex flex-col items-center">
        <h1 className="font-headline-md text-headline-md text-primary mb-4 tracking-widest text-center uppercase">
          SAROJ COUTURE
        </h1>

        <p className="font-body-md text-body-md text-on-surface-variant text-center mt-4">
          Forgotten your password? Ask whoever manages the website server to reset it with:
        </p>
        <code className="block w-full mt-4 p-3 bg-surface-container font-body-sm text-body-sm text-primary rounded-sm break-all">
          npm run owner:set-password
        </code>
        <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-4">
          Once signed in, you can change it any time from the key icon in the admin bar.
        </p>

        <Link
          href="/admin/login"
          className="mt-8 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
