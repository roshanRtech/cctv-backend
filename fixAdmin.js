const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // හෝ 'bcryptjs' භාවිතා කරන්න
const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    // "admin123" කියන එක පද්ධතියට තේරෙන විදිහට ආරක්ෂිතව Encrypt කිරීම
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // අලුත් Encrypt වුණු පාස්වර්ඩ් එක Database එකට යාවත්කාලීන කිරීම
    await prisma.user.upsert({
      where: { email: "admin@cctv.com" },
      update: { password: hashedPassword },
      create: {
        name: "System Admin",
        email: "admin@cctv.com",
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    console.log("✅ Admin පාස්වර්ඩ් එක සාර්ථකව Encrypt කර යාවත්කාලීන කළා!");
  } catch (error) {
    console.log("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();