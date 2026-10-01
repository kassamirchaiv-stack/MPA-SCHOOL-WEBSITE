import { createTestAdmins } from "./admin-fixtures";

export default async function globalSetup() {
  if (process.env.E2E_ADMIN === "0") return;
  const { superPassword, editorPassword } = await createTestAdmins();
  // Environment variables set here are visible to the test workers.
  process.env.E2E_SUPER_PASSWORD = superPassword;
  process.env.E2E_EDITOR_PASSWORD = editorPassword;
}
