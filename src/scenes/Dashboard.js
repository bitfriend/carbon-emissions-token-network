import React, { Fragment, PureComponent } from 'react';
import { Spinner, Table } from 'react-bootstrap';
import { connect } from 'react-redux';

import TokenInfoModal from '../components/TokenInfoModal';
import {
  formatDate,
  getAvailableAndRetired,
  getNumOfUniqueTokens,
  getTokenDetails
} from '../helpers/contracts';

class Dashboard extends PureComponent {
  state = {
    modalVisible: false,
    selectedToken: {},
    myBalances: [],
    myIssuedTokens: [],
    fetchingTokens: false,
    error: ''
  }

  componentDidMount() {
    if (this.props.web3Provider) {
      this.fetchBalances();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.web3Provider && this.props.web3Provider) {
      this.fetchBalances();
    }
  }

  async fetchBalances() {
    const myBalances = [];
    const myIssuedTokens = [];

    try {
      // First, fetch number of unique tokens
      const numOfUniqueTokens = await getNumOfUniqueTokens(this.props.web3Provider);

      // Iterate over each tokenId and find balance of signed in address
      for (let i = 1; i <= numOfUniqueTokens.toNumber(); i++) {
        // Fetch token details
        const tokenDetails = await getTokenDetails(this.props.web3Provider, i);

        // Format unix times to Date objects
        const fromDate = formatDate(tokenDetails.fromDate.toNumber());
        const thruDate = formatDate(tokenDetails.thruDate.toNumber());
        const automaticRetireDate = formatDate(tokenDetails.automaticRetireDate.toNumber());

        // Format tokenType from tokenTypeId
        const tokenTypes = [
          'Renewable Energy Certificate',
          'Carbon Emissions Offset',
          'Audited Emissions'
        ];

        // Fetch available and retired balances
        const balances = await getAvailableAndRetired(
          this.props.web3Provider,
          this.props.signedInAddress,
          i
        );
        let availableBalance = balances[0].toNumber();
        let retiredBalance = balances[1].toNumber();

        // Format decimal points for audited emissions tokens
        if (tokenDetails.tokenTypeId === 3) {
          availableBalance = (availableBalance / 1000).toFixed(3);
          retiredBalance = (retiredBalance / 1000).toFixed(3);
        }

        const token = {
          tokenId: tokenDetails.tokenId.toNumber(),
          tokenType: tokenTypes[tokenDetails.tokenTypeId - 1],
          availableBalance,
          retiredBalance,
          issuer: tokenDetails.issuer,
          issuee: tokenDetails.issuee,
          fromDate,
          thruDate,
          automaticRetireDate,
          metadata: tokenDetails.metadata,
          manifest: tokenDetails.manifest,
          description: tokenDetails.description,
        };

        // Push token to myBalances or myIssuedTokens in state
        if (token.availableBalance > 0 || token.retiredBalance > 0) {
          myBalances.push({ ...token });
          console.log('myBalances pushed -> ', myBalances);
        }
        if (token.issuer.toLowerCase() === this.props.signedInAddress.toLowerCase()) {
          myIssuedTokens.push(token);
          const issueeBalances = await getAvailableAndRetired(
            this.props.web3Provider,
            tokenDetails.issuee,
            i
          );
          token.issueeAvailableBalance = issueeBalances[0].toNumber();
          token.issueeRetiredBalance = issueeBalances[1].toNumber();
          token.showIssueeBalance = true;
        }
      }
    } catch (e) {
      console.log(e);
      this.setState({ error: 'Could not connect to contract on the selected network. Check your wallet provider settings.' });
    }

    this.setState({
      myBalances,
      myIssuedTokens,
      fetchingTokens: false,
      error: ''
    });
  }

  handleOpenTokenInfoModal = (token) => this.setState({
    selectedToken: token,
    modalVisible: true
  })

  pointerHover = (e) => {
    e.target.style.cursor = 'pointer';
  }

  render() {
    const isDealer = (this.props.roles.length > 0 && (this.props.roles[0] || this.props.roles[1] || this.props.roles[2] || this.props.roles[3]));
    return (
      <Fragment>
        <TokenInfoModal
          show={this.state.modalVisible}
          token={this.state.selectedToken}
          onHide={() => this.setState({
            modalVisible: false,
            selectedToken: {}
          })}
        />

        <h2>Dashboard</h2>
        <p className="mb-1">View your token balances and tokens you've issued.</p>

        <p className="text-danger">{this.state.error}</p>

        <div className={this.state.fetchingTokens ? 'dimmed' : ''}>

          {this.state.fetchingTokens && (
            <div className="text-center my-4">
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          )}

          {!!this.props.signedInAddress &&
            <div className="mb-4">
              <h4>Your Tokens</h4>
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Balance</th>
                    <th>Retired</th>
                  </tr>
                </thead>
                <tbody>
                  {(this.state.myBalances.length !== 0 && !this.state.fetchingTokens) && this.state.myBalances.map(token => (
                    <tr
                      key={token.tokenId}
                      onClick={() => this.handleOpenTokenInfoModal(token)}
                      onMouseOver={this.pointerHover}
                      className={Number(token.availableBalance) <= 0 ? 'table-secondary' : ''}
                    >
                      <td>{token.tokenId}</td>
                      <td>{token.tokenType}</td>
                      <td>{token.availableBalance}</td>
                      <td>{token.retiredBalance}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          }

          {/* Only display issued tokens if owner or dealer */}
          {isDealer && (
            <div className="mt-4">
              <h4>Tokens You've Issued</h4>
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(this.state.myIssuedTokens.length !== 0 && !this.state.fetchingTokens) && this.state.myIssuedTokens.map(token => (
                    <tr
                      key={token.tokenId}
                      onClick={() => this.handleOpenTokenInfoModal(token)}
                      onMouseOver={this.pointerHover}
                    >
                      <td>{token.tokenId}</td>
                      <td>{token.tokenType}</td>
                      <td>{token.description}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider,
  signedInAddress: app.signedInAddress,
  roles: app.roles,
  limitedMode: app.limitedMode
});

export default connect(mapStateToProps)(Dashboard);