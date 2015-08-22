import React from 'react';

const DEBUG = false;

export default function connect(Component) {
  return class Connect extends React.Component {
    static displayName = `Connect(${Component.displayName})`;

    static contextTypes = {
      actions: React.PropTypes.objectOf(
        React.PropTypes.func,
      ),
      get: React.PropTypes.func,
    }

    shouldComponentUpdate(nextProps) {
      if (this.needsUpdate) {
        this.needsUpdate = false;
        return true;
      }
      return !propsEqual(this.props, nextProps, this.constructor.displayName);
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

function childrenEqual(a, b, displayName) {
  if (!a && !b) return true;
  if (a === b) return true;

  //const ac = React.Children.map(a, (child) => child);
  //const bc = React.Children.map(b, (child) => child);
  if (a.length !== b.length) {
    DEBUG && console.log(displayName, 'rerendering because number of children changed');
    return false;
  }
  for (let i = 0, l = a.length; i < l; i++) {
    if (a[i] === b[i]) continue;
    if (!propsEqual(a[i].props, b[i].props, displayName)) {
      DEBUG && console.log(displayName, 'rerendering because props on children changed');
      return false;
    }
  }
  return true;
}

function propsEqual(a, b, displayName) {
  if (a === b) return true;

  return Object.keys(Object.assign({}, a, b)).every((key) => {
    if (key === 'children') return true;
    if (typeof a[key] === 'function' && typeof b[key] === 'function') return true;
    if (b[key] !== a[key]) {
      DEBUG && console.log(displayName, 'rerendering because of', key);
      return false;
    }
    return true;
  }) && childrenEqual(a.children, b.children, displayName);
}
