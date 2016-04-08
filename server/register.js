ReactionCore.registerPackage({
  label: "Marketplace Search",
  name: "reaction-search",
  icon: "fa fa-search",
  autoEnable: true,
  registry: [
    {
      route: "/products/:date/:location",
      name: "productsSearchPage",
      template: "products",
      workflow: "coreProductWorkflow"
    },
  ],
});
