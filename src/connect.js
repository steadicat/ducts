import React from 'react';
/* global console */
let DEBUG = false;

export function enableRenderLogging(enabled = true) {
  DEBUG = enabled;
}

export default function connect(Component) {
  const displayName = Component.displayName || Component.name || 'StatelessComponent';

  return class Connect extends React.Component {
    static displayName = `Connect(${displayName})`;

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
      if ((Component instanceof React.Component) && !Component.pure && !Component.pureRender) return this.log(true, 'connected component class does not have a pure or pureRender static property');
      for (let k in this.props) {
        if (this.props[k] !== nextProps[k]) return this.log(true, `prop ${k} changed`);
      }
      for (let k in nextProps) {
        if (this.props[k] !== nextProps[k]) return this.log(true, `prop ${k} changed`);
      }
      for (let k in this.state) {
        if (this.state[k] !== nextState[k]) return this.log(true, `state ${k} changed`);
      }
      for (let k in nextState) {
        if (this.state[k] !== nextState[k]) return this.log(true, `state ${k} changed`);
      }
      if (this.needsUpdate) return this.log(true, 'some store keys it subscribed to changed');
      return this.log(false);
    }

    log = process.env.NODE_ENV === 'production' ?
      (x => x) :
      ((shouldRender, reason) => {
        if (DEBUG && shouldRender) {
          console.info(`${displayName} rerendered because ${reason}.`);
        }
        return shouldRender;
      });

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
