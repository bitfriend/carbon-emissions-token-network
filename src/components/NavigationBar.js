import React, { Fragment, Component } from 'react';
import { Nav, Navbar, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { FaGithub, FaRegClipboard } from 'react-icons/fa';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { isEqual } from 'lodash/fp';
import { connect } from 'react-redux';

import WalletButton from '../components/WalletButton';

class NavigationBar extends Component {
  state = {
    role: ''
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // if roles are fetched and (the display role is empty or cached roles differ from current roles), find the correct string to display
    if (this.props.roles.length === 5 && (this.state.role === '' || !isEqual(this.props.roles, prevProps.roles))) {
      if (this.props.roles[0] === true) {
        this.setState({ role: 'Admin (superuser)' });
      } else if (this.props.roles[1] === true) {
        this.setState({ role: 'REC Dealer' });
      } else if (this.props.roles[2] === true) {
        this.setState({ role: 'Offset Dealer' });
      } else if (this.props.roles[3] === true) {
        this.setState({ role: 'Emissions Auditor' });
      } else if (this.props.roles[4] === true) {
        this.setState({ role: 'Consumer' });
      } else {
        this.setState({ role: 'Unregistered' });
      }
    }
  }

  truncateAddress(addr) {
    const prefix = addr.substring(0, 6); // including "0x"
    const suffix = addr.substring(addr.length - 4);
    return `${prefix}...${suffix}`;
  }

  render = () => (
    <Navbar bg="white" expand="md" className="m-2">
      <Navbar.Brand>Carbon Emissions Token Network</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav className="mr-auto">
          <Nav.Link href="https://github.com/bitfriend/carbon-emissions-token-network-hardhat">
            <FaGithub />
          </Nav.Link>
        </Nav>
        <Nav>
          {!!this.props.signedInAddress && (
            <Fragment>
              <Nav.Item style={{ padding: '0 1.2rem' }}>
                <Row className="d-flex justify-content-center">
                  <span className={this.state.role === 'Unregistered' ? 'text-danger' : 'text-success'}>{this.state.role}</span>
                </Row>
                <Row className="d-flex justify-content-center">
                  <span className="text-secondary">{process.env.REACT_APP_NETWORK_NAME}</span>
                </Row>
                {this.props.limitedMode && (
                  <Row className="d-flex justify-content-center">
                    <span className="text-danger">Limited mode</span>
                  </Row>
                )}
              </Nav.Item>
              <Nav.Item style={{ padding: '.5rem .5rem' }}>
                <span className="text-secondary">{this.truncateAddress(this.props.signedInAddress)}</span>
                <CopyToClipboard text={this.props.signedInAddress}>
                  <span className="text-secondary">
                    <OverlayTrigger
                      trigger="click"
                      placement="bottom"
                      rootClose
                      delay={{ show: 250, hide: 400 }}
                      overlay={(props) => (
                        <Tooltip {...props}>Copied to clipboard!</Tooltip>
                      )}
                    >
                      <span style={{ cursor: 'pointer' }}>&nbsp;<FaRegClipboard /></span>
                    </OverlayTrigger>
                  </span>
                </CopyToClipboard>
              </Nav.Item>
            </Fragment>
          )}
          <WalletButton />
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

const mapStateToProps = ({ app }) => ({
  signedInAddress: app.signedInAddress,
  roles: app.roles,
  limitedMode: app.limitedMode
});

export default connect(mapStateToProps)(NavigationBar);