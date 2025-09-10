import fs from "fs";
import path from "path";

//store text of the response to the data folder
export function saveToFile(fileName: string, content: string) {
  const filePath = path.join(__dirname, "../data", fileName);
  fs.writeFileSync(filePath, content);
}

export function readFromFile(fileName: string): string | null {
  const filePath = path.join(__dirname, "../data", fileName);
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    return null;
  }
}
