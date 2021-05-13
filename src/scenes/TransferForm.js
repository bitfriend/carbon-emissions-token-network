import React, { Fragment, PureComponent } from 'react';
import { Button, Form } from 'react-bootstrap';
import { connect } from 'react-redux';

import { transfer } from '../helpers/contracts';
import SubmissionModal from '../components/SubmissionModal';

class TransferForm extends PureComponent {
  state = {
    modalShow: false,
    // Form inputs
    address: '',
    tokenId: '',
    amount: '',
    result: '',
    // After initial onFocus for retransferquired inputs, display red outline if invalid
    initializedAddressInput: false,
    initializedTokenIdInput: false,
    initializedAmountInput: false
  }

  componentDidMount() {
    const queryParams = new URLSearchParams(window.location.search);
    const addressQueryParam = queryParams.get('address');
    const tokenIdQueryParam = queryParams.get('tokenId');
    const quantityQueryParam = queryParams.get('quantity');

    if (addressQueryParam) {
      this.setState({
        address: addressQueryParam
      });
    }
    if (tokenIdQueryParam) {
      this.setState({
        tokenId: tokenIdQueryParam
      });
    }
    if (quantityQueryParam) {
      this.setState({
        amount: quantityQueryParam
      });
    }
  }

  onAddressChange = (event) => this.setState({
    address: event.target.value
  })

  onTokenIdChange = (event) => this.setState({
    tokenId: event.target.value
  })

  onAmountChange = (event) => this.setState({
    amount: event.target.value
  })

  handleTransfer = () => {
    this.fetchTransfer();
    this.setState({ modalShow: true });
  }

  async fetchTransfer() {
    const result = await transfer(this.props.web3Provider, this.state.address, this.state.tokenId, this.state.amount);
    this.setState({
      result: result.toString()
    });
  }

  render() {
    const inputError = {
      boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
      borderColor: '#dc3545'
    };
    return (
      <Fragment>
        <SubmissionModal
          show={this.state.modalShow}
          title="Transfer tokens"
          body={this.state.result}
          onHide={() => this.setState({
            modalShow: false,
            result: ''
          })}
        />
        <h2>Transfer tokens</h2>
        <p>Send available tokens in your possession of a particular ID (as displayed on the dashboard) to any address. Audited Emissions tokens cannot be transferred as they come automatically retired.</p>
        <Form.Group>
          <Form.Label>Address</Form.Label>
          <Form.Control
            type="input"
            placeholder="0x000..."
            value={this.state.address}
            onChange={this.onAddressChange}
            onBlur={() => this.setState({
              initializedAddressInput: true
            })}
            style={(this.state.address || !this.state.initializedAddressInput) ? {} : inputError}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Token ID</Form.Label>
          <Form.Control
            type="input"
            placeholder="1, 2, 3, ..."
            value={this.state.tokenId}
            onChange={this.onTokenIdChange}
            onBlur={() => this.setState({
              initializedTokenIdInput: true
            })}
            style={(this.state.tokenId || !this.state.initializedTokenIdInput) ? {} : inputError}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Quantity</Form.Label>
          <Form.Control
            type="input"
            placeholder="100"
            value={this.state.amount}
            onChange={this.onAmountChange}
            onBlur={() => this.setState({
              initializedAmountInput: true
            })}
            style={(this.state.amount || !this.state.initializedAmountInput) ? {} : inputError}
          />
        </Form.Group>
        {/* Only enable transfers if role is found */}
        {(this.props.roles.length === 5 && this.props.roles.some(r => r === true)) ? (
          <Button
            variant="success"
            size="lg"
            block
            onClick={this.handleTransfer}
          >
            Transfer
          </Button>
        ) : (
          <Button
            disabled
            variant="success"
            size="lg"
            block
          >
            Must be a registered user
          </Button>
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider,
  roles: app.roles
});

export default connect(mapStateToProps)(TransferForm);