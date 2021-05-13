import React, { PureComponent } from 'react';
import { Button, Col, Modal, ModalBody, ModalFooter, ModalTitle, Row, Table } from 'react-bootstrap';
import { FaCoins } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class TokenInfoModal extends PureComponent {
  render = () => {
    const { token, onHide, children, ...rest } = this.props;
    return (
      <Modal {...rest} centered size="lg">
        <Modal.Header closeButton>
          <ModalTitle >Token Details</ModalTitle>
        </Modal.Header>
        <ModalBody>
          <Row className="mt-2 mb-4 mr-3">
            {/* Available and retired balances */}
            {token.showIssueeBalance ? (
              <Col className="col-5 offset-1 text-right">
                <h5 className="text-secondary">Issuee's Available Balance</h5>
                <h1>{token.issueeAvailableBalance}</h1>
                <h5 className="text-secondary">Issuee's Retired Balance</h5>
                <h2>{token.issueeRetiredBalance}</h2>
              </Col>
            ) : (
              <Col className="col-4 offset-1 text-right">
                <h5 className="text-secondary">Available Balance</h5>
                <h1>{token.availableBalance}</h1>
                <h5 className="text-secondary">Retired Balance</h5>
                <h2>{token.retiredBalance}</h2>
              </Col>
            )}

            {/* token ID, icon, and type */}
            <Col className="col-3">
              <Row className="text-center">
                <Col>
                  <h3 className="mb-1 mt-2">ID: {token.tokenId}</h3>
                </Col>
              </Row>
              <Row className="text-center">
                <Col>
                  <h1 className="display-4">
                    <FaCoins />
                  </h1>
                </Col>
              </Row>
              <Row className="text-center mt-1">
                <Col>
                  <small className="text-secondary text-uppercase">
                    {token.tokenType}
                  </small>
                </Col>
              </Row>
            </Col>

            {/* transfer and retire buttons (enabled if available balance) */}
            {!token.showIssueeBalance && (
              <Col className="col-3">
                <br />
                <Row className="text-left mb-2">
                  <Col>
                    <Button
                      variant="success"
                      href={`/transfer?tokenId=${token.tokenId}`}
                      disabled={Number(token.availableBalance) <= 0}
                    >
                      Transfer
                    </Button>
                  </Col>
                </Row>
                <Row className="text-left mb-2">
                  <Col>
                    <Button
                      variant="danger"
                      href={`/retire?tokenId=${token.tokenId}`}
                      disabled={Number(token.availableBalance) <= 0}
                    >
                      Retire
                    </Button>
                  </Col>
                </Row>
              </Col>
            )}
          </Row>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Issuer</td>
                <td className="text-monospace">{token.issuer}</td>
              </tr>
              <tr>
                <td>Issuee</td>
                <td className="text-monospace">{token.issuee}</td>
              </tr>
              <tr>
                <td>From date</td>
                <td>{token.fromDate}</td>
              </tr>
              <tr>
                <td>Thru date</td>
                <td>{token.thruDate}</td>
              </tr>
              <tr>
                <td>Automatic retire date</td>
                <td>{token.automaticRetireDate}</td>
              </tr>
              <tr>
                <td>Metadata</td>
                <td className="text-monospace" style={{ wordWrap: 'anywhere' }}>
                  {token.metadata}
                </td>
              </tr>
              <tr>
                <td>Manifest</td>
                <td>{token.manifest}</td>
              </tr>
              <tr>
                <td>Description</td>
                <td>{token.description}</td>
              </tr>
            </tbody>
          </Table>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onHide}>Close</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

TokenInfoModal.propTypes = {
  token: PropTypes.object,
  onHide: PropTypes.func
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider
});

export default connect(mapStateToProps)(TokenInfoModal);