import React, { PureComponent } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import addresses from '../contracts/addresses.json';
import { propose } from '../helpers/contracts';

class CreateProposalModal extends PureComponent {
  state = {
    description: '',
    result: '',
    isSubmitting: false
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.description !== this.props.description) {
      this.setState({
        description: nextProps.description
      });
    }
  }

  submit = async () => {
    this.setState({ isSubmitting: false });
    try {
      const args = {
        targets: [
          addresses[process.env.REACT_APP_NETWORK_NAME].tokenNetwork.address
        ],
        values: [0],
        signatures: [
          'issueOnBehalf(address,address,uint8,uint256,uint256,uint256,uint256,string,string,string)'
        ],
        calldata: [
          this.props.calldata
        ],
        description: this.props.description
      };
      const proposeCall = await propose(
        this.props.web3Provider,
        args.targets,
        args.values,
        args.signatures,
        args.calldata,
        args.description
      );
      this.setState({
        result: proposeCall.toString(),
        isSubmitting: false
      });
    } catch (e) {
      this.setState({
        result: e.message,
        isSubmitting: false
      });
    }
  }

  onDescriptionChange = (event) => this.setState({
    description: event.target.value
  })

  render() {
    const { title, calldata, description, onHide, children, ...rest } = this.props;
    return (
      <Modal {...rest} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Create a proposal to <b>issue tokens</b> from the DAO. If it passes through a vote of the DAO token holders, it can be queued and executed to issue new tokens to any registered consumer. 400,000 tokens or 4% of the DAO token supply is required to submit a proposal. Only one active proposal is allowed per user. Proposals, votes, DAO token balance, and delgates can be viewed on the Governance page.</p>
          <p><small>Be sure to double-check all form inputs before submitting! You can cancel proposals but it costs gas.</small></p>
          <Form>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={2} placeholder="Describe the purpose of this proposal..." value={this.state.description} onChange={this.onDescriptionChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Calldata</Form.Label>
              <Form.Control as="textarea" disabled rows={3} value={calldata} />
              <Form.Text className="text-muted">This is the encoded data of the issue contract call. Don't worry about this unless you're calling the Governor contract manually.</Form.Text>
            </Form.Group>
          </Form>
          {this.state.isSubmitting && (
            <div className="text-center mt-3">
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          )}
          {!!this.state.result && (
            <p className="mt-3">{this.state.result}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onHide}>Close</Button>
          <Button variant="success" onClick={this.submit}>Submit proposal</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

CreateProposalModal.propTypes = {
  title: PropTypes.string,
  calldata: PropTypes.string,
  description: PropTypes.string,
  onHide: PropTypes.func
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider
});

export default connect(mapStateToProps)(CreateProposalModal);