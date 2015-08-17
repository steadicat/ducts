import React from 'react';

export default class Root {
  displayName = 'Root';

  static childContextTypes = {
    actions: React.PropTypes.objectOf(
      React.PropTypes.func,
    ),
    get: React.PropTypes.func,
  }

  getChildContext() {
    const {get, actions} = this.props;
    return {get, actions};
  }

  render() {
    return this.props.children();
  }

}
