import React, { Fragment, PureComponent } from 'react';
import { Button, Form } from 'react-bootstrap';
import { connect } from 'react-redux';

import { retire } from '../helpers/contracts';
import SubmissionModal from '../components/SubmissionModal';

class RetireForm extends PureComponent {
  state = {
    modalShow: false,
    // Form inputs
    tokenId: '',
    amount: '',
    result: '',
    // After initial onFocus for required inputs, display red outline if invalid
    initializedTokenIdInput: false,
    initializedAmountInput: false
  }

  componentDidMount() {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenIdQueryParam = queryParams.get('tokenId');
    const quantityQueryParam = queryParams.get('quantity');

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

  onTokenIdChange = (event) => this.setState({
    tokenId: event.target.value
  })

  onAmountChange = (event) => this.setState({
    amount: event.target.value
  })

  async fetchRetire() {
    const retireCall = await retire(
      this.props.web3Provider,
      this.state.tokenId,
      this.state.amount
    );
    this.setState({
      result: retireCall.toString()
    });
  }

  handleRetire = () => {
    this.fetchRetire();
    this.setState({ modalShow: true });
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
          title="Retire tokens"
          body={this.state.result}
          onHide={() => this.setState({
            modalShow: false,
            result: ''
          })}
        />
        <h2>Retire tokens</h2>
        <p>Retire some or all tokens in your possession of a particular ID (as displayed on the dashboard). Audited Emissions tokens cannot be retired as they come retired on issuance.</p>
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
        {/* Only enable retires if role is found */}
        {(this.props.roles.length === 5 && this.props.roles.some(r => r === true)) ? (
          <Button
            variant="danger"
            size="lg"
            block
            onClick={this.handleRetire}
          >
            Retire
          </Button>
        ) : (
          <Button
            disabled
            variant="danger"
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

export default connect(mapStateToProps)(RetireForm);