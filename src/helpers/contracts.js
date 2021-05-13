import { AbiCoder } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import convert from 'ether-converter';

import addresses from '../contracts/addresses.json';
import DAOToken from '../contracts/abis/DAOToken.json';
import Governor from '../contracts/abis/Governor.json';
import CarbonEmissionsTokenNetwork from '../contracts/abis/CarbonEmissionsTokenNetwork.json';

const SUCCESS_MSG = 'Success! Transaction has been submitted to the network. Please wait for confirmation on the blockchain.';
const EXTRACT_ERROR_MESSAGE = /(?<="message":")(.*?)(?=")/g;

const PROPOSAL_STATES = [
  'Pending',
  'Active',
  'Canceled',
  'Quorum Failed',
  'Defeated',
  'Succeeded',
  'Queued',
  'Expired',
  'Executed'
];

export const TOKEN_TYPES = [
  'Renewable Energy Certificate',
  'Carbon Emissions Offset',
  'Audited Emissions'
]

/*
 *  helper functions
 */

function catchError(error) {
  console.error(error.message);

  // try to extract error message, otherwise return raw error
  let formatted_error;

  if (error.message.startsWith('invalid ENS name')) {
    formatted_error = 'Missing or invalid parameter.';
  } else if (error.message.startsWith('invalid BigNumber string')) {
    formatted_error = 'Invalid number parameter.';
  } else {
    try {
      let errors = JSON.stringify(error).match(EXTRACT_ERROR_MESSAGE);
      formatted_error = errors[errors.length - 1];
    } catch (e) {
      formatted_error = error.message;
    }
  }

  return formatted_error;
}

// Helper function to prevent ambiguous failure message when dates aren't passed
function convertToZeroIfBlank(num) {
  return parseInt(num) || 0;
}

function toUnixTime(date) {
  // Return date if not a Date object
  if (Object.prototype.toString.call(date) !== '[object Date]') {
    return date;
  }
  return parseInt((date.getTime() / 1000).toFixed(0));
}

export async function getBlockNumber(w3provider) {
  return w3provider.getBlockNumber();
}

export function encodeParameters(types, values) {
  const abi = new AbiCoder();
  return abi.encode(types, values);
}

export function decodeParameters(types, values) {
  const abi = new AbiCoder();
  return abi.decode(types, values);
}

export function formatDate(timestamp) {
  if (timestamp === 0) {
    return 'None';
  } else {
    return new Date(timestamp * 1000).toLocaleString();
  }
}

/*
 *  CarbonEmissionsTokenNetwork contract functions
 */

function getTokenNetworkContract(w3provider) {
  return new Contract(addresses[process.env.REACT_APP_NETWORK_NAME].tokenNetwork.address, CarbonEmissionsTokenNetwork.abi, w3provider);
}

export async function getRoles(w3provider, address) {
  const contract = getTokenNetworkContract(w3provider);
  try {
    return await contract.getRoles(address);
  } catch (e) {
    return e.message;
  }
}

export async function getIssuer(w3provider, tokenId) {
  const contract = getTokenNetworkContract(w3provider);
  try {
    return await contract.getIssuer(tokenId);
  } catch (e) {
    return e.message;
  }
}

export async function getTokenDetails(w3provider, tokenId) {
  const contract = getTokenNetworkContract(w3provider);
  try {
    return await contract.getTokenDetails(tokenId);
  } catch (e) {
    return e.message;
  }
}

export async function getNumOfUniqueTokens(w3provider) {
  const contract = getTokenNetworkContract(w3provider);
  try {
    return await contract.getNumOfUniqueTokens();
  } catch (e) {
    return e.message;
  }
}

export async function getAvailableAndRetired(w3provider, address, tokenId) {
  const contract = getTokenNetworkContract(w3provider);
  try {
    return await contract.getAvailableAndRetired(address, tokenId);
  } catch (e) {
    return e.message;
  }
}

export async function getTokenType(w3provider, tokenId) {
  const contract = getTokenNetworkContract(w3provider);
  try {
    return await contract.getTokenType(tokenId);
  } catch (e) {
    return e.message;
  }
}

export async function getLimitedMode(w3provider) {
  const contract = getTokenNetworkContract(w3provider);
  try {
    return await contract.limitedMode();
  } catch (e) {
    return e.message;
  }
}

export async function getAdmin(w3provider) {
  const contract = getTokenNetworkContract(w3provider);
  try {
    return await contract.admin();
  } catch (e) {
    return e.message;
  }
}

