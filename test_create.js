require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const patient = await prisma.patient.create({
      data: {
        firstName: "АРТЁМ",
        lastName: "С.",
        phone: "+79509851442",
        email: "",
        messengerAccounts: {
          create: [
            { platform: 'TELEGRAM', externalId: 'ivan_petrov' },
            { platform: 'MAX', externalId: '79991234567' }
          ]
        }
      }
    });
    console.log("Success:", patient);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
