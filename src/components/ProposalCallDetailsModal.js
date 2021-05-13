import React, { PureComponent } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { TOKEN_TYPES, decodeParameters, formatDate } from '../helpers/contracts';

class ProposalCallDetailsModal extends PureComponent {
  state = {
    decoded: {}
  }

  componentDidMount() {
    this.fetchDecodedParameters(0);
  }

  async fetchDecodedParameters(actionNumber) {
    const regExp = /\(([^)]+)\)/;
    const matches = regExp.exec(this.props.actions.signatures[actionNumber]);
    const types = matches[1].split(",");
    const decodedCall = await decodeParameters(types, this.props.actions.calldatas[actionNumber]);
    const decoded = {
      address: decodedCall[0],
      proposer: decodedCall[1],
      tokenType: TOKEN_TYPES[decodedCall[2]-1],
      quantity: decodedCall[3].toNumber(),
      fromDate: formatDate(decodedCall[4].toNumber()),
      thruDate: formatDate(decodedCall[5].toNumber()),
      automaticRetireDate: formatDate(decodedCall[6].toNumber()),
      metadata: decodedCall[7],
      manifest: decodedCall[8],
      description: decodedCall[9]
    };
    this.setState({ decoded });
  }

  render() {
    const { title, actions, onHide, children, ...rest } = this.props;
    return (
      <Modal {...rest} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>If passed, this is the contract call that the DAO will make when the proposal is queued and executed.</p>
          <Form>
            {/* <Form.Group> */}
            {/*   <Form.Label>Target</Form.Label> */}
            {/*   <Form.Text>{props.actions.targets}</Form.Text> */}
            {/* </Form.Group> */}
            <Form.Group>
              <Form.Label>Function signature</Form.Label>
              <Form.Text>{actions.signatures}</Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label>Function parameters</Form.Label>
              <Form.Text>Address to issue to: {this.state.decoded.address}</Form.Text>
              <Form.Text>Issuer/proposer: {this.state.decoded.proposer}</Form.Text>
              <Form.Text>Token type: {this.state.decoded.tokenType}</Form.Text>
              <Form.Text>Quantity of tokens: {this.state.decoded.quantity}</Form.Text>
              <Form.Text>From date: {this.state.decoded.fromDate}</Form.Text>
              <Form.Text>Through date: {this.state.decoded.thruDate}</Form.Text>
              <Form.Text>Automatic retire date: {this.state.decoded.automaticRetireDate}</Form.Text>
              <Form.Text>Metadata: {this.state.decoded.metadata}</Form.Text>
              <Form.Text>Manifest: {this.state.decoded.manifest}</Form.Text>
              <Form.Text>Description: {this.state.decoded.description}</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

ProposalCallDetailsModal.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.shape({
    signatures: PropTypes.array,
    calldatas: PropTypes.array
  }),
  onHide: PropTypes.func
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider
});

export default connect(mapStateToProps)(ProposalCallDetailsModal);