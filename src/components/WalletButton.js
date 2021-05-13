import React, { PureComponent } from 'react';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';

import { loadWeb3Modal, unloadWeb3Modal } from '../controllers/app/actions';

class WalletButton extends PureComponent {
  render = () => (
    <Button
      variant="primary"
      className="ml-1"
      onClick={() => !this.props.web3Provider ? this.props.loadWeb3Modal() : this.props.unloadWeb3Modal()}
    >
      {!this.props.web3Provider ? 'Connect Wallet' : 'Disconnect Wallet'}
    </Button>
  )
}

const mapStateToProps = ({ app }) => ({
  web3Provider: app.web3Provider
});

const mapDispatchToProps = (dispacth) => ({
  loadWeb3Modal: () => dispacth(loadWeb3Modal()),
  unloadWeb3Modal: () => dispacth(unloadWeb3Modal())
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletButton);