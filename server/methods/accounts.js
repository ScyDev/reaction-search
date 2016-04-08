
ReactionCore.Hooks.Events.add(
  "onCreateUser",
  function(user, options) {
    ReactionCore.Log.info("ReactionCore.Hooks.Events -> onCreateUser options: "+options);
    const shop = ReactionCore.getCurrentShop();
    const shopId = shop._id;

    ReactionCore.Log.info("Adding products search page permissions.");

    user.roles[shopId].push("productsSearchPage");

    return user;
  }
);
