'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {
  Provider,
  Store,
} from 'nuclide-quick-open-interfaces';

var {
  CompositeDisposable,
  Disposable,
} = require('atom');

var providerInstance: ?Provider;
function getProviderInstance(): Provider {
  if (providerInstance == null) {
    var OpenFileNameProvider = require('./OpenFileNameProvider');
    providerInstance = {...OpenFileNameProvider};
  }
  return providerInstance;
}

class Activation {
  _disposables: CompositeDisposable;
  _store: ?Store;

  constructor(state: ?Object) {
    this._disposables = new CompositeDisposable();
  }

  activate() {
    this._disposables.add(
      atom.commands.add('atom-workspace', {
        'nuclide-open-filenames-provider:toggle-provider': () => {
          if (this._store) {
            this._store.toggleProvider(getProviderInstance());
          }
        },
      })
    );
  }

  setStore(store: Store): void {
    this._store = store;
  }

  dispose() {
    this._store = null;
    this._disposables.dispose();
  }
}

var activation: ?Activation = null;
function getActivation() {
  if (activation == null) {
    activation = new Activation();
    activation.activate();
  }
  return activation;
}

module.exports = {

  registerProvider(): Provider {
    return getProviderInstance();
  },

  registerStore(store: Store): atom$Disposable {
    getActivation().setStore(store);
    return new Disposable(() => getActivation().dispose());
  },

  activate(state: ?Object) {
    getActivation();
  },

  deactivate() {
    if (activation) {
      activation.dispose();
      activation = null;
    }
  },
};
