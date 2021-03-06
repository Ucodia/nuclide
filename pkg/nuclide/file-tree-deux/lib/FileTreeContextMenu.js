'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var {EVENT_HANDLER_SELECTOR} = require('./FileTreeConstants');
var {isFullyQualifiedLocalPath} = require('./FileTreeHelpers');
var FileTreeStore = require('./FileTreeStore');

type MenuItemSingle = {
  label: string;
  command: string;
  shouldDisplay: ?() => boolean;
};

type MenuItemGroup = {
  label: string;
  submenu: Array<MenuItemDefinition>;
  shouldDisplay: ?() => boolean;
};

type MenuItemSeparator = {
  type: string;
};

type MenuItemDefinition = MenuItemSingle | MenuItemGroup | MenuItemSeparator;

var instance: ?Object;

class FileTreeContextMenu {
  _store: FileTreeStore;

  constructor() {
    this._store = FileTreeStore.getInstance();
    this._addContextMenuItemGroup([
      {
        label: 'New',
        submenu: [
          {
            label: 'File',
            command: 'nuclide-file-tree-deux:add-file',
          },
          {
            label: 'Folder',
            command: 'nuclide-file-tree-deux:add-folder',
          },
        ],
      },
    ]);
    this._addContextMenuItemGroup([
      {
        label: 'Add Project Folder',
        command: 'application:add-project-folder',
      },
      {
        label: 'Add Remote Project Folder',
        command: 'nuclide-remote-projects:connect',
      },
      {
        label: 'Remove Project Folder',
        command: 'nuclide-file-tree-deux:remove-project-folder-selection',
        shouldDisplay: () => {
          var node = this._store.getSingleSelectedNode();
          return node != null && node.isRoot;
        },
      },
    ]);
    this._addContextMenuItemGroup([
      {
        label: 'Rename',
        command: 'nuclide-file-tree-deux:rename-selection',
        shouldDisplay: () => {
          var node = this._store.getSingleSelectedNode();
          // For now, rename does not apply to root nodes.
          return node != null && !node.isRoot;
        },
      },
      {
        label: 'Duplicate',
        command: 'nuclide-file-tree-deux:duplicate-selection',
        shouldDisplay: () => {
          var node = this._store.getSingleSelectedNode();
          return node != null && !node.isContainer;
        },
      },
      {
        label: 'Delete',
        command: 'nuclide-file-tree-deux:delete-selection',
        shouldDisplay: () => {
          var nodes = this._store.getSelectedNodes();
          // We can delete multiple nodes as long as no root node is selected
          return nodes.length > 0 && nodes.every(node => !node.isRoot);
        },
      },
    ]);
    this._addContextMenuItemGroup([
      {
        label: 'Copy Full Path',
        command: 'nuclide-file-tree-deux:copy-full-path',
        shouldDisplay: () => {
          var node = this._store.getSingleSelectedNode();
          return node != null;
        },
      },
      {
        label: 'Show in Finder', // Mac OS X
        command: 'nuclide-file-tree-deux:show-in-file-manager',
        shouldDisplay: this._shouldDisplayShowInFileManager.bind(this, 'darwin'),
      },
      {
        label: 'Show in Explorer', // Windows
        command: 'nuclide-file-tree-deux:show-in-file-manager',
        shouldDisplay: this._shouldDisplayShowInFileManager.bind(this, 'win32'),
      },
      {
        label: 'Show in File Manager', // Linux
        command: 'nuclide-file-tree-deux:show-in-file-manager',
        shouldDisplay: this._shouldDisplayShowInFileManager.bind(this, 'linux'),
      },
      {
        label: 'Search in Directory',
        command: 'nuclide-file-tree-deux:search-in-directory',
        shouldDisplay: () => {
          var nodes = this._store.getSelectedNodes();
          return nodes.length > 0 && nodes.every(node => node.isContainer);
        },
      },
    ]);
  }

  _addContextMenuItemGroup(menuItems: Array<MenuItemDefinition>): void {
    // Atom is smart about only displaying a separator when there are items to
    // separate, so there will never be a dangling separator at the end.
    menuItems = menuItems.concat([{type: 'separator'}]);
    // TODO: Use a computed property when supported by Flow.
    var contextMenu = {};
    contextMenu[EVENT_HANDLER_SELECTOR] = menuItems;
    atom.contextMenu.add(contextMenu);
  }

  /**
   * @return A {boolean} whether the "Show in File Manager" context menu item should be displayed
   * for the current selection and the given `platform`.
   */
  _shouldDisplayShowInFileManager(platform: string): boolean {
    var node = this._store.getSingleSelectedNode();
    return (
      node != null &&
      isFullyQualifiedLocalPath(node.nodePath) &&
      process.platform === platform
    );
  }

  static initialize(): FileTreeContextMenu {
    // Ensure only one instance is ever created. This is important because if we call
    // `atom.contextMenu.add()` multiple times we will get duplicates globally.
    if (!instance) {
      instance = new FileTreeContextMenu();
    }
    return instance;
  }
}

module.exports = FileTreeContextMenu;
