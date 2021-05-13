import React, { Fragment, PureComponent } from 'react';
import {
  Button,
  Col,
  Form,
  FormControl,
  InputGroup,
  Row,
  Spinner
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getRoles, registerConsumer, unregisterConsumer, registerDealer, unregisterDealer } from '../helpers/contracts';
import SubmissionModal from '../components/SubmissionModal';

class AccessControlForm extends PureComponent {
  state = {
    modalShow: false,
    address: '',
    role: 'Consumer',
    result: '',
    // Fetching roles of outside address
    theirAddress: '',
    theirRoles: [],
    fetchingTheirRoles: false
  }

  onAddressChange = (event) => this.setState({
    address: event.target.value
  })

  onTheirAddressChange = (event) => this.setState({
    theirAddress: event.target.value
  })

  onRoleChange = (event) => this.setState({
    role: event.target.value
  })

  fetchTheirRoles = async () => {
    this.setState({
      theirRoles: [],
      fetchingTheirRoles: true
    });
    const result = await getRoles(this.props.web3Provider, this.state.theirAddress);
    this.setState({
      theirRoles: result,
      fetchingTheirRoles: false
    });
  }

  async fetchRegisterConsumer() {
    const result = await registerConsumer(this.props.web3Provider, this.state.address);
    this.setState({
      result: result.toString()
    });
  }

  async fetchUnregisterConsumer() {
    const result = await unregisterConsumer(this.props.web3Provider, this.state.address);
    this.setState({
      result: result.toString()
    });
  }

  async fetchRegisterDealer(tokenTypeId) {
    const result = await registerDealer(this.props.web3Provider, this.state.address, tokenTypeId);
    this.setState({
      result: result.toString()
    });
  }

  async fetchUnregisterDealer(tokenTypeId) {
    const result = await unregisterDealer(this.props.web3Provider, this.state.address, tokenTypeId);
    this.setState({
      result: result.toString()
    });
  }

  handleRegister() {
    switch (this.state.role) {
      case 'Consumer':
        this.fetchRegisterConsumer();
        break;
      case 'REC':
        this.fetchRegisterDealer(1);
        break;
      case 'CEO':
        this.fetchRegisterDealer(2);
        break;
      case 'AE':
        this.fetchRegisterDealer(3);
        break;
      default:
        console.error("Can't find role");
    }
    this.setState({ modalShow: true });
  }

  handleUnregister() {
    switch (this.state.role) {
      case 'Consumer':
        this.fetchUnregisterConsumer();
        break;
      case 'REC':
        this.fetchUnregisterDealer(1);
        break;
      case 'CEO':
        this.fetchUnregisterDealer(2);
        break;
      case 'AE':
        this.fetchUnregisterDealer(3);
        break;
      default:
        console.error("Can't find role");
    }
    this.setState({ modalShow: true });
  }

  render = () => (
    <Fragment>
      <SubmissionModal
        show={this.state.modalShow}
        title="Manage roles"
        body={this.state.result}
        onHide={() => this.setState({
          modalShow: false,
          result: ''
        })}
      />
      <h2>Manage roles</h2>
      <p>Register or unregister roles for different addresses on the network. Must be an owner to register dealers, and must be a dealer to register consumers.</p>
      {this.props.signedInAddress && (
        <Fragment>
          <h4>My Roles</h4>
          {this.props.roles.length === 5 ? (
            <RolesList roles={this.props.roles}/>
          ) : (
            <div className="text-center mt-3 mb-3">
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          )}
        </Fragment>
      )}

      <h4>Look-up Roles</h4>
      <InputGroup className="mb-3">
        <FormControl
          placeholder="0x000..."
          onChange={this.onTheirAddressChange}
        />
        <InputGroup.Append>
          <Button variant="outline-secondary" onClick={this.fetchTheirRoles}>Look-up</Button>
        </InputGroup.Append>
      </InputGroup>
      {this.state.fetchingTheirRoles && (
        <div className="text-center mt-3 mb-3">
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      )}
      {this.state.theirRoles.length === 5 && (
        <RolesList roles={this.state.theirRoles}/>
      )}

      {/* Only display registration/unregistration tokens if owner or dealer */}
      {this.props.roles[0] === true && (
        <Fragment>
          <h4>Register/unregister dealers and consumers</h4>
          <Form.Group>
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="input"
              placeholder="0x000..."
              value={this.state.address}
              onChange={this.onAddressChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Role</Form.Label>
            <Form.Control as="select" onChange={this.onRoleChange}>
              <option value="Consumer">Consumer</option>
              <option value="REC">Renewable Energy Certificate (REC) Dealer</option>
              <option value="CEO">Offset Dealer</option>
              <option value="AE">Emissions Auditor</option>
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Row>
              <Col>
                <Button variant="success" size="lg" block onClick={this.handleRegister}>
                  Register
                </Button>
              </Col>
              <Col>
                <Button variant="danger" size="lg" block onClick={this.handleUnregister}>
                  Unregister
                </Button>
              </Col>
            </Row>
          </Form.Group>
        </Fragment>
      )}

      {(!this.props.limitedMode && (this.props.roles[0] === false && (this.props.roles[1] === true || this.props.roles[2] === true || this.props.roles[3] === true))) && (
        <Fragment>
          <h4>Register/unregister consumers</h4>
          <Form.Group>
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="input"
              placeholder="0x000..."
              value={this.state.address}
              onChange={this.onAddressChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Role</Form.Label>
            <Form.Control as="select" disabled>
              <option value="Consumer">Consumer</option>
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Row>
              <Col>
                <Button variant="success" size="lg" block onClick={this.handleRegister}>
                  Register
                </Button>
              </Col>
              <Col>
                <Button variant="danger" size="lg" block onClick={this.handleUnregister}>
                  Unregister
                </Button>
              </Col>
            </Row>
          </Form.Group>
        </Fragment>
      )}
    </Fragment>
  )
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider,
  signedInAddress: app.signedInAddress,
  roles: app.roles,
  limitedMode: app.limitedMode
});

export default connect(mapStateToProps)(AccessControlForm);

// Sub component

class RolesList extends PureComponent {
  render() {
    const roleNames = ["Owner", "REC Dealer", "Offset Dealer", "Emissions Auditor", "Consumer"];
    return (
      <ul>
        {this.props.roles.map((role, id) => (
          <div key={id}>
            {role && (
              <li>{roleNames[id]}&nbsp;&nbsp;</li>
            )}
          </div>
        ))}
      </ul>
    );
  }
}

RolesList.propTypes = {
  roles: PropTypes.array
}