
Template.searchBoxMarketplace.replaces("searchBox");

const redrawSwitches = () => {
  const switches = Array.prototype.slice.call(document.querySelectorAll(".js-switch:not([data-switchery='true'])"));
  switches.forEach(html => new Switchery(html, { size: "small" }));
}

Template.searchBox.onCreated(function() {
  // console.log("searchBox", this.data);
  /* Copy 'data' content into own context as data is not immediately available after route change */
  this.filtersAccessor = this.data.filtersAccessor;
  this.filters = this.data.filters;
});

Template.searchBox.onRendered(function() {
  const filtersAccessor = this.filtersAccessor;
  $.fn.datepicker.dates["de"] = {
    days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    daysShort: ["Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam"],
    daysMin: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    monthsShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    today: "Heute",
    monthsTitle: "Monate",
    clear: "Löschen",
    weekStart: 1,
    format: "dd.mm.yyyy"
  };

  const searchBoxDate = $("#searchBoxDate");
  searchBoxDate.datepicker({
    format: "dd.mm.yyyy",
    language: "de",
    autoclose: true,
  });

  /* Restore filter values in the search fields */
  $("#searchBoxData").val(Session.get(`${filtersAccessor}/filters/forSaleOnDate`));
  $("#searchBoxTitle").val(Session.get(`${filtersAccessor}/filters/query`));

  // session does not survive page reload?!?
  const forSaleOnDate = Session.get(`${filtersAccessor}/filters/forSaleOnDate`);
  if (forSaleOnDate && searchBoxDate.val() == "") searchBoxDate.val(forSaleOnDate);

  // can"t use resolved lat/long! need to store original location search string too
  const locationUserInput = Session.get(`${filtersAccessor}/filters/locationUserInput`);
  const searchBoxLocation = $("#searchBoxLocation");
  if (locationUserInput && searchBoxLocation.val() == "") searchBoxLocation.val(locationUserInput);

  // search params from route
  if (ReactionRouter.current().route.name === "productsSearchPage") {
    const searchDate = ReactionRouter.getParam("date");
    const searchLocation = ReactionRouter.getParam("location");

    console.log(searchDate, searchLocation, ReactionRouter.current().route);

    if (searchDate) {
      searchBoxDate.val(searchDate);
      searchBoxDate.trigger("change");
    }

    if (searchLocation) {
      const mapsLoadedCheckInterval = Meteor.setInterval(() => {
        if (GoogleMaps.loaded()) {
          Meteor.clearInterval(mapsLoadedCheckInterval);
          searchBoxLocation.val(searchLocation);
          searchBoxLocation.trigger("change");
        }
      }, 200);
    }
  }

  redrawSwitches();

  GoogleMaps.load({ key: getGoogleMapsApiKey() });
});

Template.searchBox.helpers({
  mealFilterSwitchStatus: filter => {
    const toggleStates = Session.get(`${Template.instance().filtersAccessor}/filters/mealTime`);
    return toggleStates && toggleStates[filter] ? "checked" : "";
  },

  tags: () => {
    const tags = ReactionCore.Collections.Tags.find().fetch();
    tags.push({
      _id: null,
      name: "noTag",
      slug: "noTag",
    });
    return tags;
  },

  showTag: tag => {
    const tags = Session.get(`${Template.instance().filtersAccessor}/filters/tags`);
    return tags && tags.indexOf(tag) > -1 ? "checked" : "";
  },

  i18TagsPath: name => `tags.${name}`,

  showFilter: filter => {
    const show = Template.instance().filters[filter];
    return typeof show !== "undefined" ? show : true;
  },
});

let geocoderTimeout = null;

