/* global console */
import raf from 'raf';
export Root from './Root';
export connect from './connect';

const subscribers = new Set();

function getKey(store, key) {
  if (key === '') return store;
  return key.split('.').reduce((data, bit) => data[bit], store);
}

let request;

function notify(state, prevStore) {
  request = null;
  subscribers.forEach((subscriber) => {
    let keys = Array.from(subscriber.keys);
    if (keys.some((key) => getKey(state.store, key) !== getKey(prevStore, key))) {
      subscriber.needsUpdate = true;
      subscriber.setState({});
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
      update(state, action(state.store, boundActions, ...args));
    };
  });
  return boundActions;
}

export function createStore(store={}, actions={}) {
  const state = {store};
  function get(el, key) {
    if (el === undefined) throw new Error('First argument of get() should be the caller component');
    el.keys || (el.keys = new Set());
    el.keys.add(key);
    subscribers.add(el);
    return getKey(state.store, key);
  };
  return {get, actions: bindActions(actions, state)};
}
