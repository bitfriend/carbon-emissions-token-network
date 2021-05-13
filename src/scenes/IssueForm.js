import React, { Fragment, PureComponent } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import DateTime from 'react-datetime';
import { connect } from 'react-redux';

import { TOKEN_TYPES, encodeParameters, getAdmin, issue } from '../helpers/contracts';
import SubmissionModal from '../components/SubmissionModal';
import CreateProposalModal from '../components/CreateProposalModal';

class IssueForm extends PureComponent {
  state = {
    submissionModalShow: false,
    createModalShow: false,
    // admin address (if contract is in limitedMode)
    adminAddress: '',
    // Form inputs
    address: '',
    tokenTypeId: 1,
    quantity: '',
    fromDate: '',
    thruDate: '',
    automaticRetireDate: '',
    metadata: '',
    manifest: '',
    description: '',
    result: '',
    // Calldata
    calldata: '',
    // After initial onFocus for required inputs, display red outline if invalid
    initializedAddressInput: false,
    initializedQuantityInput: false
  }

  componentDidMount() {
    if (this.props.limitedMode && this.props.web3Provider) {
      this.fetchAdmin();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.limitedMode && this.props.limitedMode) {
      if (this.props.web3Provider) {
        this.fetchAdmin();
      }
    } else if (prevProps.limitedMode && !this.props.limitedMode) {
      this.setState({ adminAddress: '' });
    }
  }

  async fetchAdmin() {
    const adminAddress = await getAdmin(this.props.web3Provider);
    this.setState({ adminAddress });
  }

  onAddressChange = (event) => this.setState({
    address: event.target.value
  })

  onTokenTypeIdChange = (event) => this.setState({
    tokenTypeId: event.target.value
  })

  onQuantityChange = (event) => this.setState({
    quantity: event.target.value
  })

  onFromDateChange = (event) => this.setState({
    fromDate: event.target.value
  })

  onThruDateChange = (event) => this.setState({
    thruDate: event.target.value
  })

  onAutomaticRetireDateChange = (event) => this.setState({
    automaticRetireDate: event.target.value
  })

  onMetadataChange = (event) => this.setState({
    metadata: event.target.value
  })

  onManifestChange = (event) => this.setState({
    manifest: event.target.value
  })

  onDescriptionChange = (event) => this.setState({
    description: event.target.value
  })

  handleSubmit = () => {
    this.submit();
    this.setState({
      submissionModalShow: true
    });
  }

  async submit() {
    // If quantity has 3 decimals, multiply by 1000 before passing to the contract
    const quantity_formatted = this.state.tokenTypeId === '3' ? Math.round(this.state.quantity * 1000) : this.state.quantity;
    const issueCall = await issue(
      this.props.web3Provider,
      this.state.address,
      this.state.tokenTypeId,
      quantity_formatted,
      this.state.fromDate,
      this.state.thruDate,
      this.state.automaticRetireDate,
      this.state.metadata,
      this.state.manifest,
      this.state.description
    );
    this.setState({
      result: issueCall.toString()
    });
  }

  // update calldata in background in case user wants to copy it with button
  updateCalldata() {
    try {
      const encodedCalldata = encodeParameters(
        // types of params
        [
          'address',
          'address',
          'uint8',
          'uint256',
          'uint256',
          'uint256',
          'uint256',
          'string',
          'string',
          'string'
        ],
        // value of params
        [
          this.props.limitedMode ? this.state.adminAddress : this.state.address,
          this.props.signedInAddress,
          this.state.tokenTypeId,
          Number(this.state.quantity),
          Number(this.state.fromDate) / 1000,
          Number(this.state.thruDate) / 1000,
          Number(this.state.automaticRetireDate) / 1000,
          this.state.metadata,
          this.state.manifest,
          'Issued by DAO. ' + this.state.description
        ]
      );
      this.setState({ calldata: encodedCalldata });
    } catch (e) {
      this.setState({ calldata: '' });
    }
  }

