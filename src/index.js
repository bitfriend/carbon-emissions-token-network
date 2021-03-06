import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datetime/css/react-datetime.css';
import './index.css';
import store from './controllers/store';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render((
  <Provider store={store}>
    <BrowserRouter basename={process.env.REACT_APP_PUBLIC_BASE}>
      <App />
    </BrowserRouter>
  </Provider>
), document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
