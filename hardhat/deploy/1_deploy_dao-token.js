const { copySync } = require("cpx");
const { mergeJson, capitalize } = require("../helpers");

module.exports = async ({
  deployments,
  getNamedAccounts
}) => {
  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying DAOToken with account: ${deployer}`);

  let daoToken = await deploy("DAOToken", {
    from: deployer,
    args: [
      deployer // inital token holder
    ]
  });
  console.log("DAO Token deployed to:", daoToken.address);

  // register to local package
  // "npx hardhat node" fetches config from "hardhat" network, not "localhost" network
  const networkName = hre.network.name === "localhost" ? "hardhat" : hre.network.name;
  mergeJson("../react-app/src/contracts/addresses.json", {
    [networkName]: {
      network: capitalize(`${networkName} network`),
      dao: {
        daoToken: {
          address: daoToken.address
        }
      }
    }
  });

  // copy compiled contract to local package
  copySync(`./deployments/${hre.network.name}/DAOToken.json`, "../src/contracts/abis");

  if (!hre.network.live) {
    // delegate owner voting power to self
    await execute(
      "DAOToken",
      { from: deployer },
      "delegate",
      deployer
    );
    console.log("Delegated voting power of deployer to self.")
  }

};

module.exports.tags = ["DAOToken"];
