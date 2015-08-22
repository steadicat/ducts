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

let syncActionCallDepth = 0;
let actionCalledOtherActions = false;

export function bindActions(actions, state) {
  const boundActions = {};
  Object.keys(actions).forEach(function(k) {
    const action = actions[k];
    boundActions[k] = function(...args) {
      if (syncActionCallDepth) {
        console.warn(`Action ${k} was called by another action synchronously. Be careful as this action’s changes, if ignored, might be overridden by the return value of the parent action.`);
      }

      syncActionCallDepth++;
      const newStore = action(state.store, boundActions, ...args);
      syncActionCallDepth--;

      if (actionCalledOtherActions && newStore) {
        console.warn(`Action ${k} called another action synchronously and also returned a new store. This behavior is deprecated and might be removed in the future.`);
        update(state, newStore);
      } else if (actionCalledOtherActions) {
        // No-op!
      } else if (!newStore) {
        console.warn(`Action ${k} forgot to return the new store!`);
      } else {
        update(state, newStore);
      }

      actionCalledOtherActions = syncActionCallDepth > 0;

      return newStore !== undefined ? newStore : state.store;
    };
  });
  return boundActions;
}

export function createStore(store={}, actions={}) {
  const state = {store};

  function get(key, listener) {
    if (key !== '' && listener) {
      listener.__keys || (listener.__keys = new Set());
      listener.__keys.add(key);
      subscribers.add(listener);
    }
    return getKey(state.store, key);
  }

  get.unsubscribe = (listener) => {
    subscribers.delete(listener);
  };

  return {get, actions: bindActions(actions, state)};
}
