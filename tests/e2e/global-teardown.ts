import { removeTestData } from "./admin-fixtures";

/** Always runs: removes test accounts and any test content (including contact messages). */
export default async function globalTeardown() {
  await removeTestData();
}
