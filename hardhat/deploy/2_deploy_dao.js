const { copySync } = require("cpx");

const {
  mergeJson,
  hoursToSeconds,
  getEthers,
  advanceHours,
  advanceBlocks,
  encodeParameters,
  capitalize
} = require("../helpers");

module.exports = async ({
  deployments,
  getNamedAccounts
}) => {
  const { deploy, execute, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const daoToken = await get("DAOToken");

  console.log(`Deploying DAO with account: ${deployer}`);

  const timelock = await deploy("Timelock", {
    from: deployer,
    args: [
      deployer, // initial admin
      172800 // default time delay (2 days)
    ]
  });
  console.log("Timelock deployed to:", timelock.address);

  // register to local package
  // "npx hardhat node" fetches config from "hardhat" network, not "localhost" network
  const networkName = hre.network.name === "localhost" ? "hardhat" : hre.network.name;
  mergeJson("../react-app/src/contracts/addresses.json", {
    [networkName]: {
      network: capitalize(`${networkName} network`),
      dao: {
        timelock: {
          address: timelock.address
        }
      }
    }
  });

  // copy compiled contract to local package
  copySync(`./deployments/${hre.network.name}/Governor.json`, "../src/contracts/abis");

  const governor = await deploy("Governor", {
    from: deployer,
    args: [
      timelock.address, // address of timelock
      daoToken.address, // address of DAO token
      deployer // guardian of governor
    ]
  });
  console.log("Governor deployed to:", governor.address);

  // register to local package
  // "npx hardhat node" fetches config from "hardhat" network, not "localhost" network
  mergeJson("../react-app/src/contracts/addresses.json", {
    [networkName]: {
      network: capitalize(`${networkName} network`),
      dao: {
        governor: {
          address: governor.address
        }
      }
    }
  });

  // copy compiled contract to local package
  copySync(`./deployments/${hre.network.name}/Governor.json`, "../src/contracts/abis");

  let skippedActions = 0;

  // set governor on DAOToken contract (for permission to burn tokens)
  try {
    await execute(
      "DAOToken",
      { from: deployer },
      "setGovernor",
      governor.address
    );
    console.log("Initialized Governor address on DAOToken.")
  } catch (e) {
    console.log("Skipped setGovernor() on DAOToken.");
    skippedActions++;
  }

  // format transactions for Timelock to change admin to Governor
  let timelockNewAdmin;
  try {
    const ethers = getEthers();
    const block = await ethers.provider.getBlock(ethers.provider.getBlockNumber());
    const currentTime = block.timestamp;
    timelockNewAdmin = {
      target: timelock.address,
      value: 0,
      signature: "setPendingAdmin(address)",
      data: encodeParameters(
        ["address"],
        [governor.address]
      ),
      eta: currentTime + hoursToSeconds(50)
    }
    await execute(
      "Timelock",
      { from: deployer },
      "queueTransaction",
      timelockNewAdmin.target,
      timelockNewAdmin.value,
      timelockNewAdmin.signature,
      timelockNewAdmin.data,
      timelockNewAdmin.eta
    );
    console.log("Queued setPendingAdmin() on Timelock.");
  } catch (e) {
    console.log("Skipped changing admin on Governor to Timelock.");
    skippedActions++;
  }

  // perform time/block skip if local network to switch timelock admin automatically
  if (!hre.network.live && skippedActions < 2) {

    await advanceHours(51);
    console.log("Advanced 51 hours.");

    // execute setPendingAdmin on Timelock
    await execute(
      "Timelock",
      { from: deployer },
      "executeTransaction",
      timelockNewAdmin.target,
      timelockNewAdmin.value,
      timelockNewAdmin.signature,
      timelockNewAdmin.data,
      timelockNewAdmin.eta
    );
    console.log("Executed setPendingAdmin() on Timelock.");
    await advanceBlocks(1);

    // accept admin role from Governor contract
    await execute(
      "Governor",
      { from: deployer },
      "__acceptAdmin"
    );
    await advanceBlocks(1);

    console.log("Called __acceptAdmin() on Governor.");

    console.log("Done performing Timelock admin switch.");

  // otherwise, output args to complete the timelock admin switch
  } else {
    if (timelockNewAdmin && skippedActions < 2) {
      const date = new Date(timelockNewAdmin.eta * 1000);
      console.log("---");
      console.log(`Please copy and paste this command after ${date.toString()}`);
      console.log("to complete the Timelock admin switch:");
      console.log("");
      console.log(`npx hardhat completeTimelockAdminSwitch --network ${hre.network.name} --timelock ${timelock.address} --governor ${governor.address} --target ${timelockNewAdmin.target} --value ${timelockNewAdmin.value} --signature "${timelockNewAdmin.signature}" --data ${timelockNewAdmin.data} --eta ${timelockNewAdmin.eta}`);
      console.log("");
      console.log("---");
    }
  }

};

module.exports.tags = ["DAO"];
module.exports.dependencies = ["DAOToken"];
