import React from 'react';
import ReactDOM from 'react-dom';
import AppRoutes from './components/AppRoutes';


ReactDOM.render(<AppRoutes/>, document.getElementById('app'));

if(process.env.NODE_ENV == 'development' && module.hot) {
    module.hot.accept('./components/AppRoutes', () => {
        const NewApp = require('./components/AppRoutes').default;
        ReactDOM.render(<NewApp />, document.getElementById('app'));
    });
}
