import Web3Modal from 'web3modal';
import { Web3Provider } from '@ethersproject/providers';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Fortmatic from 'fortmatic';
import Torus from '@toruslabs/torus-embed';
import Portis from '@portis/web3';
import Authereum from 'authereum';
import ethProvider from 'eth-provider';

import * as types from './types';
import { getRoles, getLimitedMode } from '../../helpers/contracts';

const web3Modal = new Web3Modal({
  network: 'hardhat',
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: process.env.REACT_APP_INFURA_PROJECT_ID
      }
    },
    fortmatic: {
      package: Fortmatic,
      options: {
        key: process.env.REACT_APP_FORTMATIC_KEY
      }
    },
    torus: {
      package: Torus,
      // options: {
      //   networkParams: {
      //     host: 'http://localhost:8545',
      //     chainId: 1337,
      //     networkId: 1337
      //   },
      //   config: {
      //     buildEnv: 'development'
      //   }
      // }
    },
    portis: {
      package: Portis,
      options: {
        id: process.env.REACT_APP_PORTIS_ID
      }
    },
    authereum: {
      package: Authereum
    },
    frame: {
      package: ethProvider
    }
  }
});

export const loadWeb3Modal = () => {
  return (dispatch, getState) => {
    dispatch(updateLoading(true));
    web3Modal.connect().then(async (provider) => {
      const signedInAddress = provider.selectedAddress;
      const web3Provider = new Web3Provider(provider);
      try {
        const roles = await getRoles(web3Provider, signedInAddress);
        const limitedMode = await getLimitedMode(web3Provider);
        dispatch({
          type: types.LOAD_WEB3_MODAL,
          payload: {
            web3Provider,
            signedInAddress,
            roles,
            limitedMode
          }
        });
      } catch (e) {
        throw e;
      }
    }).catch(e => {
      dispatch(updateLoading(false));
    });
  }
}

export const unloadWeb3Modal = () => {
  return (dispatch, getState) => {
    web3Modal.clearCachedProvider();
    dispatch({ type: types.UNLOAD_WEB3_MODAL });
  }
}

const updateLoading = (flag) => ({
  type: types.UPDATE_LOADING,
  payload: flag
})