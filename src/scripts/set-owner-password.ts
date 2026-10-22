/**
 * Creates the owner account, or resets its email/password. Also signs out
 * every existing session. This is the "forgot password" flow — there's no
 * email service.
 *
 *   npm run owner:set-password
 *
 * Prompts for the email and password. For non-interactive use, set
 * OWNER_EMAIL and OWNER_PASSWORD instead.
 */
import postgres from "postgres";
import { createInterface } from "node:readline";
import { MIN_PASSWORD_LENGTH, hashPassword } from "../lib/auth/password.ts";

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Echo nothing while the password is typed.
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
        if (s.startsWith(question)) process.stdout.write(question);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const email = (process.env.OWNER_EMAIL ?? (await ask("Owner email: "))).trim().toLowerCase();
const password = process.env.OWNER_PASSWORD ?? (await ask("New password: ", true));
if (!process.env.OWNER_PASSWORD && password !== (await ask("Repeat password: ", true))) {
  console.error("Passwords do not match.");
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
  console.error("That doesn't look like an email address.");
  process.exit(1);
}
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const hash = await hashPassword(password);
  // There is only ever one owner: update it if it exists, otherwise create it.
  await sql.begin(async (tx) => {
    const [existing] = await tx<{ id: string }[]>`SELECT id FROM admin_users ORDER BY created_at LIMIT 1`;
    if (existing) {
      await tx`UPDATE admin_users SET email = ${email}, password_hash = ${hash} WHERE id = ${existing.id}`;
      await tx`DELETE FROM sessions`;
      console.log(`Owner account updated (${email}). All devices have been signed out.`);
    } else {
      await tx`INSERT INTO admin_users (email, password_hash) VALUES (${email}, ${hash})`;
      console.log(`Owner account created (${email}).`);
    }
  });
} catch (err) {
  console.error("Failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