Template.searchBox.events({
  "change #searchBoxDate": function(event) {
    const filterDate = event.target.value;
    Session.set(`${Template.instance().filtersAccessor}/filters/forSaleOnDate`, filterDate);
  },
  "keyup #searchBoxDate": function(event) {
    return $("#searchBoxDate").trigger("change", event);
  },
  "click #searchBoxDateClear": function(event) {
    $("#searchBoxDate").val("");
    return $("#searchBoxDate").trigger("change", event);
  },
  "change #searchBoxTitle": function(event) {
    const value = event.target.value;
    Session.set(`${Template.instance().filtersAccessor}/filters/query`, value);
  },
  "keyup #searchBoxTitle": function(event) {
    return $("#searchBoxTitle").trigger("change", event);
  },
  "click #searchBoxTitleClear": function(event) {
    $("#searchBoxTitle").val("");
    return $("#searchBoxTitle").trigger("change", event);
  },
  "change #searchBoxMealLunch,#searchBoxMealDinner": () =>
    Session.set(`${Template.instance().filtersAccessor}/filters/mealTime`, {
      showLunch: $("#searchBoxMealLunch").prop("checked"),
      showDinner: $("#searchBoxMealDinner").prop("checked"),
    }),
  "change .searchBoxTag": (event) => {
    const checked = event.target.checked;
    const tag = event.target.attributes["data-tag"] ? event.target.attributes["data-tag"].value : null;
    const tags = Session.get(`${Template.instance().filtersAccessor}/filters/tags`) || [];
    if( checked ) tags.push(tag);
    else {
      const idx = tags.indexOf(tag);
      if (idx > -1) tags.splice(idx, 1);
    }
    Session.set(`${Template.instance().filtersAccessor}/filters/tags`, tags);
  },
  "change #searchBoxLocation": function(event) {
    const filtersAccessor = Template.instance().filtersAccessor;

    if (geocoderTimeout != null) Meteor.clearTimeout(geocoderTimeout);

    geocoderTimeout = Meteor.setTimeout(function() {
      const inputAddress = event.target.value;

      if (inputAddress == null || inputAddress.trim() == "") {
        Session.set(`${filtersAccessor}/filters/location`, null);
        Session.set(`${filtersAccessor}/filters/locationUserInput`, null);
        $("#geocoderResultContainer").hide();
      }
      else {
        let addressString = inputAddress.trim();//+", Switzerland";

        // trying to prevent errors with postal codes like 6000, 3000, ...
        // https://productforums.google.com/forum/#!topic/maps-de/KkEJwzrJNiQ
        if (addressString == "6000") addressString = "Luzern";
        else if (addressString == "3000") addressString = "Bern";
        else if (addressString == "4000") addressString = "Basel";

        if (GoogleMaps.loaded()) {
          const geocoder = new google.maps.Geocoder();

          geocoder.geocode(
            {
              "address": addressString,
              "language": "de",
              //"result_type": "street_address|locality" // not available on client geocode API
              componentRestrictions: {
                country: "CH",
                //postalCode: "2000"
              }
            },
            function(results, status) {
               if(status == google.maps.GeocoderStatus.OK) {
                  let location = results[0].geometry.location;
                  console.log("resolved search : "+location.lat()+"/"+location.lng()+" results: ",results);

                  // seems not to be needed since we restrict the result to switzerland only
                  //if (1 == 1) {
                  /*if (results[0].types[0] == "postal_code"
                      || results[0].types[0] == "locality"
                      || results[0].types[0] == "street_address"
                      || results[0].types[0] == "colloquial_area"
                      || results[0].types[0] == "sublocality_level_1"
                      || results[0].types[0] == "sublocality_level_2") {*/
                    // show this as autocomplete: results[0].formatted_address
                  console.log("nearest hit: ",results[0].formatted_address);

                  let filterLocation = location.lat()+"/"+location.lng();
                  console.log("search location new:", filterLocation, "old:", Session.get(`${filtersAccessor}/filters/location`));
                  Session.set(`${filtersAccessor}/filters/location`, filterLocation);
                  Session.set(`${filtersAccessor}/filters/locationUserInput`, inputAddress);

                  if (inputAddress != null && inputAddress != "" && results[0].formatted_address != "Switzerland") {
                    $("#geocoderResult").html(results[0].formatted_address.replace(", Switzerland", ""));
                    $("#geocoderResultContainer").show();
                  } else {
                    $("#geocoderResult").html(i18next.t("products.noLocationFound", {defaultValue: "No location found"}));
                    //$("#geocoderResultContainer").hide();
                  }
                } else {
                  console.log("geocoder fail: ",results," ",status);

                  Session.set(`${filtersAccessor}/filters/location`, "9999999999999999,99999999999999999");
                  Session.set(`${filtersAccessor}/filters/locationUserInput`, null);

                  $("#geocoderResult").html(i18next.t("products.noLocationFound", {defaultValue: "No location found"}));
                  //$("#geocoderResultContainer").hide();
                }
            }
          );
        }
      }
    }, 500);
  },
  "keyup #searchBoxLocation": function(event) {
    return $("#searchBoxLocation").trigger("change", event);
  },
  "click #searchBoxLocationClear": function(event) {
    $("#searchBoxLocation").val("");
    return $("#searchBoxLocation").trigger("change", event);
  },
});
