# Using the Contracts

CarbonEmissionsTokenNetwork.sol (the CLM8 contract) is implemented as a ERC-1155 multi-token smart contract compatible on any EVM-compatible blockchain and produces CLM8 tokens from issuers to consumers. [Hardhat](https://hardhat.org) is the Ethereum development environment used to compile, deploy, test, and debug contracts. The DAO contracts (located in the `contracts/governance/` folder) are forked from Compound and interact with the CLM8 contract to issue tokens using dCLM8 ERC-20 tokens as a voting mechanism to determine influence.

This document describes compiling and deploying the contract with Hardhat.

## Installation and use

After cloning this repository, navigate to the `carbon-emissions-token-network` directory, and run `npm install`

## Testing with Hardhat

[Hardhat](https://hardhat.org/) is an Ethereum development and testing environment which is great for deploying and testing the contracts locally.  Again from the `carbon-emissions-token-network` directory:

- To see all commands, run `npx hardhat`
- To compile, run `npx hardhat compile`
- To test, run `npx hardhat test` (and `npx hardhat test [filename] to run a specific test`)
- To run a local test network without deploying the contracts, run `npx hardhat node --no-deploy --show-accounts`
- To run a local test network that automatically deploys all of the contracts locally, run `npx hardhat node --show-accounts`
- To deploy to a given network (e.g. goerli), run `npx hardhat deploy --network goerli`

After deploying to hardhat locally, and you will see the addresses of the deployed contracts as well as 20 accounts available for testing:

```
$ npx hardhat node --show-accounts
Nothing to compile
Deploying DAO with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Timelock deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
DAO Token deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Governor deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Initialized Governor address on DAOToken.
Queued setPendingAdmin() on Timelock.
Executed setPendingAdmin() on Timelock.
Called __acceptAdmin() on Governor.
Delegated voting power of deployer to self.
Done performing Timelock admin switch.
Deploying CarbonEmissionsTokenNetwork with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
CarbonEmissionsTokenNetwork deployed to: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
Timelock address set so that the DAO has permission to issue tokens with issueFromDAO().
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

You can then run this command to set up roles for some of those accounts:

```
$ npx hardhat setTestAccountRoles --network localhost --contract <NetEmissionsTokeNetwork address>
```

To test the DAO, use this command to give the DAO tokens to your test accounts:

```
$ npx hardhat giveDaoTokens --network localhost --contract <DaoToken address>
```

## Deploying contracts to a public testnet

If you'd like to deploy the contract (e.g. the Goerli testnet) for yourself, you will need a network URL and account to deploy with.

To connect to a common Ethereum testnet like Goerli, set up a developer account on [Infura.io](https://infura.io/) and create a free project under the Ethereum tab. You will need the project ID.

Next, create an account on MetaMask and connect to Goerli under the networks tab. This account will be used to deploy the contract -- so it needs to be loaded with free testnet ETH from a [Goerli faucet](https://faucet.goerli.mudit.blog) by copy and pasting your public key and waiting for the ETH to arrive to your wallet. 

Now follow these steps to deploy the contract to the Goerli testnet and update references to the address:

1. Create `.ethereum-config.js` by copying the template with 

```bash
cp .ethereum-config.js.template .ethereum-config.js
```

2.  Edit `.ethereum-config.js` and set the private key for your Ethereum deployment address and Infura key.

3. Edit the file `hardhat.config.js` and uncomment these lines (or uncomment the network you want to deploy to):

```bash
     // const ethereumConfig = require("./.ethereum-config");
     ...
     // goerli: {
     //   url: `https://goerli.infura.io/v3/${goerliConfig.INFURA_PROJECT_ID}`,
     //   accounts: [`0x${goerliConfig.GOERLI_CONTRACT_OWNER_PRIVATE_KEY}`]
     // },
```

4. Deploy by via the deploy script (or replacing goerli with the network you want to deploy to):

```bash
npx hardhat deploy --network goerli
```

5. Make sure to copy and paste the timelock admin switch command to complete in two days (for example, here is a snippet of the deployment output):

```
Please copy and paste this command after Wed Apr 28 2021 11:27:38 GMT-0400 (Eastern Daylight Time) to complete the Timelock admin switch:

npx hardhat completeTimelockAdminSwitch --network goerli --timelock 0xE13Ec0c623e67486267B54dd28E172A94f72B527 --governor 0x7c385742B2332b65D536396bdcb10EE7Db821eA9 --target 0xE13Ec0c623e67486267B54dd28E172A94f72B527 --value 0 --signature "setPendingAdmin(address)" --data 0x0000000000000000000000007c385742b2332b65d536396bdcb10ee7db821ea9 --eta 1619623658
```

The addresses of the contracts (prefixed with 0x) will be returned once the contracts are finished deploying.

## Deploying to xDai

xDai is an EVM-compatible sidechain with low gas fees where the native token (used to pay gas for transactions) is pegged to the dollar. To deploy or interact with contracts on xDai, your wallet needs to hold some xDai; fortunately you can use a free [faucet](https://blockscout.com/xdai/mainnet/faucet) to get a cent of xDai by entering your wallet address and solving a CAPTCHA.

Connect to xDai via MetaMask by [importing the network through their instructions](https://www.xdaichain.com/for-users/wallets/metamask/metamask-setup) to see your balances.

Be sure your `.ethereum-config.js` has the private key of your deployer address, uncomment out the "xdai" network in `hardhat.config.js` (similar to the steps above) and deploy with:

```bash
npx hardhat deploy --network xdai
```

Be sure to copy the command to complete the Timelock admin switch in two days from the time of deployment (example in the section above).

If any part of the deployment fails, you can run the command again and the deployment script will reuse the addresses previously automatically written to the `deployments` folder.

## Using Optimism

### Compiling to Optimism Virtual Machine (OVM)

By default, Hardhat compiles to the EVM using the given Solidity version in `hardhat.config.js`. To instead compile to the [OVM](https://optimism.io/): 

1. Set the `OVM` environment variable:

```bash
export OVM=1
```

2. If build artifacts exist, run `npx hardhat clean`

2. Compile with `npx hardhat compile`

### Testing and Deploying on OVM

Some incompatibilities exist between Hardhat and Optimism, so the current recommended way to test is to use [Optimism Integration](https://github.com/ethereum-optimism/optimism-integration) to run a local Optimistic Ethereum environment.  Follow the directions under "Usage" in their [README](https://github.com/ethereum-optimism/optimism-integration#usage) and use `make up` to start their docker image.  (You can skip the tests step.) 

To deploy contracts to a local Optimism development node after following starting your local Optimism Ethereum environment, run:

```bash
$ npx hardhat deploy --network ovm_localhost
```

Use the test addresses for testing on the interface and elsewhere:
```
Account #0: 0x023ffdc1530468eb8c8eebc3e38380b5bc19cc5d (10000 ETH) - deployer/owner address
Private Key: 0x754fde3f5e60ef2c7649061e06957c29017fe21032a8017132c0078e37f6193a
Account #1: 0x0e0e05cf14349469ee3b45dc2fce50e11b9449b8 (10000 ETH)
Private Key: 0xd2ab07f7c10ac88d5f86f1b4c1035d5195e81f27dbe62ad65e59cbf88205629b
Account #2: 0x432c38a44381668eda4a3152209abbfae065b44d (10000 ETH)
Private Key: 0x23d9aeeaa08ab710a57972eb56fc711d9ab13afdecc92c89586e0150bfa380a6
Account #3: 0x5eeabfdd0f31cebf32f8abf22da451fe46eac131 (10000 ETH)
Private Key: 0x5b1c2653250e5c580dcb4e51c2944455e144c57ebd6a0645bd359d2e69ca0f0c
Account #4: 0x640e7cc27b750144ed08ba09515f3416a988b6a3 (10000 ETH)
Private Key: 0xea8b000efb33c49d819e8d6452f681eed55cdf7de47d655887fc0e318906f2e7
```

Currently, `evm_mine` and `evm_increaseTime` are not supported on the node.

Don't forget to set the addresses in `carbon-emissions-token-network/interface/packages/contracts/src/addresses.js` to connect to them via the React interface and add the network to MetaMask. The default contract addresses on the local node after running the script `deploy-all.js` are all commented out in that file to switch from Hardhat Network -- see `using-the-react-application.md` for more information on using the React application.

## Toggling limited mode

The limited mode is useful in production environments.  Once it is enabled:

- Only the admin can register roles
- Only the DAO's Timelock contract can issue carbon offsets and REC tokens.  
- Offset and REC tokens can only be issued to the admin.  
- Emissions audits tokens can be issued as usual by emissions auditors.
- Only the admin can transfer tokens
- Once transferred from the admin to a recipient, they are immediately retired in the recipient's account.

To turn on limited mode on a given network, run the task:

```bash
npx hardhat setLimitedMode --network localhost --contract <CarbonEmissionsTokenNetwork deployed address> --value true
```

You can turn it off with:

```bash
npx hardhat setLimitedMode --network localhost --contract <CarbonEmissionsTokenNetwork deployed address> --value false
```

## Setting/getting quorum value

By default, the quorum (minimum number of votes in order for a proposal to succeed) is 632 votes or about sqrt(4% of total supply). The guardian can set this value by running the task:

```bash
npx hardhat setQuorum --network localhost --contract <Governor deployed address> --value <votes>
```

To get the current quorum, run the similar task:

```bash
npx hardhat getQuorum --network localhost --contract <Governor deployed address> 
```

## Setting/getting proposal threshold

In the original Compound DAO design, the proposal threshold is the minimum amount of DAO tokens required to make a proposal. In our system, this amount of dCLM8 is locked with a proposal by being sent to the Governor contract for safekeeping until the proposal has passed or failed. If the proposal did not pass quorum, the proposer can refund for 3/4 of their staked tokens. The guardian can also set adjust this value if needed:

```bash
npx hardhat setProposalThreshold --network localhost --contract <Governor deployed address> --value 1000000000000000000000
```

This value represents a dCLM8 amount with no sqrt calculation, so 18 zeros must be padded to the end of the number. By default, it is set to 100,000 or 1% of the dCLM8 supply.

Similarily, you can easily see the value by running the similar task:

```bash
npx hardhat getProposalThreshold --network localhost --contract <Governor deployed address>
```

## Upgrading CLM8 contract implementation

A Hardhat task `upgradeClm8Contract` is provided to upgrade the contract with new features while keeping the same address, as CarbonEmissionsTokenNetwork utilizes [OpenZeppelin upgrades](https://docs.openzeppelin.com/upgrades-plugins/1.x/api-hardhat-upgrades) to create separate contracts for the implementation and the contract you call (like an API and its implementation.)  When the upgrade script is run, a new implementation contract is deployed that the current address will use. A test implementation of a new version of the contract is located in `contracts/CarbonEmissionsTokenNetworkV2.sol`. Upgrading is also tested in the unit tests.

To test upgrading contracts locally:

1. Deploy the first set of contracts (including `CarbonEmissionsTokenNetwork.sol`) with `npx hardhat node`.

2. Create some tokens on the contract by connecting through the React interface.

3. Run the command (after ensuring the `deployments/localhost` directory has your current implementation) to upgrade to `CarbonEmissionsTokenNetworkV2.sol`:

```bash
npx hardhat upgradeClm8Contract --network localhost
```

If successful, the script will return both the old implementation contract address and the new one, and the contract address to be called, which remains the same.  The state of the current variables will remain the same. The old implementation will automatically be made unusable, so there is no need to self-destruct it.

Upgrading contracts on a testnet is similar -- just make sure that the network and Ethereum config is in `hardhat.config.js` and that it isn't commented out. If upgrading on an network via an Infura URL (like Goerli), you'll need an Infura key too. See more information on using the config files at the top of this document.

## Upgrading Governor.sol and Timelock.sol without upgrading DAOToken.sol

In the case that new changes are made to the DAO (Governor.sol and/or its Timelock.sol) and we want to deploy a new version of it to a production environment but we also want to keep the same DAOToken.sol contract, we can utilize the hardhat-deploy plugin's tags/dependencies features to easily deploy some contracts individually while reusing others. To upgrade just the DAO:

1. Make sure the current addresses of the contracts you'd like to upgrade are in `deployments/<network>/` after running `npx hardhat deploy --network <network>`

2. Navigate to `deployments/<network>/` and rename or delete the current references to the Governor and Timelock, which are `Governor.json` and `Timelock.json`

3. Navigate back to `carbon-emissions-token-network/` and run `npx hardhat deploy --network <network>`

Now instead of running the full deployment for every contract, the deployment script will reuse the current DAOToken and CarbonEmissionsTokenNetwork addresses on the network you're using and point it to the new DAO contracts.

## Analyzing with Slither

[Slither](https://github.com/crytic/slither) is a powerful Solidity static analysis framework written in Python.  To install and run the Slither static analysis on the Solidity contracts, first ensure Python 3.6+ and Pip 3 are installed.  Then from `carbon-emissions-token-network/` sub-directory, run the script with:

```bash
sh runSlither.sh
```

The results of the analysis will be outputted as JSON files to `SlitherResults/`. Those files can be viewed with [Slither printer](https://github.com/crytic/slither/wiki/Printer-documentation).
