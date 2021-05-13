import React, { PureComponent } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';

class SubmissionModal extends PureComponent {
  render() {
    const { title, body, onHide, children, ...rest } = this.props;
    return (
      <Modal {...rest} centered>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!body ? (
            <div className="text-center mt-3">
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <p>{body}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

SubmissionModal.propTypes = {
  title: PropTypes.string,
  body: PropTypes.string,
  onHide: PropTypes.func
}

export default SubmissionModal;