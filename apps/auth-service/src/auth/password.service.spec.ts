import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("hashes and validates passwords with bcrypt", async () => {
    const hash = await service.hash("Profelink123!");
    expect(hash).not.toEqual("Profelink123!");
    expect(await service.compare("Profelink123!", hash)).toBe(true);
    expect(await service.compare("wrong-password", hash)).toBe(false);
  });
});
