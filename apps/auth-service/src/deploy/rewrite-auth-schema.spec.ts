import { readFileSync } from "fs";
import { resolve } from "path";
import { rewriteAuthSchema } from "./rewrite-auth-schema";

const localSchema = readFileSync(resolve(__dirname, "../../prisma/schema.prisma"), "utf8");

describe("rewrite auth schema for Supabase", () => {
  it("leaves the local auth schema untouched", () => {
    expect(rewriteAuthSchema(localSchema, "auth")).toBe(localSchema);
    expect(localSchema).toContain('schemas  = ["auth"]');
    expect(localSchema).toContain('@@schema("auth")');
  });

  it("points only the production copy at verix_auth", () => {
    const rewritten = rewriteAuthSchema(localSchema, "verix_auth");

    expect(rewritten).toContain('schemas  = ["verix_auth"]');
    expect(rewritten).toContain('@@schema("verix_auth")');
    expect(rewritten).not.toContain('@@schema("auth")');
    expect(localSchema).toContain('@@schema("auth")');
  });

  it("rejects a schema name that is not a postgres identifier", () => {
    expect(() => rewriteAuthSchema(localSchema, "auth.users")).toThrow("Nombre de esquema inválido.");
  });
});
