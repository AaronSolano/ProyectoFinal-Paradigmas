import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const SCHEMA_NAME = /^[a-z_][a-z0-9_]*$/;

export function rewriteAuthSchema(source: string, schemaName: string): string {
  if (!SCHEMA_NAME.test(schemaName)) {
    throw new Error("Nombre de esquema inválido.");
  }
  if (schemaName === "auth") {
    return source;
  }
  return source
    .replaceAll('schemas  = ["auth"]', `schemas  = ["${schemaName}"]`)
    .replaceAll('@@schema("auth")', `@@schema("${schemaName}")`);
}

if (require.main === module) {
  const schemaName = process.env.PRISMA_AUTH_SCHEMA ?? "auth";
  const schemaPath = resolve(__dirname, "../../prisma/schema.prisma");
  writeFileSync(schemaPath, rewriteAuthSchema(readFileSync(schemaPath, "utf8"), schemaName));
}
