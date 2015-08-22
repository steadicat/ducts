/* global console */
import raf from 'raf';
export Root from './Root';
export connect from './connect';

const subscribers = new Set();

function getSingleKey(store, key) {
  if (!store) return null;
  // TODO: fix hack for Immutable
  return store.get ? store.get(key) : store[key];
}

function getKey(store, key) {
  if (key === '') return store;
  return key.split('.').reduce((data, bit) => getSingleKey(data, bit), store);
}

let request;

function notify(state, prevStore) {
  request = null;
  subscribers.forEach((subscriber) => {
    let keys = Array.from(subscriber.keys);
    if (keys.some((key) => getKey(state.store, key) !== getKey(prevStore, key))) {
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
  if (!data) console.warn('Some action forgot to return the new store!');
  const prevStore = state.store;
  state.store = data;
  if (!request) {
    request = raf(notify.bind(null, state, prevStore));
  }
}

export function bindActions(actions, state) {
  const boundActions = {};
  Object.keys(actions).forEach(function(k) {
    const action = actions[k];
    boundActions[k] = function(...args) {
      const newStore = action(state.store, boundActions, ...args);
      if (!newStore) {
        return state.store;
      }
      update(state, newStore);
      return newStore;
    };
  });
  return boundActions;
}

export function createStore(store={}, actions={}) {
  const state = {store};
  function get(key, listener) {
    if (listener === undefined) throw new Error('First argument of get() should be a listener component or function');
    if (key !== '') {
      listener.keys || (listener.keys = new Set());
      listener.keys.add(key);
      subscribers.add(listener);
    }
    return getKey(state.store, key);
  };
  return {get, actions: bindActions(actions, state)};
}
