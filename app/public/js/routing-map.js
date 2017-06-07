define([
    "require",
    "dojo/_base/lang",
    "dojo/_base/config",
    "./config/custom_routes"
], function (
    require,
    lang,
    config,
    customRoutes
) {
    var p = config['routing-map'].pathPrefix,
        l = config['routing-map'].layers || {},
        mid = require.toAbsMid
    ;
    p = ''+p.slice(-1) !== '/' ? p+'/' : p;

    var defaultRoutes = {
        login: {
            schema: p + '',
            widget: mid('./ui/login/LoginPage'),
            layers: l.login || []
        },
        logout: {
            schema: p + 'logout',
            widget: mid('./ui/login/LogoutPage'),
            layers: l.logout || []
        },
        home: {
            schema: p + 'home',
            widget: mid('./ui/home/HomePage'),
            layers: l.home || []
        },
        entityList: {
            schema: p + 'data/:type',
            widget: mid('./ui/data/EntityListPage'),
            layers: l.data || []
        },
        entity: {
            schema: p + 'data/:type/:id',
            widget: mid('./ui/data/EntityPage'),
            layers: l.data || []
        },
        search: {
            schema: p + 'search',
            widget: mid('./ui/search/SearchResultPage'),
            layers: l.data || []
        },
        media: {
            schema: p + 'media',
            widget: mid('./ui/media/BrowsePage'),
            layers: l.data || []
        },
        link: {
            schema: p + 'link',
            widget: mid('./ui/link/BrowsePage'),
            layers: l.data || []
        },
        settings: {
            schema: p + 'settings',
            widget: mid('./ui/settings/SettingsPage'),
            layers: l.admin || []
        },
        admin: {
            schema: p + 'admin',
            widget: mid('./ui/admin/AdminPage'),
            layers: l.admin || []
        },
        lockList: {
            schema: p + 'admin/Lock',
            widget: mid('./ui/admin/LockListPage'),
            layers: l.admin || []
        },
        lock: {
            schema: p + 'admin/Lock/:id',
            widget: mid('./ui/admin/LockPage'),
            layers: l.admin || []
        },
        permissionList: {
            schema: p + 'admin/Permission',
            widget: mid('./ui/admin/PermissionListPage'),
            layers: l.admin || []
        },
        permission: {
            schema: p + 'admin/Permission/:id',
            widget: mid('./ui/admin/PermissionPage'),
            layers: l.admin || []
        },
        principalList: {
            schema: p + 'admin/:type',
            widget: mid('./ui/admin/PrincipalListPage'),
            layers: l.admin || []
        },
        principal: {
            schema: p + 'admin/:type/:id',
            widget: mid('./ui/admin/PrincipalPage'),
            layers: l.admin || []
        }
    };

    // merge custom routers
    return lang.mixin(defaultRoutes, customRoutes);
});