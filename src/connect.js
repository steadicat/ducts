import React from 'react';

export default function connect(Component) {
  return class Connect extends React.Component {
    static displayName = 'Connect';

    static contextTypes = {
      actions: React.PropTypes.objectOf(
        React.PropTypes.func,
      ),
      get: React.PropTypes.func,
    }

    componentWillMount() {
      const {get} = this.context;
      this.get = (key, defaultValue) =>
        get(key, defaultValue, this);
    }

    componentWillUnmount() {
      this.context.get.unsubscribe(this);
    }

    render() {
      return (
        <Component
          {...this.props}
          get={this.get}
          actions={this.context.actions}
        />
      );
    }
  }
}
