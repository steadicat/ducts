/* global console */
import raf from 'raf';
export Root from './Root';
export connect from './connect';

const subscribers = new Set();

function getSingleKey(store, key, defaultValue) {
  if (!store) return null;
  // TODO: fix hack for Immutable
  const val = store.get ? store.get(key) : store[key];
  return val !== undefined ? val : defaultValue;
}

function getKey(store, key, defaultValue) {
  if (!key || key === '') return store;
  const val = key.split('.').reduce((data, bit) => getSingleKey(data, bit), store);
  return val !== undefined ? val : defaultValue;
}

let request;

function notify(state, prevStore) {
  request = null;
  subscribers.forEach((subscriber) => {
    const keys = Array.from(subscriber.__keys);
    if (keys.some(key =>
      getKey(state.store, key) !== getKey(prevStore, key))) {
      if (typeof subscriber === 'function') {
        subscriber(getKey(state.store, keys[0]));
      } else {
        // Workaround for React issue #3620
        if (typeof document !== 'undefined') {
          subscriber.needsUpdate = true;
          subscriber.forceUpdate();
        }
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
    request = raf(notify.bind(null, state, prevStore));
  }
}

const syncActionsStack = [];

export function bindActions(actions, state) {
  const boundActions = {};
  Object.keys(actions).forEach(function(k) {
    const action = actions[k];
    boundActions[k] = function(...args) {
      syncActionsStack.unshift(k);
      const newStore = action(state.get, boundActions, ...args);
      syncActionsStack.shift();

      if (!newStore) {
        // No-op
      } else {
        if (process.env.NODE_ENV !== 'production') {
          syncActionsStack.length && console.warn(`Action ${syncActionsStack[0]} called ${k} synchronously, and ${k} modified the store. Make sure there are no local variables storing stale results of get() calls before the call to ${k}.`);
        }
        update(state, newStore);
      }

      return newStore !== undefined ? newStore : state.store;
    };
  });
  return boundActions;
}

export function createStore(store={}, actions={}) {
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

  get.unsubscribe = (listener) => {
    subscribers.delete(listener);
  };

  state.get = get;

  return {get, actions: bindActions(actions, state)};
}
