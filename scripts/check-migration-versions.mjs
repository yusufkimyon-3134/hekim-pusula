import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = path.join(projectRoot, "supabase", "migrations");
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();

const filesByVersion = new Map();

for (const file of migrationFiles) {
  const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(file);
  if (!match) {
    throw new Error(`Geçersiz migration dosya adı: ${file}`);
  }

  const version = match[1];
  filesByVersion.set(version, [...(filesByVersion.get(version) ?? []), file]);
}

const duplicates = [...filesByVersion.entries()].filter(([, files]) => files.length > 1);

if (duplicates.length > 0) {
  const details = duplicates
    .map(([version, files]) => `${version}: ${files.join(", ")}`)
    .join("\n");
  throw new Error(`Aynı sürüm numarasını kullanan migration dosyaları var:\n${details}`);
}

console.log(`${migrationFiles.length} migration dosyasının sürüm numaraları benzersiz.`);
