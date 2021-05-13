import React, { Fragment, PureComponent } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  FormControl,
  InputGroup,
  Row,
  Spinner
} from 'react-bootstrap';
import { isEmpty, isEqual } from 'lodash/fp';
import { JsonRpcProvider } from '@ethersproject/providers';
import convert from 'ether-converter';
import BigNumber from 'bignumber.js';
import { connect } from 'react-redux';

import {
  castVote,
  daoTokenBalanceOf,
  delegates,
  getActions,
  getBlockNumber,
  getDescription,
  getProposalCount,
  getProposalDetails,
  getProposalState,
  getProposalThreshold,
  getQuorum,
  getReceipt,
  refund
} from '../helpers/contracts';

import QueueExecuteProposalModal from '../components/QueueExecuteProposalModal';
import DelegateDAOTokensModal from '../components/DelegateDAOTokensModal';
import ProposalCallDetailsModal from '../components/ProposalCallDetailsModal';

const supply = 10000000; // 10 million total DAO tokens

const fmt = {
  groupSeparator: ',',
  groupSize: 3
};

class GovernanceDashboard extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      queueExecuteModalShow: false,
      delegateModalShow: false,
      callDetailsModalShow: false,
      daoTokenBalance: -1,
      daoTokenDelegates: null,
      fetchingDaoTokenBalance: false,
      proposals: [],
      proposalsLength: -1,
      fetchingProposals: false,
      blockNumber: -1,
      fetchingBlockNumber: false,
      isFetchingBlocks: false,
      result: '',
      skipBlocksAmount: '',
      proposalActionType: '',
      proposalActionId: 1,
      votesAmount: 0,
      selectedProposalIdDetails: 1,
      hasRole: false,
      quorum: -1,
      fetchingQuorum: false,
      proposalThreshold: -1,
      fetchingProposalThreshold: false
    };
    this.percentOfSupply = ((this.state.daoTokenBalance / supply) * 100).toFixed(2);
  }

  componentDidMount() {
    if (!isEmpty(this.props.roles)) {
      this.setState({
        hasRole: this.props.roles.some(e => e === true)
      });
    }
    if (this.props.web3Provider && !!this.props.signedInAddress) {
      this.fetchDaoTokenBalance();
      this.fetchProposals();
    }
    if (this.props.web3Provider) {
      this.fetchBlockNumber();
      this.fetchQuorum();
      this.fetchProposalThreshold();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (isEmpty(prevProps.roles) && !isEmpty(this.props.roles)) {
      if (!this.state.hasRole) {
        this.setState({
          hasRole: this.props.roles.some(e => e === true)
        });
      }
    } else if (!isEmpty(prevProps.roles) && isEmpty(this.props.roles)) {
      this.setState({
        hasRole: false
      });
    }
    if ((!prevProps.web3Provider && this.props.web3Provider) && (!prevProps.signedInAddress && !!this.props.signedInAddress)) {
      if (this.state.daoTokenBalance === -1 && !this.state.fetchingDaoTokenBalance) {
        this.fetchDaoTokenBalance();
      }
      if (this.state.proposalsLength === -1 && !this.state.fetchingProposals) {
        this.fetchProposals();
      }
    } else if ((prevProps.web3Provider && !this.props.web3Provider) && (!!prevProps.signedInAddress && !this.props.signedInAddress)) {
      this.setState({
        daoTokenBalance: -1,
        proposalsLength: -1
      });
    }
    if (!prevProps.web3Provider && this.props.web3Provider) {
      if (this.state.blockNumber === -1 && !this.state.fetchingBlockNumber) {
        this.fetchBlockNumber();
      }
      if (this.state.quorum === -1 && !this.state.fetchingQuorum) {
        this.fetchQuorum();
      }
      if (this.state.proposalThreshold === -1 && !this.state.fetchingProposalThreshold) {
        this.fetchProposalThreshold();
      }
    } else if (prevProps.web3Provider && !this.props.web3Provider) {
      this.setState({
        blockNumber: -1,
        quorum: -1,
        proposalThreshold: -1
      });
    }
  }

  onSkipBlocksAmountChange = (event) => this.setState({
    skipBlocksAmount: event.target.value
  })

  onVotesAmountChange = (event) => this.setState({
    votesAmount: event.target.value
  })

  async handleSkipBlocks(blocks) {
    const localProvider = new JsonRpcProvider();
    let cnt;
    try {
      cnt = parseInt(blocks, 10);
    } catch (e) {
      console.error('Must enter a valid integer of blocks to skip on local EVM network.');
      return;
    }
    this.setState({ isFetchingBlocks: true });
    let { blockNumber } = this.state;
    for (let i = 0; i < cnt; i++) {
      await localProvider.send('evm_mine');
      blockNumber++;
      this.setState({ blockNumber });
    }
    this.setState({
      isFetchingBlocks: false,
      result: `Skipped ${blocks} blocks. Please refresh in a few seconds to see the updated current block!`
    });
  }

  async handleSkipTimestamp(days) {
    const localProvider = new JsonRpcProvider();
    const seconds = (days * 24 * 60 * 60); // 1 day
    await localProvider.send('evm_increaseTime', [seconds]);
    await localProvider.send('evm_mine');
    this.setState({
      result: `Added ${days} days to block timestamp. No need to refresh!`
    });
  }

  async fetchDaoTokenBalance() {
    this.setState({ fetchingDaoTokenBalance: true });
    const daoTokenBalance = await daoTokenBalanceOf(this.props.web3Provider, this.props.signedInAddress);
    const delegatesCall = await delegates(this.props.web3Provider, this.props.signedInAddress);
    const daoTokenDelegates = delegatesCall.toLowerCase() !== this.props.signedInAddress.toLowerCase() ? delegatesCall : 'You'; // just display first address for now, @TODO display multisig delegatees
    this.setState({
      daoTokenBalance,
      daoTokenDelegates,
      fetchingDaoTokenBalance: false
    });
  }

  async fetchBlockNumber() {
    this.setState({ fetchingBlockNumber: false });
    const blockNumber = await getBlockNumber(this.props.web3Provider);
    this.setState({
      blockNumber,
      fetchingBlockNumber: false
    });
  }

  async fetchQuorum() {
    this.setState({ fetchingQuorum: true });
    const q = await getQuorum(this.props.web3Provider);
    const quorum = convert(q.toString(), 'wei', 'gwei');
    const v = new BigNumber(quorum).toFormat(fmt);
    this.setState({
      quorum: new BigNumber(quorum).toFormat(fmt),
      fetchingQuorum: false
    });
  }

  async fetchProposalThreshold() {
    this.setState({ fetchingProposalThreshold: true });
    const t = await getProposalThreshold(this.props.web3Provider);
    const threshold = convert(t.toString(), 'wei', 'ether');
    this.setState({
      proposalThreshold: new BigNumber(threshold).toFormat(fmt),
      fetchingProposalThreshold: false
    });
  }

  async fetchProposals() {
    const numberOfProposals = await getProposalCount(this.props.web3Provider);
    const p = [];

    for (let i = numberOfProposals; i > 0; i--) {
      let i_toNumberFix;
      try {
        i_toNumberFix = i.toNumber();
      } catch (e) {
        i_toNumberFix = i;
      }

      const proposalDetails = await getProposalDetails(this.props.web3Provider, i);
      const proposalState = await getProposalState(this.props.web3Provider, i);
      const proposalDescription = await getDescription(this.props.web3Provider, i);
      const proposalActions = await getActions(this.props.web3Provider, i);

      const decimals = new BigNumber('1000000000');
      const decimalsRaw = '1000000000000000000';
      const forVotes = proposalDetails[5].div(decimals).toNumber();
      const againstVotes = proposalDetails[6].div(decimals).toNumber();
      const rawForVotes = proposalDetails[7].div(decimalsRaw).toNumber();
      const rawAgainstVotes = proposalDetails[8].div(decimalsRaw).toNumber();

      // get votes for signed in user
      const proposalReceipt = await getReceipt(this.props.web3Provider, i, this.props.signedInAddress);
      let refundProposal = new BigNumber('0').toNumber();

      if (proposalState === 'Active' || proposalState === 'Quorum Failed') {
        refundProposal = proposalReceipt[3].div(decimalsRaw).toNumber();
      }

      if (this.props.signedInAddress.toLowerCase() === proposalDetails[1].toLowerCase()) {
        const proposalThreshold = (await getProposalThreshold(this.props.web3Provider)).div(decimalsRaw).toNumber();
        const currentVotes = proposalReceipt[3].div(decimalsRaw).toNumber()
        if (proposalState === 'Succeeded') {
          refundProposal = new BigNumber(currentVotes + proposalThreshold).mul(3).div(2).toNumber();
        } else if (proposalState === 'Canceled' || proposalState === 'Quorum Failed') {
          refundProposal = new BigNumber(currentVotes + proposalThreshold).mul(3).div(4).toNumber();
        }
      }

      const proposalIsEligibleToVote = (proposalState === 'Active' && this.state.daoTokenBalance > 0);

      p.push({
        id: i_toNumberFix,
        details: {
          proposer: proposalDetails[1],
          forVotes: forVotes,
          againstVotes: againstVotes,
          rawForVotes: rawForVotes,
          rawAgainstVotes: rawAgainstVotes,
          startBlock: proposalDetails[3].toNumber() + 1,
          endBlock: proposalDetails[4].toNumber()
        },
        state: proposalState,
        actions: proposalActions,
        receipt: {
          hasVoted: proposalReceipt[0],
          hasVotesRefunded: proposalReceipt[4],
          hasStakeRefunded: proposalReceipt[5],
          support: proposalReceipt[1],
          votes: proposalReceipt[2].div(decimals).toString(),
          rawVotes: proposalReceipt[3].div(decimalsRaw),
          rawRefund: refundProposal
        },
        description: proposalDescription,
        isEligibleToVote: proposalIsEligibleToVote
      });
    }

    console.log(p);

    this.setState({
      proposals: p,
      proposalsLength: p.length || 0,
      fetchingProposals: false
    });
  }

  async vote(proposalId, support) {
    const convertedVotes = convert(this.state.votesAmount, 'ether', 'wei');
    const vote = await castVote(this.props.web3Provider, proposalId, support, convertedVotes);
    this.setState({ result: vote });
  }

  async refundDclm8(proposalId) {
    const r = await refund(this.props.web3Provider, proposalId);
    this.setState({ result: r });
  }

  handleProposalAction(action, id) {
    this.setState({
      proposalActionType: action,
      proposalActionId: id,
      queueExecuteModalShow: true
    });
  }

  render() {
    return (
      <Fragment>
        <QueueExecuteProposalModal
          show={this.state.queueExecuteModalShow}
          onHide={() => this.setState({ queueExecuteModalShow: false })}
          provider={this.props.web3Provider}
          type={this.state.proposalActionType}
          id={this.state.proposalActionId}
        />
        <DelegateDAOTokensModal
          show={this.state.delegateModalShow}
          title="Delegate your DAO tokens vote"
          balance={new BigNumber(this.state.daoTokenBalance).toFormat(fmt)}
          onHide={() => this.setState({ delegateModalShow: false })}
          provider={this.props.web3Provider}
        />
        {this.state.proposals.length > 0 && (
          <ProposalCallDetailsModal
            show={this.state.callDetailsModalShow}
            title={`Proposal #${this.state.selectedProposalIdDetails} call details`}
            onHide={() => this.setState({ callDetailsModalShow: false })}
            actions={this.state.proposals[this.state.selectedProposalIdDetails - 1].actions}
          />
        )}
        {this.state.isFetchingBlocks && (
          <Alert
            variant="secondary"
            className="text-center"
          >Mining block {this.state.blockNumber + 1}...</Alert>
        )}
        {!!this.state.result && (
          <Alert
            variant="primary"
            dismissible
            onClose={() => this.setState({ result: '' })}
          >{this.state.result}</Alert>
        )}

        <h2>Governance</h2>
        <p>View, vote on, or modify proposals to issue CLM8 tokens for DAO token (dCLM8) holders. Your votes count as the square root of dCLM8 you vote on a proposal with, and the full amount you voted with is burned after you cast a vote.</p>
        {this.state.networkNameLowercase === 'xdai' && (
          <p>
            <a href={this.state.blockscoutPage}>See contract on Blockscout</a>
          </p>
        )}

        <div className="d-flex justify-content-start align-items-center">
          <div className="pr-2">
            <Button
              block
              size="sm"
              onClick={() => this.setState({ delegateModalShow: true })}
              disabled={this.state.daoTokenBalance <= 0}
              className="text-nowrap mr-2"
              variant="primary"
            >
              Delegate DAO tokens
            </Button>
            <small className="text-muted">Current delegatee: {this.state.daoTokenDelegates}</small>
          </div>
          {this.state.networkNameLowercase === 'hardhat' && (
            <div className="ml-auto">
              <InputGroup size="sm" className="mb-1">
                <FormControl
                  placeholder="Advance blocks..."
                  onChange={this.onSkipBlocksAmountChange}
                />
                <InputGroup.Append>
                  <Button
                    variant="primary"
                    onClick={() => this.handleSkipBlocks(this.state.skipBlocksAmount)}
                  >
                    Skip
                  </Button>
                </InputGroup.Append>
              </InputGroup>
              <InputGroup size="sm" className="mb-1">
                <FormControl
                  placeholder="Skip to block..."
                  onChange={this.onSkipBlocksAmountChange}
                />
                <InputGroup.Append>
                  <Button
                    variant="primary"
                    onClick={() => this.handleSkipBlocks(Number(this.state.skipBlocksAmount) - Number(this.state.blockNumber))}
                  >
                    Skip
                  </Button>
                </InputGroup.Append>
              </InputGroup>
              <Button
                block
                size="sm"
                variant="secondary"
                onClick={() => this.handleSkipTimestamp(2)}
              >Add 2 days to block timestamp</Button>
            </div>
          )}
        </div>

        <hr/>

        <Row>
          <Col>
            {(this.state.daoTokenBalance !== -1) &&
              <Fragment>
                <small>
                  Your DAO tokens: {new BigNumber(this.state.daoTokenBalance).toFormat(fmt)}
                  {this.state.daoTokenBalance !== 0 && (
                    <Fragment> (~{this.state.percentOfSupply}% of entire supply)</Fragment>
                  )}
                </small>
              </Fragment>
            }
          </Col>
          <Col className="text-right">
            <small>
              {this.state.blockNumber !== -1 && (
                <Fragment>Current block: {this.state.blockNumber}</Fragment>
              )}
              <br/>
              {this.state.quorum !== -1 && (
                <Fragment>Quorum: {this.state.quorum} votes (~{new BigNumber(this.state.quorum ** 2).toFormat(fmt)} dCLM8)</Fragment>
              )}
              <br/>
              {this.state.proposalThreshold !== -1 && (
                <Fragment>Proposal threshold: {this.state.proposalThreshold} dCLM8</Fragment>
              )}
            </small>
          </Col>
        </Row>

        {this.state.fetchingProposals && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          </div>
        )}

        {(this.state.proposalsLength === 0 && !this.state.fetchingProposals) && (
          <p>No proposals found.</p>
        )}

        <div className="d-flex flex-wrap justify-content-around row">
          {this.state.proposals.length !== 0 && this.state.proposals.map((proposal, key) => (
            <Card key={key} className="m-2 col-lg pt-2">
              <Card.Body>
                <Row className="pb-2">
                  <Col>
                    <h5 style={{ display: 'inline-block' }}>
                      <span className="mr-3">Proposal #{proposal.id}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="my-1 text-nowrap"
                        onClick={() => this.setState({
                          selectedProposalIdDetails: proposal.id,
                          callDetailsModalShow: true
                        })}
                      >
                        Details
                      </Button>
                    </h5>
                  </Col>
                  {/* proposal action buttons */}
                  <Col className="text-right">
                    {/* cancel button */}
                    {(proposal.state !== 'Executed' && proposal.state !== 'Canceled' && this.state.hasRole) && (
                      <Button
                        size="sm"
                        onClick={() => this.handleProposalAction('cancel', proposal.id)}
                        disabled={this.state.daoTokenBalance <= 0}
                        className="text-nowrap ml-1 my-1"
                        variant="danger"
                      >
                        Cancel
                      </Button>
                    )}
                    {/* queue button */}
                    {(proposal.state === 'Succeeded' && this.state.hasRole) && (
                      <Button
                        size="sm"
                        onClick={() => this.handleProposalAction('queue', proposal.id)}
                        disabled={this.state.daoTokenBalance <= 0}
                        className="text-nowrap ml-2 my-1"
                        variant="warning"
                      >
                        Queue
                      </Button>
                    )}
                    {/* execute button */}
                    {(proposal.state === 'Queued' && this.state.hasRole) && (
                      <Button
                        size="sm"
                        onClick={() => this.handleProposalAction('execute', proposal.id)}
                        disabled={this.state.daoTokenBalance <= 0}
                        className="text-nowrap ml-2 my-1"
                        variant="success"
                      >
                        Execute
                      </Button>
                    )}
                  </Col>
                </Row>

                {/* proposal state */}
                <Card.Text className="text-primary">
                  <b>{proposal.state}</b>
                </Card.Text>
                <Card.Text>
                  <small>Proposer: {proposal.details.proposer}</small>
                </Card.Text>

                <Card.Text className="py-2">{proposal.description}</Card.Text>
                <Card.Text></Card.Text>
                <Card.Text className="text-secondary mb-4"><i>Voting starts on block {proposal.details.startBlock} and ends on {proposal.details.endBlock}.</i></Card.Text>
                <Row className="text-center mb-3">

                  {/* voting buttons if eligible */}
                  {proposal.isEligibleToVote && (
                    <Fragment>
                      <Col className="text-success my-auto">
                        Total For: {new BigNumber(proposal.details.forVotes).toFormat(fmt)} votes ({new BigNumber(proposal.details.rawForVotes).toFormat(fmt)} dCLM8 locked)<br/>
                        <InputGroup className="mt-1">
                          <FormControl
                            placeholder="dCLM8 to vote for.."
                            onChange={this.onVotesAmountChange}
                          />
                          <InputGroup.Append>
                            <Button
                              variant="success"
                              onClick={() => this.vote(proposal.id, true)}
                            >Vote for</Button>
                          </InputGroup.Append>
                        </InputGroup>
                      </Col>
                      <Col className="text-danger my-auto">
                        Total Against: {new BigNumber(proposal.details.againstVotes).toFormat(fmt)} votes ({new BigNumber(proposal.details.rawAgainstVotes).toFormat(fmt)} dCLM8 locked)<br/>
                        <InputGroup className="mt-1">
                          <FormControl
                            placeholder="dCLM8 to vote against..."
                            onChange={this.onVotesAmountChange}
                          />
                          <InputGroup.Append>
                            <Button
                              variant="danger"
                              onClick={() => this.vote(proposal.id, false)}
                            >Vote against</Button>
                          </InputGroup.Append>
                        </InputGroup>
                      </Col>
                    </Fragment>
                  )}

                  {/* voting results if ineligible */}
                  {(proposal.state !== 'Pending' && !proposal.isEligibleToVote) && (
                    <Fragment>
                      <Col className="text-success my-auto">
                        Total For: {new BigNumber(proposal.details.forVotes).toFormat(fmt)} votes ({new BigNumber(proposal.details.rawForVotes).toFormat(fmt)} dCLM8)<br/>
                      </Col>
                      <Col className="text-danger my-auto">
                        Total Against: {new BigNumber(proposal.details.againstVotes).toFormat(fmt)} votes ({new BigNumber(proposal.details.rawAgainstVotes).toFormat(fmt)} dCLM8)<br/>
                      </Col>
                    </Fragment>
                  )}
                </Row>

                {proposal.receipt.hasVoted === true && (
                  <p className="text-center py-2">
                    You voted {proposal.receipt.support ? 'FOR' : 'AGAINST'} with {new BigNumber(proposal.receipt.votes).toFormat(fmt)} votes.
                  </p>
                )}

                {(proposal.state !== 'Active' && proposal.receipt.hasVoted !== true) && (
                  <Col className="text-danger my-auto">
                    <p className="text-secondary text-center">
                      <small>Must be an active proposal to vote.</small>
                    </p>
                  </Col>
                )}

                {(
                  (proposal.receipt.hasVoted || (proposal.details.proposer.toLowerCase() === this.props.signedInAddress.toLowerCase() && (proposal.state === 'Canceled' || proposal.state === 'Succeeded' || proposal.state === 'Defeated'))) &&
                  (!proposal.receipt.hasVotesRefunded || !proposal.receipt.hasStakeRefunded) &&
                  proposal.receipt.rawRefund > 0
                ) && (
                  <p className="text-center py-2">
                    <Button
                      size="sm"
                      onClick={() => this.refundDclm8(proposal.id)}
                      className="text-nowrap mt-2"
                      variant="danger"
                    >
                      {proposal.state === 'Active' ? (
                        <span>Cancel My Vote</span>
                      ) : (
                        <span>Refund {new BigNumber(proposal.receipt.rawRefund).toFormat(fmt)} dCLM8</span>
                      )}
                    </Button>
                  </p>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider,
  signedInAddress: app.signedInAddress,
  roles: app.roles
});

export default connect(mapStateToProps)(GovernanceDashboard);