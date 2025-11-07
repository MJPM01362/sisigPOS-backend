// bcryptTest.js
import bcrypt from "bcryptjs";

const plainPassword = "your_plain_password_here"; // e.g., "admin123"
const storedHash = "$2b$10$Yeqs8saLG1ftw77ZdglOiOfaEVBCi9JgXGL0TellEIEiwjpOdETMm";

(async () => {
  const isMatch = await bcrypt.compare(plainPassword, storedHash);
  console.log("Password match:", isMatch);
})();