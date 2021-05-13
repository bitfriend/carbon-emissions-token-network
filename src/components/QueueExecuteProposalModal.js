import React, { Fragment, PureComponent } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { cancel, execute, queue } from '../helpers/contracts';

class QueueExecuteProposalModal extends PureComponent {
  state = {
    result: '',
    isSubmitting: false
  }

  handleAction = () => {
    switch (this.props.type) {
      case 'queue':
        this.submitQueue();
        return;
      case 'execute':
        this.submitExecute();
        return;
      case 'cancel':
        this.submitCancel();
        return;
      default:
        console.log('Invalid action type');
        return;
    }
  }

  async submitQueue() {
    this.setState({ isSubmitting: true });
    try {
      const queueCall = await queue(
        this.props.web3Provider,
        this.props.id
      );
      this.setState({
        result: queueCall.toString(),
        isSubmitting: false
      });
    } catch (e) {
      this.setState({
        result: e.message,
        isSubmitting: false
      });
    }
  }

  async submitExecute() {
    this.setState({ isSubmitting: true });
    try {
      const executeCall = await execute(
        this.props.web3Provider,
        this.props.id
      );
      this.setState({
        result: executeCall.toString(),
        isSubmitting: false
      });
    } catch (e) {
      this.setState({
        result: e.message,
        isSubmitting: false
      });
    }
  }

  async submitCancel() {
    this.setState({ isSubmitting: true });
    try {
      const cancelCall = await cancel(
        this.props.web3Provider,
        this.props.id
      );
      this.setState({
        result: cancelCall.toString(),
        isSubmitting: false
      });
    } catch (e) {
      this.setState({
        result: e.message,
        isSubmitting: false
      });
    }
  }

  render() {
    const { id, type, onHide, children, ...rest } = this.props;
    return (
      <Modal {...rest} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <ActionTitle type={type}></ActionTitle>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ActionDescription type={type}></ActionDescription>
          <Form>
            <Form.Group>
              <Form.Label>Proposal ID</Form.Label>
              <Form.Control
                type="text"
                disabled
                value={id}
              />
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
          <ActionButton
            type={type}
            provider={this.props.web3Provider}
            onClick={this.handleAction}
          />
        </Modal.Footer>
      </Modal>
    );
  }
}

QueueExecuteProposalModal.propTypes = {
  id: PropTypes.any,
  type: PropTypes.string,
  onHide: PropTypes.func
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider
});

export default connect(mapStateToProps)(QueueExecuteProposalModal);

// Renders appropriate button (queue, execute, or cancel)

class ActionButton extends PureComponent {
  render() {
    switch (this.props.type) {
      case 'queue':
        return <Button variant="warning" onClick={this.props.onClick}>Queue</Button>;
      case 'execute':
        return <Button variant="success" onClick={this.props.onClick}>Execute</Button>;
      case 'cancel':
        return <Button variant="danger" onClick={this.props.onClick}>Cancel proposal</Button>;
      default:
        console.log('Invalid action type');
        return <Fragment>Invalid action type</Fragment>;
    }
  }
}

ActionButton.propTypes = {
  type: PropTypes.string,
  onClick: PropTypes.func
}

// Renders appropriate description

class ActionDescription extends PureComponent {
  render() {
    switch (this.props.type) {
      case 'queue':
        return <p>Queue a proposal. A proposal must have <b>succeeded</b> in order to be queued by a DAO token holder.</p>;
      case 'execute':
        return <p>Execute a proposal. A proposal must be <b>queued</b> before being executed by a DAO token holder.</p>;
      case 'cancel':
        return <p>Cancel an active proposal.</p>;
      default:
        return <Fragment></Fragment>;
    }
  }
}

ActionDescription.propTypes = {
  type: PropTypes.string
}

// Renders appropriate title

class ActionTitle extends PureComponent {
  render() {
    switch (this.props.type) {
      case 'queue':
        return 'Queue a proposal for execution';
      case 'execute':
        return 'Execute a queued proposal';
      case 'cancel':
        return 'Cancel an active proposal';
      default:
        return <Fragment></Fragment>;
    }
  }
}

ActionTitle.propTypes = {
  type: PropTypes.string
}