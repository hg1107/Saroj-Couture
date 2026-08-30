"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";

const initialState = { error: undefined as string | undefined };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <main className="min-h-dvh flex items-center justify-center bg-surface p-margin-mobile">
      <div className="w-full max-w-[360px] bg-surface-container-lowest border border-outline-variant p-8 rounded-sm flex flex-col items-center">
        <h1 className="font-headline-md text-headline-md text-primary mb-12 tracking-widest text-center uppercase">
          SAROJ COUTURE
        </h1>

        <form action={formAction} className="w-full flex flex-col gap-8" noValidate>
          {/* Email field — floating label pattern from Stitch */}
          <div className="relative w-full">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              placeholder="Email"
              className="peer w-full border-0 border-b border-outline-variant bg-transparent py-2 px-0 font-body-md text-body-md text-primary focus:ring-0 focus:border-primary transition-colors placeholder-transparent disabled:opacity-50"
            />
            <label
              htmlFor="email"
              className="absolute left-0 top-2 origin-[0] -translate-y-6 scale-75 transform font-label-md text-label-md text-on-surface-variant duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary uppercase tracking-widest -z-10"
            >
              Email
            </label>
          </div>

          {/* Password field */}
          <div className="relative w-full">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              placeholder="Password"
              className="peer w-full border-0 border-b border-outline-variant bg-transparent py-2 px-0 font-body-md text-body-md text-primary focus:ring-0 focus:border-primary transition-colors placeholder-transparent disabled:opacity-50"
            />
            <label
              htmlFor="password"
              className="absolute left-0 top-2 origin-[0] -translate-y-6 scale-75 transform font-label-md text-label-md text-on-surface-variant duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary uppercase tracking-widest -z-10"
            >
              Password
            </label>
          </div>

          {/* Error message */}
          {state?.error && (
            <p
              role="alert"
              aria-live="polite"
              className="font-body-sm text-body-sm text-error text-center"
            >
              {state.error}
            </p>
          )}

          {/* Submit */}
          <div className="mt-4 w-full">
            <button
              type="submit"
              disabled={isPending}
              aria-disabled={isPending}
              className="w-full bg-secondary text-on-primary py-4 px-6 rounded-sm font-label-lg text-label-lg uppercase tracking-[0.1em] hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm" aria-hidden="true">progress_activity</span>
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
