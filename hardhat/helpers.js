const { existsSync, mkdirSync } = require("fs");
const { readFileSync, writeFileSync } = require("jsonfile");
const { merge, startCase, toLower } = require("lodash");

function mergeJson(filePath, obj) {
  let json = {};
  try {
    json = readFileSync(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      return false;
    }
  }
  json = merge(json || {}, obj);
  const dirPath = require("path").dirname(filePath);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  writeFileSync(filePath, json, {
    spaces: 2,
    EOL: "\r\n"
  });
  return true;
}

function hoursToSeconds(hours) {
  return hours * 60 * 60;
}

function getEthers() {
  return process.env.OVM ? require("hardhat").l2ethers : require("hardhat").ethers;
}

async function advanceHours(hours) {
  const seconds = hoursToSeconds(hours);
  const ethers = getEthers();
  await ethers.provider.send("evm_increaseTime", [seconds]);
  ethers.provider.send("evm_mine"); // mine a block after
}

async function advanceBlocks(blocks) {
  const ethers = getEthers();
  for (let i = 0; i < blocks; i++) {
    ethers.provider.send("evm_mine");
  }
}

function encodeParameters(types, values) {
  const ethers = getEthers();
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

// capitalize by word
function capitalize(text) {
  return startCase(toLower(text));
}

module.exports = {
  mergeJson,
  hoursToSeconds,
  getEthers,
  advanceHours,
  advanceBlocks,
  encodeParameters,
  capitalize
}