export async function issue(
  w3provider,
  address,
  tokenTypeId,
  quantity,
  fromDate,
  thruDate,
  automaticRetireDate,
  metadata,
  manifest,
  description
) {
  const signer = w3provider.getSigner();
  const contract = getTokenNetworkContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    await signed.issue(
      address,
      tokenTypeId,
      quantity,
      convertToZeroIfBlank(toUnixTime(fromDate)),
      convertToZeroIfBlank(toUnixTime(thruDate)),
      convertToZeroIfBlank(toUnixTime(automaticRetireDate)),
      metadata,
      manifest,
      description
    );
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function retire(w3provider, tokenId, amount) {
  const signer = w3provider.getSigner();
  const contract = getTokenNetworkContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    await signed.retire(tokenId, amount);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function transfer(w3provider, address, tokenId, amount) {
  const signer = w3provider.getSigner();
  const contract = getTokenNetworkContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    await signed.transfer(address, tokenId, amount);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function registerConsumer(w3provider, address) {
  const signer = w3provider.getSigner();
  const contract = getTokenNetworkContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    await signed.registerConsumer(address);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function unregisterConsumer(w3provider, address) {
  const signer = w3provider.getSigner();
  const contract = getTokenNetworkContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    await signed.unregisterConsumer(address);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function registerDealer(w3provider, address, tokenTypeId) {
  const signer = w3provider.getSigner();
  const contract = getTokenNetworkContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    await signed.registerDealer(address, tokenTypeId);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function unregisterDealer(w3provider, address, tokenTypeId) {
  const signer = w3provider.getSigner();
  const contract = getTokenNetworkContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    await signed.unregisterDealer(address, tokenTypeId);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

/*
 *  DAO token contract functions
 */

function getDAOTokenContract(w3provider) {
  return new Contract(addresses[process.env.REACT_APP_NETWORK_NAME].dao.daoToken.address, DAOToken.abi, w3provider);
}

export async function daoTokenBalanceOf(w3provider, account) {
  const contract = getDAOTokenContract(w3provider);
  try {
    const fetchedBalance = await contract.balanceOf(account);
    return convert(fetchedBalance, 'wei', 'ether').toNumber();
  } catch (e) {
    return e.message;
  }
}

export async function delegate(w3provider, delegatee) {
  const signer = w3provider.getSigner();
  const contract = getDAOTokenContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    const delegateCall = await signed.delegate(delegatee);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function delegates(w3provider, address) {
  const contract = getDAOTokenContract(w3provider);
  try {
    return await contract.delegates(address);
  } catch (e) {
    return e.message;
  }
}

/*
 *  Governor contract functions
 */

function getGovernorContract(w3provider) {
  return new Contract(addresses[process.env.REACT_APP_NETWORK_NAME].dao.governor.address, Governor.abi, w3provider);
}

export async function getProposalCount(w3provider) {
  const contract = getGovernorContract(w3provider);
  try {
    return await contract.proposalCount();
  } catch (e) {
    return e.message;
  }
}

export async function getProposalDetails(w3provider, proposalId) {
  const contract = getGovernorContract(w3provider);
  try {
    return await contract.proposals(proposalId);
  } catch (e) {
    return e.message;
  }
}

export async function getProposalState(w3provider, proposalId) {
  const contract = getGovernorContract(w3provider);
  try {
    const state = await contract.state(proposalId);
    return PROPOSAL_STATES[state];
  } catch (e) {
    return e.message;
  }
}

export async function propose(w3provider, targets, values, signatures, calldatas, description) {
  const signer = w3provider.getSigner();
  const contract = getGovernorContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    const proposalCall = await signed.propose(targets, values, signatures, calldatas, description);
    return SUCCESS_MSG;
  } catch (e) {
    const err = catchError(e);
    console.log(err);
    return err + ' Is your delegatee set?';
  }
}

export async function getReceipt(w3provider, proposalId, voter) {
  const contract = getGovernorContract(w3provider);
  try {
    return await contract.getReceipt(proposalId, voter);
  } catch (e) {
    return catchError(e);
  }
}

export async function getActions(w3provider, proposalId) {
  const contract = getGovernorContract(w3provider);
  try {
    return await contract.getActions(proposalId);
  } catch (e) {
    return catchError(e);
  }
}

export async function getDescription(w3provider, proposalId) {
  const contract = getGovernorContract(w3provider);
  try {
    return await contract.getDescription(proposalId);
  } catch (e) {
    return catchError(e);
  }
}

export async function castVote(w3provider, proposalId, support, votes) {
  const signer = w3provider.getSigner();
  const contract = getGovernorContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    const castVoteCall = await signed.castVote(proposalId, support, votes);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function queue(w3provider, proposalId) {
  const signer = w3provider.getSigner();
  const contract = getGovernorContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    const queueCall = await signed.queue(proposalId);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function execute(w3provider, proposalId) {
  const signer = w3provider.getSigner();
  const contract = getGovernorContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    const executeCall = await signed.execute(proposalId);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function cancel(w3provider, proposalId) {
  const signer = w3provider.getSigner();
  const contract = getGovernorContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    const cancelCall = await signed.cancel(proposalId);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function refund(w3provider, proposalId) {
  const signer = w3provider.getSigner();
  const contract = getGovernorContract(w3provider);
  const signed = await contract.connect(signer);
  try {
    const refundCall = await signed.refund(proposalId);
    return SUCCESS_MSG;
  } catch (e) {
    return catchError(e);
  }
}

export async function getQuorum(w3provider) {
  const contract = getGovernorContract(w3provider);
  try {
    return await contract.quorumVotes();
  } catch (e) {
    return catchError(e);
  }
}

export async function getProposalThreshold(w3provider) {
  const contract = getGovernorContract(w3provider);
  try {
    return await contract.proposalThreshold();
  } catch (error) {
    return catchError(error);
  }
}
