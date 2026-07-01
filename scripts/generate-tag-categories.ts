import { execSync } from "child_process";
import * as path from "path";

try {
  const scriptPath = path.join(__dirname, "generate-tag-categories.py");
  console.log(`Running python script to generate tag categories: ${scriptPath}`);
  execSync(`python "${scriptPath}"`, { stdio: "inherit" });
} catch (error) {
  console.error("Error executing generate-tag-categories.py:", error);
  process.exit(1);
}
