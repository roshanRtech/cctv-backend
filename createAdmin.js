const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createInitialUsers() {
  try {
    const admin = await prisma.user.create({
      data: {
        name: "System Admin",
        email: "admin@cctv.com",
        password: "admin123", // ඔබට කැමති පාස්වර්ඩ් එකක් මෙතන දෙන්න
        role: "ADMIN"
      }
    });

    const tech = await prisma.user.create({
      data: {
        name: "Field Technician",
        email: "tech@cctv.com",
        password: "tech",
        role: "TECHNICIAN"
      }
    });

    console.log("✅ ගිණුම් සාර්ථකව සෑදුවා!");
    console.log("Admin Email: admin@cctv.com | Password: admin123");
    console.log("Tech Email: tech@cctv.com | Password: tech");

  } catch (error) {
    console.log("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialUsers();