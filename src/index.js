/* global console */
import raf from 'raf';
import ReactDOM from 'react-dom';
export Root from './Root';
export {default as connect, enableRenderLogging} from './connect';

let DEBUG = false;

export function enableActionsLogging(enabled = true) {
  DEBUG = enabled;
}

const subscribers = new Set();

function getSingleKey(store, key, defaultValue) {
  if (!store) return null;
  // TODO: fix hack for Immutable
  const val = store.get ? store.get(key) : store[key];
  return (val !== undefined && val !== null) ? val : defaultValue;
}

function getKey(store, key, defaultValue) {
  if (!key || key === '') return store;
  const val = key.split('.').reduce((data, bit) => getSingleKey(data, bit), store);
  return (val !== undefined && val !== null) ? val : defaultValue;
}

let request;

function notify(state, prevStore) {
  request = null;
  subscribers.forEach(subscriber => {
    const keys = Array.from(subscriber.__keys);
    if (keys.some(key =>
      getKey(state.store, key) !== getKey(prevStore, key))) {
      if (typeof subscriber === 'function') {
        subscriber(getKey(state.store, keys[0]));
      } else if (typeof document !== 'undefined') {
        // Workaround for React issue #3620
        subscriber.needsUpdate = true;
        subscriber.forceUpdate();
      }
    }
  });
}

function update(state, data) {
  const prevStore = state.store;
  state.store = data;
  if (typeof window === 'undefined') {
    notify(state, prevStore);
  } else if (!request) {
    request = raf(() => {
      if (ReactDOM.unstable_batchedUpdates) {
        ReactDOM.unstable_batchedUpdates(() => {
          notify(state, prevStore);
        });
      } else {
        notify(state, prevStore);
      }
    });
  }
}

const syncActionsStack = [];

export function bindActions(actions, state) {
  const boundActions = {};
  Object.keys(actions).forEach(function(k) {
    const action = actions[k];
    boundActions[k] = function(...args) {

      if (process.env.NODE_ENV !== 'production') {
        syncActionsStack.unshift({caller: k, callees: []});
        DEBUG && console.info(`Action ${k}`, ...args);
      }

      const newStore = action(state.get, boundActions, ...args);

      if (process.env.NODE_ENV !== 'production') {
        const call = syncActionsStack.shift();
        if (newStore && call.callees.length) {
          console.warn(`Action ${call.caller} called ${call.callees.join(', ')} synchronously, which modified the store, then modified the store itself, potentially overriding the changes. Try to split up actions that call other actions and actions that modify the store.`);
        }
      }

      if (newStore) {
        if (process.env.NODE_ENV !== 'production') {
          if (syncActionsStack.length) {
            syncActionsStack[syncActionsStack.length - 1].callees.push(k);
          }
        }
        update(state, newStore);
      }

      return newStore !== undefined ? newStore : state.store;
    };
  });
  return boundActions;
}

export function createStore(store = {}, actions = {}) {
  const state = {store};

  function get(key, defaultValue, listener) {
    if (!listener && typeof defaultValue === 'function') {
      listener = defaultValue;
      defaultValue = undefined;
    }
    if (key && key !== '' && listener) {
      listener.__keys || (listener.__keys = new Set());
      listener.__keys.add(key);
      subscribers.add(listener);
    }
    return getKey(state.store, key, defaultValue);
  }

  get.unsubscribe = listener => {
    subscribers.delete(listener);
  };

  state.get = get;

  return {get, actions: bindActions(actions, state)};
}
