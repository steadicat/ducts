# Ducts

An even more minimal implementation of Flux than Redux.

Ducts borrows the best ideas from Redux, but reduces boilerplate even further by doing away with the concept of action objects. Actions are just functions.

## Features

- **Store getter with autosubscribe**: components don't need to do anything to subscribe to the stores other than read from it inside of `render()`. Reads are done using a single `get` function which takes a path as its only argument. E.g. `get('users.123.fullName')`.
- **Selective rerender**: when the data changes, only the components affected rerender.
- **requestAnimationFrame batching**: all store updates are batched together and executed in the next frame for extra performance.
- **Easy async**: actions can perform async operations and call other actions when they're done.
- **Universal/isomorphic**: just like with Redux, there is no global state. Server-side isolation, server-side rendering and client-side rendering with server-sent data are easy.

## Simple example

```js
import {createStore, Root, connect} from 'ducts';

/* Actions */

function init(store={}, actions) {
  return {counter: 0};
}

function incrementCounter(get, actions) {
  return {...get(), {counter: get('counter') + 1}};
}

/* Components */

@connect
class MyApp {
  render() {
    const {get, actions} = this.props;
    <div>
      <div>
        Counter: {get('counter')}
      </div>
      <button onClick={actions.incrementCounter}>
        Increment
      </button>
    </div>
  }
}

/* Glue */

// Normally this would look something like `import * from './actions';`
const actions = {init, incrementCounter};

// A store is just a piece of data. createStore simply
// gives you functions to read from it and write to it.
const {get, actions: boundActions} = createStore(initialData, actions);

const root =
  <Root get={get} actions={boundActions}>
    {() => <MyApp />}
  </Root>;

React.render(root, document);
// Or
React.renderToString(root);

```

## Async actions

Actions have access to all other actions. They can call them whenever they feel like, even asynchronously. For example:

```js
function loadRequested(get, actions, id) {
  api.fetch(id, actions.loadDone);
  return {...get(), {loading: true}};
}

function loadDone(get, actions, result) {
  return {...get(), {loading: false, result}};
}
```

The only pitfall with async actions is storing the result of a `get()` call in a local variable before calling other actions synchronously. The locally stored data can potentially override any changes that were done to the store by the other actions.

To avoid this, either:

 - Make sure to always read the latest value of the store with `get()` before making any changes to it.
 - Make sure any calls to actions that modify the store are asynchronous. You can use `setTimeout(actions.mySynchronousAction, 0)` if necessary.

## Isomorphic/universal apps

The code to initialize the app on the server and on the client is very similar.

```js

import {createStore, Root} from 'ducts';
import * from './actions';


/* On the server */

const {get, actions} = createStore({}, actions);

// I like to use an action to populate the initial data.
// This is a good place to pass in the request path.
actions.init();

const root =
  <Root get={get} actions={actions}>
    {() => <MyApp />}
  </Root>;

React.renderToString(root);


/* On the client */

// Recreate the store using all the data from the server-side store
// (use `get()` and inline it in your page as JSON).
const {get, actions} = createStore(serverSentData, actions);

// Optional: client-only initialization
actions.initClient();

const root =
  <Root get={get} actions={actions}>
    {() => <MyApp />}
  </Root>;

React.render(root, document);
```

## API

_Coming soon._
