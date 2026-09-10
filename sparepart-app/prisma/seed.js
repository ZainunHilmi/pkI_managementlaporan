// Seed akun ADMIN awal. Jalankan: npm run db:seed
// Kredensial via env (SEED_ADMIN_EMAIL / SEED_ADMIN_NAME / SEED_ADMIN_PASSWORD),
// atau default di bawah. Aman dijalankan ulang (upsert by email).
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

(async () => {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@sparepart.local";
  const name = process.env.SEED_ADMIN_NAME || "Administrator";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin12345";

  // bcrypt saltRounds 12 sesuai SRS §6.1.
  const passwordHash = await hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, password: passwordHash, role: "ADMIN", isActive: true },
  });

  console.log(`Seed OK: ${user.email} (${user.role})`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error("Seed FAIL:", e.message);
  await prisma.$disconnect();
  process.exitCode = 1;
});
