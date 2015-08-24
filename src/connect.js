import React from 'react';

export default function connect(Component) {
  return class Connect extends React.Component {
    static displayName = `Connect(${Component.displayName})`;

    static contextTypes = {
      actions: React.PropTypes.objectOf(
        React.PropTypes.func,
      ),
      get: React.PropTypes.func,
    }

    componentWillUnmount() {
      this.context.get.unsubscribe(this);
    }

    render() {
      const {actions, get} = this.context;
      return <Component {...this.props} get={(key) => get(key, this)} actions={actions} />;
    }
  }
}
