import React, { PureComponent } from 'react';
import { Container, Nav, TabContainer, TabContent } from 'react-bootstrap';
import { Link, Redirect, Route, Switch } from 'react-router-dom';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { compose } from 'redux';

import './App.css';
import NavigationBar from './components/NavigationBar';
import Dashboard from './scenes/Dashboard';
import GovernanceDashboard from './scenes/GovernanceDashboard';
import IssueForm from './scenes/IssueForm';
import TransferForm from './scenes/TransferForm';
import RetireForm from './scenes/RetireForm';
import AccessControlForm from './scenes/AccessControlForm';
import { loadWeb3Modal, unloadWeb3Modal } from './controllers/app/actions';

class App extends PureComponent {
  componentDidMount() {
    this.unlisten = this.props.history.listen((location, action) => {});
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const isOwnerOrDealer = this.props.roles.length > 0 && (this.props.roles[0] || this.props.roles[1] || this.props.roles[2] || this.props.roles[3]);
    const isOwner = this.props.roles.length > 0 && this.props.roles[0];
    return (
      <div className="App">
        <NavigationBar />
        {/* Tabs to pages */}
        <Nav fill variant="tabs" className="mt-2 mb-4 border-bottom-0">
          {/* On dashboard page, click this link to refresh the balances */}
          {/* Else on other page, click this link to go to dashboard */}
          {this.props.location.pathname === '/dashboard' ? (
            <Nav.Link eventKey="dashboard">Dashboard</Nav.Link>
          ) : (
            <Nav.Item>
              <Nav.Link as={Link} to="/dashboard" eventKey="dashboard">Dashboard</Nav.Link>
            </Nav.Item>
          )}

          <Nav.Item>
            <Nav.Link as={Link} to="/governance" eventKey="governance">Governance</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/issue" eventKey="issue">Issue tokens</Nav.Link>
          </Nav.Item>

          {((this.props.limitedMode && isOwner) || !this.props.limitedMode) && (
            <Nav.Item>
              <Nav.Link as={Link} to="/transfer" eventKey="transfer">Transfer tokens</Nav.Link>
            </Nav.Item>
          )}

          <Nav.Item>
            <Nav.Link as={Link} to="/retire" eventKey="retire">Retire tokens</Nav.Link>
          </Nav.Item>

          {/* Display "Manage Roles" if owner/dealer, "My Roles" otherwise */}
          <Nav.Item>
            <Nav.Link as={Link} to="/access-control" eventKey="access-control">{((!this.props.limitedMode && isOwnerOrDealer) ^ (this.props.limitedMode && isOwner) ? 'Manage roles' : 'My roles')}</Nav.Link>
          </Nav.Item>
        </Nav>

        <Container className="my-2">
          <TabContainer defaultActiveKey={this.props.location.pathname || '/dashboard'}>
            <TabContent>
              <Switch>
                <Route exact path="/">
                  <Redirect to="/dashboard" />
                </Route>
                <Route
                  path="/dashboard"
                  component={Dashboard}
                />
                <Route
                  path="/governance"
                  component={GovernanceDashboard}
                />
                <Route
                  path="/issue"
                  component={IssueForm}
                />
                <Route
                  path="/transfer"
                  component={TransferForm}
                />
                <Route
                  path="/retire"
                  component={RetireForm}
                />
                <Route
                  path="/access-control"
                  component={AccessControlForm}
                />
              </Switch>
            </TabContent>
          </TabContainer>
          <div className="my-5" />
        </Container>
      </div>
    );
  }
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider,
  signedInAddress: app.signedInAddress,
  roles: app.roles,
  limitedMode: app.limitedMode
});

const mapDispatchToProps = (dispacth) => ({
  loadWeb3Modal: () => dispacth(loadWeb3Modal()),
  unloadWeb3Modal: () => dispacth(unloadWeb3Modal())
});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(App);