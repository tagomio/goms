import fs from "fs";
import {tags, goms} from "./data.js";

async function main() {
  const outputFolder = "build";

  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);
  fs.writeFileSync(`${outputFolder}/goms.json`, JSON.stringify(goms));
  fs.writeFileSync(`${outputFolder}/tags.json`, JSON.stringify(tags));
}

main();
