import React from 'react';

export default class Root extends React.Component {

  static childContextTypes = {
    actions: React.PropTypes.objectOf(
      React.PropTypes.func,
    ),
    get: React.PropTypes.func,
  };

  getChildContext() {
    const {get, actions} = this.props;
    return {get, actions};
  }

  render() {
    return typeof this.props.children === 'function' ? this.props.children() : this.props.children;
  }

}