  render() {
    const inputError = {
      boxShadow: '0 0 0 0.2rem rgba(220,53,69,.5)',
      borderColor: '#dc3545'
    };
    return (
      <Fragment>
        <CreateProposalModal
          show={this.state.createModalShow}
          title="Create a proposal"
          onHide={() => this.setState({
            createModalShow: false
          })}
          provider={this.props.web3Provider}
          calldata={this.state.calldata}
          description={this.state.description}
        />
        <SubmissionModal
          show={this.state.submissionModalShow}
          title="Issue tokens"
          body={this.state.result}
          onHide={() => this.setState({
            result: '',
            submissionModalShow: false
          })}
        />
        <h2>Issue tokens</h2>
        <p>Issue tokens (Renewable Energy Certificate, Carbon Emissions Offset, or Audited Emissions) to registered consumers.</p>

        {(!this.props.limitedMode || this.state.tokenTypeId === '3') ? (
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
              style={(!!this.state.address || !this.state.initializedAddressInput) ? {} : inputError}
            />
            <Form.Text className="text-muted">
              Must be a registered consumer.
            </Form.Text>
          </Form.Group>
        ) : (
          <Form.Group>
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="input"
              value={this.state.adminAddress}
              disabled
              onBlur={() => this.setState({
                initializedAddressInput: true
              })}
              style={(!!this.state.address || !this.state.initializedAddressInput) ? {} : inputError}
            />
            <Form.Text className="text-muted">
              Always set to admin address in limited mode.
            </Form.Text>
          </Form.Group>
        )}

        <Form.Group>
          <Form.Label>Token Type</Form.Label>
          <Form.Control as="select" onChange={this.onTokenTypeIdChange}>
            <option value={1}>{TOKEN_TYPES[0]}</option>
            <option value={2}>{TOKEN_TYPES[1]}</option>
            <option value={3}>{TOKEN_TYPES[2]}</option>
          </Form.Control>
        </Form.Group>
        <Form.Group>
          <Form.Label>Quantity</Form.Label>
          <Form.Control
            type="input"
            placeholder={this.state.tokenTypeId === '3' ? '100.000' : '100'}
            value={this.state.quantity}
            onChange={this.onQuantityChange}
            onBlur={() => this.setState({
              initializedAddressInput: true
            })}
            style={(!!this.state.quantity || !this.state.initializedQuantityInput) ? {} : inputError}
          />
          {/* Display whether decimal is needed or not */}
          <Form.Text className="text-muted">
            {this.state.tokenTypeId === '3' ? 'Must not contain more than three decimal values.' : 'Must be an integer value.'}
          </Form.Text>
        </Form.Group>
        <Form.Row>
          <Form.Group as={Col}>
            <Form.Label>From date</Form.Label>
            <DateTime onChange={this.onFromDateChange}/>
          </Form.Group>
          <Form.Group as={Col}>
            <Form.Label>Through date</Form.Label>
            <DateTime onChange={this.onThruDateChange}/>
          </Form.Group>
          <Form.Group as={Col}>
            <Form.Label>Automatic retire date</Form.Label>
            <DateTime onChange={this.onAutomaticRetireDateChange}/>
          </Form.Group>
        </Form.Row>
        <Form.Group>
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            placeholder=""
            value={this.state.description}
            onChange={this.onDescriptionChange}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Metadata</Form.Label>
          <Form.Control
            as="textarea"
            placeholder="E.g. Region and time of energy generated, type of project, location, etc."
            value={this.state.metadata}
            onChange={this.onMetadataChange}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Manifest</Form.Label>
          <Form.Control
            as="textarea"
            placeholder="E.g. URL linking to the registration for the REC, emissions offset purchased, etc."
            value={this.state.manifest}
            onChange={this.onManifestChange}
          />
        </Form.Group>

        <Row className="mt-4">
          <Col>
            {/* if in limited mode, require dealer role (except AE) to make a DAO proposal */}
            {(this.props.limitedMode && (!this.props.roles[0] && !this.props.roles[1] && !this.props.roles[2])) ? (
              <Button
                variant="success"
                size="lg"
                block
                disabled
              >
                Must be a registered dealer
              </Button>
            ) : (
              <Button
                variant="success"
                size="lg"
                block
                onClick={() => this.setState({ createModalShow: true })}
                disabled={
                  this.state.calldata.length === 0 ||
                  String(this.state.quantity).length === 0 ||
                  this.state.tokenTypeId === '3'
                }
              >
                Create a DAO proposal
              </Button>
            )}
          </Col>

          {(!this.props.limitedMode || this.state.tokenTypeId === '3') && (
            <Col>
              {/* Only enable issue if role is found */}
              {(this.props.roles[0] || this.props.roles[1] || this.props.roles[2] || this.props.roles[3]) ? (
                <Button
                  variant="primary"
                  size="lg"
                  block
                  onClick={this.handleSubmit}
                  disabled={!this.state.calldata || String(this.state.quantity).length === 0 || String(this.state.address).length === 0}
                >
                  Issue
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  block
                  disabled
                >
                  Must be a registered dealer
                </Button>
              )}
            </Col>
          )}
        </Row>
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

export default connect(mapStateToProps)(IssueForm);