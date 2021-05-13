import * as types from './types';

const initialState = {
  web3Provider: null,
  signedInAddress: '',
  roles: [],
  limitedMode: true,
  loading: false
};

const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.LOAD_WEB3_MODAL:
      const { web3Provider, signedInAddress, roles, limitedMode } = action.payload;
      return {
        ...state,
        web3Provider,
        signedInAddress,
        roles,
        limitedMode,
        loading: false
      };
    case types.UNLOAD_WEB3_MODAL:
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return {
        ...state,
        web3Provider: null,
        signedInAddress: '',
        roles: [],
        limitedMode: true,
        loading: false
      };
    case types.UPDATE_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
}

export default appReducer;