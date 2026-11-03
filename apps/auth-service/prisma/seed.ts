import { PrismaClient, UserRole } from "@profelink/auth-prisma";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

/** Contraseña de demostración (solo desarrollo / evaluación académica). */
const DEMO_PASSWORD = "Profelink123!";

const demoUsers = [
  {
    email: "profe@profelink.cr",
    displayName: "Profesor ProfeLink",
    role: UserRole.HOST,
  },
  {
    email: "alumno@profelink.cr",
    displayName: "Alumno ProfeLink",
    role: UserRole.PARTICIPANT,
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        role: user.role,
      },
      create: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        passwordHash,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
