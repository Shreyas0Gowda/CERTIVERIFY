const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/db");
const dbService = require("../services/dbService");

async function seed() {
  await connectDB();

  const defaultAdmin = {
    username: "admin",
    email: "admin@certiverify.edu",
    password: "AdminPassword123!",
    walletAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    role: "admin",
  };

  const existing = await dbService.findAdminByUsernameOrEmail(defaultAdmin.username);
  if (existing) {
    console.log("[Seed] Administrator account already exists: admin / admin@certiverify.edu");
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultAdmin.password, salt);

  await dbService.createAdmin({
    username: defaultAdmin.username,
    email: defaultAdmin.email,
    passwordHash: passwordHash,
    walletAddress: defaultAdmin.walletAddress,
    role: defaultAdmin.role,
  });

  console.log("==================================================");
  console.log("   CERTIVERIFY ADMIN CREDENTIALS INITIALIZED      ");
  console.log("==================================================");
  console.log(`Username:  ${defaultAdmin.username}`);
  console.log(`Email:     ${defaultAdmin.email}`);
  console.log(`Password:  ${defaultAdmin.password}`);
  console.log(`Wallet:    ${defaultAdmin.walletAddress}`);
  console.log("==================================================");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });

