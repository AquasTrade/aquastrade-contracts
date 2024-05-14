// print the compiler version used in all deployments
//
//  $ npx hardhat run --network europa scripts/compilerversions.ts

import fs from "fs";
import path from "path";
import { network } from "hardhat";

const getCompilerVersion = (jsonObject: any) => {
  try {
    return JSON.parse(jsonObject.metadata).compiler.version;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return "unknown";
    } else {
      throw error;
    }
  }
};

const readJsonFiles = (directory: string, ignore: string[]) => {
  const files = fs.readdirSync(directory);
  let jsonFiles = files.filter(file => file.endsWith(".json"));
  ignore.forEach(suffix => {
    jsonFiles = jsonFiles.filter(file => !file.endsWith(suffix));
  });
  return jsonFiles.map(file => {
    const fileContent = fs.readFileSync(`${directory}/${file}`, "utf-8");
    return { file, version: getCompilerVersion(JSON.parse(fileContent)) };
  });
};

const main = () => {
  const directory = path.join(__dirname, "..", "deployments", `${network.name}`);
  const jsonObjects = readJsonFiles(directory, ["_Proxy.json", "_Implementation.json"]);
  jsonObjects.forEach(jsonObject => {
    console.log(`${jsonObject.file}: ${jsonObject.version}`);
  });
};

main();
