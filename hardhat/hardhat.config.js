require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@ethersproject/bignumber");

// Make sure to run `npx hardhat clean` before recompiling and testing
if (process.env.OVM) {
  require("@eth-optimism/plugins/hardhat/compiler");
  require("@eth-optimism/plugins/hardhat/ethers");
}

const convert = require("ether-converter");

// Task to set limited mode on CarbonEmissionsTokenNetwork
task("setLimitedMode", "Set limited mode on a CarbonEmissionsTokenNetwork contract")
  .addParam("value", "True or false to set limited mode")
  .addParam("contract", "The CLM8 contract")
  .setAction(async taskArgs => {
    const [ admin ] = await ethers.getSigners();
    const CarbonEmissionsTokenNetwork = await hre.ethers.getContractFactory("CarbonEmissionsTokenNetwork");
    const contract = await CarbonEmissionsTokenNetwork.attach(taskArgs.contract);
    await contract.connect(admin).setLimitedMode(taskArgs.value == "true" ? true : false);
  });

// Task to set quorum on Governor
task("setQuorum", "Set the quorum value on a Governor contract")
  .addParam("value", "The new quorum value in votes")
  .addParam("contract", "The Governor contract")
  .setAction(async taskArgs => {
    const [ admin ] = await ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = await Governor.attach(taskArgs.contract);
    // since the dCLM8 token has 18 decimals places and the sqrt function cuts this in half, so 9 zeros must be padded on the value in order to get the correct order of magnitude.
    const value = convert(taskArgs.value, "gwei", "wei");
    await contract.connect(admin).setQuorum(value);
  });

task("getQuorum", "Return the quorum value (minimum number of votes for a proposal to pass)")
  .addParam("contract", "The Governor contract")
  .setAction(async taskArgs => {
    const [ admin ] = await ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = await Governor.attach(taskArgs.contract);
    let quorum = await contract.connect(admin).quorumVotes();
    console.log(convert(quorum.toString(), "wei", "gwei"));
  });

// Task to set proposal threshold on Governor
task("setProposalThreshold", "Set the proposal threshold on a Governor contract")
  .addParam("value", "The minimum amount of dCLM8 required to lock with a proposal")
  .addParam("contract", "The Governor contract")
  .setAction(async taskArgs => {
    const [ admin ] = await ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = await Governor.attach(taskArgs.contract);
    const value = convert(taskArgs.value, "ether", "wei");
    await contract.connect(admin).setProposalThreshold(value);
  });

task("getProposalThreshold", "Return the proposal threshold (amount of dCLM8 required to stake with a proposal)")
  .addParam("contract", "The Governor contract")
  .setAction(async taskArgs => {
    const [ admin ] = await ethers.getSigners();
    const Governor = await hre.ethers.getContractFactory("Governor");
    const contract = await Governor.attach(taskArgs.contract);
    const threshold = await contract.connect(admin).proposalThreshold();
    console.log(convert(threshold.toString(), "wei", "ether"));
  });

task("setTestAccountRoles", "Set default account roles for testing")
  .addParam("contract", "The CLM8 contract")
  .setAction(async taskArgs => {
    const { dealer1, dealer2, dealer3, consumer1, consumer2 } = await getNamedAccounts();

    const [ admin ] = await ethers.getSigners();
    const CarbonEmissionsTokenNetwork = await hre.ethers.getContractFactory("CarbonEmissionsTokenNetwork");
    const contract = await CarbonEmissionsTokenNetwork.attach(taskArgs.contract);

    await contract.connect(admin).registerDealer(dealer1, 1);  // REC dealer
    console.log(`Account ${dealer1} is now a REC dealer`);
    await contract.connect(admin).registerDealer(dealer2, 3);  // emissions auditor
    console.log(`Account ${dealer2} is now an emissions auditor`);
    await contract.connect(admin).registerDealer(dealer3, 2);  // offsets dealer
    console.log(`Account ${dealer3} is now an offsets  dealer`);

    await contract.connect(admin).registerConsumer(consumer1);
    console.log(`Account ${consumer1} is now a consumer`);
    await contract.connect(admin).registerConsumer(consumer2);
    console.log(`Account ${consumer2} is now a consumer`);
  });

task("giveDaoTokens", "Give DAO tokens to default account roles for testing")
  .addParam("contract", "The dCLM8 token")
  .setAction(async taskArgs => {
    const { dealer1, dealer2, dealer3, consumer1, consumer2 } = await getNamedAccounts();

    const [ admin ] = await ethers.getSigners();
    const daoToken = await hre.ethers.getContractFactory("DAOToken");
    const contract = await daoToken.attach(taskArgs.contract);

    let tokens = 500000;
    let i = convert(tokens, "ether", "wei");

    await contract.connect(admin).transfer(dealer1, i);
    console.log (`Gave ${tokens} DAO Tokens to ${dealer1}`);
    await contract.connect(admin).transfer(dealer2, i);
    console.log (`Gave ${tokens} DAO Tokens to ${dealer2}`);
    await contract.connect(admin).transfer(dealer3, i);
    console.log (`Gave ${tokens} DAO Tokens to ${dealer3}`);
    await contract.connect(admin).transfer(consumer1, i);
    console.log (`Gave ${tokens} DAO Tokens to ${consumer1}`);
    await contract.connect(admin).transfer(consumer2, i);
    console.log (`Gave ${tokens} DAO Tokens to ${consumer2}`);
  });

