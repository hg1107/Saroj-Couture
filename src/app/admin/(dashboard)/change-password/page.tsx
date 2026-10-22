"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "@/lib/actions/auth";

const initialState: ChangePasswordState = {};

const FIELDS = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "password",        label: "New password",     autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm password", autoComplete: "new-password" },
] as const;

export default function ChangePasswordPage() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

  return (
    <main className="flex justify-center p-margin-mobile pt-12">
      <div className="w-full max-w-[360px] bg-surface-container-lowest border border-outline-variant p-8 rounded-sm flex flex-col items-center">
        <h1 className="font-headline-md text-headline-md text-primary mb-4 tracking-widest text-center uppercase">
          Change password
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant text-center mb-8">
          Other devices will be signed out.
        </p>

        <form action={formAction} className="w-full flex flex-col gap-8" noValidate>
          {FIELDS.map((f) => (
            <div key={f.name} className="relative w-full">
              <input
                id={f.name}
                name={f.name}
                type="password"
                autoComplete={f.autoComplete}
                required
                disabled={isPending}
                placeholder={f.label}
                className="peer w-full border-0 border-b border-outline-variant bg-transparent py-2 px-0 font-body-md text-body-md text-primary focus:ring-0 focus:border-primary transition-colors placeholder-transparent disabled:opacity-50"
              />
              <label
                htmlFor={f.name}
                className="absolute left-0 top-2 origin-[0] -translate-y-6 scale-75 transform font-label-md text-label-md text-on-surface-variant duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary uppercase tracking-widest"
              >
                {f.label}
              </label>
            </div>
          ))}

          {state?.error && (
            <p role="alert" aria-live="polite" className="font-body-sm text-body-sm text-error text-center">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p role="status" aria-live="polite" className="font-body-sm text-body-sm text-primary text-center">
              Password updated.
            </p>
          )}

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
                  Updating…
                </>
              ) : (
                "Update password"
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
