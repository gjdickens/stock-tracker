// src/components/Layout.js
import React from 'react';
import { Link } from 'react-router';

export default class Layout extends React.Component {
  constructor(props) {
    super(props);
}

  render() {
    return (
      <div className="app-container">
        <header>
        </header>
        <div className="app-content">{React.cloneElement(this.props.children, { appState: this.state })}</div>
        <footer>
        </footer>
      </div>
    );
  }
}