// Task to upgrade CarbonEmissionsTokenNetwork contract
task("upgradeClm8Contract", "Upgrade a specified CLM8 contract to a newly deployed contract")
  .setAction(async taskArgs => {
    const { deployer } = await getNamedAccounts();

    const { deploy, get } = deployments;

    // output current implementation address
    current = await get("CarbonEmissionsTokenNetwork");
    console.log("Current CarbonEmissionsTokenNetwork (to be overwritten):", current.implementation);

    // deploy V2
    let CarbonEmissionsTokenNetwork = await deploy("CarbonEmissionsTokenNetwork", {
      from: deployer,
      proxy: {
        owner: deployer,
        proxyContract: "OptimizedTransparentProxy",
      },
      contract: "CarbonEmissionsTokenNetworkV2",
      args: [ deployer ],
    });

    // output new implementation address
    console.log("New CarbonEmissionsTokenNetwork implementation deployed to:", CarbonEmissionsTokenNetwork.implementation);
    console.log(`The same address ${CarbonEmissionsTokenNetwork.address} can be used to interact with the contract.`);
  });

task("completeTimelockAdminSwitch", "Complete a Timelock admin switch for a live DAO contract")
  .addParam("timelock", "")
  .addParam("governor", "")
  .addParam("target", "")
  .addParam("value", "")
  .addParam("signature", "")
  .addParam("data", "")
  .addParam("eta", "")
  .setAction(async taskArgs => {
    const { get } = deployments;

    const Timelock = await hre.ethers.getContractFactory("Timelock");
    const timelock = await Timelock.attach(taskArgs.timelock);
    const Governor = await hre.ethers.getContractFactory("Governor");
    const governor = await Governor.attach(taskArgs.governor);

    await timelock.executeTransaction(
      taskArgs.target,
      taskArgs.value,
      taskArgs.signature,
      taskArgs.data,
      taskArgs.eta
    );
    console.log("Executed setPendingAdmin() on Timelock.");

    await governor.__acceptAdmin();
    console.log("Called __acceptAdmin() on Governor.");

    console.log("Done performing Timelock admin switch.");
  });

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();
  for (const account of accounts) {
    console.log(account);
  }
});

require("dotenv").config();

/**
 * @type import("hardhat/config").HardhatUserConfig
 */
module.exports = {
  namedAccounts: {
    // these are based on the accounts you see when run $ npx hardhat node --show-acounts
    deployer: {
      default: 0, // hardhat 0
      ropsten: "0x7a77660D2A08C204C2fD6122ce48045811c83DF0" // ganache 0
    },
    dealer1: {
      default: 1, // hardhat 1
      ropsten: "0x80992d9ccd9a0F2bdD4DC4E554bc21bDfe20376d" // ganache 1
    },
    dealer2: {
      default: 2, // hardhat 2
      ropsten: "0xd2468C616cF05421B435764492AC52C46233e26C" // ganache 2
    },
    dealer3: {
      default: 3, // hardhat 3
      ropsten: "0xDC5ecb345637b2c09a1Ad793E871AE2a5742B008" // ganache 3
    },
    dealer4: {
      default: 4, // hardhat 4
      ropsten: "0xD519e325C3af96b1362263478D6fCF9F54548621" // ganache 4
    },
    consumer1: {
      default: 19, // hardhat 19
      ropsten: "0x0b4ef805109271c0B707E139E064Eea8aD677181" // ganache 5
    },
    consumer2: {
      default: 18, // hardhat 18
      ropsten: "0xb39a74c24416dB57E31534a89888D9701e03f9Ab" // ganache 6
    },
    unregistered: {
      default: 7, // hardhat 7
      ropsten: "0xb9452578C2fC3684996036cf1F8a4De12cB4cb75" // ganache 7
    }
  },
  solidity: {
    compilers: [{
      version: "0.7.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }]
  },
  gasReporter: {
    currency: "USD"
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    ovm_localhost: {
      url: "http://localhost:9545"
    },
    // Deploy with npx hardhat run --network optimism_kovan scripts/___.js
    optimism_kovan: {
      url: `https://kovan.optimism.io/`,
      accounts: [`0x${process.env.CONTRACT_OWNER_PRIVATE_KEY}`]
    },
    // Deploy with npx hardhat run --network arbitrum_kovan scripts/___.js
    arbitrum_kovan: {
      url: `https://kovan4.arbitrum.io/rpc`,
      accounts: [`0x${process.env.CONTRACT_OWNER_PRIVATE_KEY}`]
    },
    // Deploy with npx hardhat run --network goerli scripts/___.js
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.CONTRACT_OWNER_PRIVATE_KEY}`]
    },
    // Deploy with npx hardhat run --network xdai scripts/___.js
    xdai: {
      url: "https://xdai.poanetwork.dev",
      chainId: 100,
      accounts: [`0x${process.env.CONTRACT_OWNER_PRIVATE_KEY}`]
    },
    // Deploy with npx hardhat run --network kovan scripts/___.js
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.CONTRACT_OWNER_PRIVATE_KEY}`]
    },
    // Deploy with npx hardhat run --network ropsten scripts/___.js
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.CONTRACT_OWNER_PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  ovm: {
    solcVersion: "0.7.6"
  }
};
