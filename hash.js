import bcrypt from "bcrypt";

const run = async () => {
  const hash = await bcrypt.hash("arsitek123", 10);
  console.log("HASH PASSWORD:", hash);
};

run();