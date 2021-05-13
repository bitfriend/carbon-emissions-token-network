import React, { PureComponent } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { delegate } from '../helpers/contracts';

class DelegateDAOTokensModal extends PureComponent {
  state = {
    delegatee: '',
    result: '',
    isSubmitting: false
  }

  submitDelegate = async () => {
    this.setState({ isSubmitting: true });
    try {
      const delegateCall = await delegate(
        this.props.web3Provider,
        this.state.delegatee
      );
      this.setState({
        result: delegateCall.toString(),
        isSubmitting: false
      });
    } catch (e) {
      this.setState({
        result: e.message,
        isSubmitting: false
      });
    }
  }

  handleDelegateeChange = (event) => this.setState({
    delegatee: event.target.value
  })

  render() {
    const { title, balance, onHide, children, ...rest } = this.props;
    return (
      <Modal {...rest} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Delegate your vote to an address using your DAO token balance of <span className="text-success">{balance}</span> as your voting power. Must be a registered consumer, and you can delegate to yourself.</p>
          <Form>
            <Form.Group>
              <Form.Label>Delegatee</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x000..."
                onChange={this.handleDelegateeChange}
              />
              <Form.Text className="text-muted">
                Please check to make sure the delegatee address is a registered consumer.
              </Form.Text>
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
          <Button
            onClick={this.submitDelegate}
            variant="success"
          >
            Delegate
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

DelegateDAOTokensModal.propTypes = {
  title: PropTypes.string,
  balance: PropTypes.any,
  onHide: PropTypes.func
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider
});

export default connect(mapStateToProps)(DelegateDAOTokensModal);