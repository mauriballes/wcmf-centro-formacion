/**
 * Configuration for elFinder
 */
elfinderConfig = {
    cssClass: 'wcmfFinder',
    rememberLastDir: true,
    resizable: false,
    commands: ['*'],
    ui: ['toolbar'/*, 'places'*/, 'tree', 'path', 'stat'],
    uiOptions: {
        toolbar: [
          ['back', 'forward'], /*['netmount'],*/ ['reload'],/* ['home', 'up'],*/['mkdir', 'mkfile', 'upload'],
          ['open', 'download', 'getfile'], ['info', 'chmod'], ['quicklook'], ['copy', 'cut', 'paste'],
          ['rm'], ['duplicate', 'rename', 'edit', 'resize'], ['extract', 'archive'],
          ['search'], ['view', 'sort'], ['help']/*, ['fullscreen']*/
        ],
        tree: {
            openRootOnLoad: true,
            syncTree: true
        },
        navbar: {
            minWidth: 150,
            maxWidth: 500
        },
        cwd: {
            oldSchool: false
        }
    },
    contextmenu: {
        navbar: ['open', '|', 'copy', 'cut', 'paste', 'duplicate', '|', 'rm', '|', 'info'],
        cwd: ['reload', 'back', '|', 'upload', 'mkdir', 'mkfile', 'paste', '|', 'info'],
        files: [
            'getfile', '|', 'open', 'quicklook', '|', 'download', '|', 'copy', 'cut', 'paste', 'duplicate', '|',
            'rm', '|', 'edit', 'rename', 'resize', 'crop', '|', 'archive', 'extract', '|', 'info'
        ]
    }
};