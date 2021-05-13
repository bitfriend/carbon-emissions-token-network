const { copySync } = require("cpx");
const { mergeJson, capitalize } = require("../helpers");

module.exports = async ({
  deployments,
  getNamedAccounts
}) => {
  const { execute, deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying CarbonEmissionsTokenNetwork with account: ${deployer}`);

  const tokenNetwork = await deploy("CarbonEmissionsTokenNetwork", {
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: "OptimizedTransparentProxy",
      methodName: "initialize"
    },
    args: [ deployer ]
  });

  console.log("CarbonEmissionsTokenNetwork deployed to:", tokenNetwork.address);

  // register to local package
  // "npx hardhat node" fetches config from "hardhat" network, not "localhost" network
  const networkName = hre.network.name === "localhost" ? "hardhat" : hre.network.name;
  mergeJson("../react-app/src/contracts/addresses.json", {
    [networkName]: {
      network: capitalize(`${networkName} network`),
      tokenNetwork: {
        address: tokenNetwork.address
      }
    }
  });

  // copy compiled contract to local package
  copySync(`./deployments/${hre.network.name}/CarbonEmissionsTokenNetwork.json`, "../src/contracts/abis");

  const timelock = await deployments.get("Timelock");

  await execute(
    "CarbonEmissionsTokenNetwork",
    { from: deployer },
    "setTimelock",
    timelock.address
  );
  console.log("Timelock address set so that the DAO has permission to issue tokens with issueOnBehalf().");

};

module.exports.tags = ["CLM8"];
module.exports.dependencies = ["DAO"];
