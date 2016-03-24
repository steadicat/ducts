import React from 'react';

export default function connect(Component) {
  return class Connect extends React.Component {
    static displayName = 'Connect';

    static contextTypes = {
      actions: React.PropTypes.objectOf(
        React.PropTypes.func,
      ),
      get: React.PropTypes.func,
    };

    componentWillMount() {
      const {get} = this.context;
      this.get = (key, defaultValue) =>
        get(key, defaultValue, this);
    }

    componentWillUnmount() {
      this.context.get.unsubscribe(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
      if ((Component instanceof React.Component) && !Component.pure && !Component.pureRender) return true;
      for (let k in this.props) {
        if (this.props[k] !== nextProps[k]) return true;
      }
      for (let k in nextProps) {
        if (this.props[k] !== nextProps[k]) return true;
      }
      for (let k in this.state) {
        if (this.state[k] !== nextState[k]) return true;
      }
      for (let k in nextState) {
        if (this.state[k] !== nextState[k]) return true;
      }
      return this.needsUpdate || false;
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
