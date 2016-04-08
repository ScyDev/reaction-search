Package.describe({
  name: 'scydev:reaction-search',
  version: '0.0.2',
  // Brief, one-line summary of the package.
  summary: 'Reaction Search - Search Feature For Your Reaction Shop.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function (api, where) {
  api.versionsFrom('1.2.1');

  // meteor base packages
  api.use("standard-minifiers");
  api.use("mobile-experience");
  api.use("meteor-base");
  api.use("mongo");
  api.use("blaze-html-templates");
  api.use("session");
  api.use("jquery");
  api.use("tracker");
  api.use("logging");
  api.use("reload");
  api.use("random");
  api.use("ejson");
  api.use("spacebars");
  api.use("check");

  api.use('ecmascript');
  api.use('templating');
  api.use("less");
  api.use("reactioncommerce:core@0.10.0");

  api.use("reactioncommerce:reaction-router");
  api.use("kadira:blaze-layout@2.3.0");

  api.use("scydev:reaction-p2p-marketplace-sell-date");
  api.use("rajit:bootstrap3-datepicker");

  api.addFiles([
    //"client/routing.js",
    "client/templates/searchBox.html",
    "client/templates/searchBox.less",
    "client/templates/searchBox.js"
  ], ["client"]);

  api.addFiles([
    "server/methods.js",
    "server/methods/accounts.js"
  ], ["server"]);

  api.addFiles([
    "server/register.js"
  ],["server"]);

});
