
Template.searchBox.onCreated(
	function() {

	}
);


Template.searchBox.onRendered(
	function() {
		$.fn.datepicker.dates['de'] = {
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

	  $('#searchBoxDate').datepicker({
			format: "dd.mm.yyyy",
			language: "de",
			autoclose: true
		});

		// session does not survive page reload?!?
		if (Session.get('productFilters/forSaleOnDate') != null && $('#searchBoxDate').val() == "") {
			console.log("setting #searchBoxDate val from session: "+Session.get('productFilters/forSaleOnDate'));
			$('#searchBoxDate').val(Session.get('productFilters/forSaleOnDate'));
		}
		//console.log("wanna set #searchBoxLocation val from session: "+Session.get('productFilters/locationUserInput')+" "+Session.get('productFilters/location'));
		if (Session.get('productFilters/locationUserInput') != null && $('#searchBoxLocation').val() == "") {
			// can't use resolved lat/long! need to store original location search string too
			console.log("setting #searchBoxLocation val from session: "+Session.get('productFilters/locationUserInput'));
			$('#searchBoxLocation').val(Session.get('productFilters/locationUserInput'));
		}

		// search params from route
		if (ReactionRouter.current().route.name == "productsSearchPage") {
			let searchDate = ReactionRouter.getParam("date");
			let searchLocation = ReactionRouter.getParam("location");

			console.log(searchDate+" "+searchLocation+" ",ReactionRouter.current().route);

			if (searchDate != null) {
				$('#searchBoxDate').val(searchDate);
				$('#searchBoxDate').trigger("change");
			}

			if (searchLocation != null) {
				let mapsLoadedCheckInterval = Meteor.setInterval(function() {
					console.log("checking if GoogleMaps loaded...");
					if (GoogleMaps.loaded()) {
						Meteor.clearInterval(mapsLoadedCheckInterval);
						console.log("cleared mapsLoadedCheckInterval");

						$('#searchBoxLocation').val(searchLocation);
						$('#searchBoxLocation').trigger("change");
					}
				}, 200);
			}
		}

		GoogleMaps.load();

	}
);

Template.searchBox.helpers(
	{
		'session': function(input) {
			console.log("session helper ",input);
    	return Session.get(input);
		}
	}
);

let geocoderTimeout = null;

Template.searchBox.events(
	{
			"change #searchBoxDate": function(event) {
				const value = event.target.value;
				let filterDate = value;
				console.log("search date new: ",filterDate," old: ",Session.get('productFilters/forSaleOnDate'));
				Session.set('productFilters/forSaleOnDate', filterDate);
			},
			"keyup #searchBoxDate": function(event) {
				console.log("keyup #searchBoxDate ",event.target.value);
				return $("#searchBoxDate").trigger("change", event);
			},
			"click #searchBoxDateClear": function(event) {
				console.log("click #searchBoxDateClear ");
				$("#searchBoxDate").val("");
				return $("#searchBoxDate").trigger("change", event);
			},
			"change #searchBoxLocation": function(event) {
				if (geocoderTimeout != null) {
					console.log("clearing geocoderTimeout");
					Meteor.clearTimeout(geocoderTimeout);
				}

				console.log("adding geocoderTimeout");
				geocoderTimeout = Meteor.setTimeout(function() {
					console.log("executing geocoderTimeout");

					const inputAddress = event.target.value;

					if (inputAddress == null || inputAddress.trim() == "") {
						Session.set('productFilters/location', null);
						Session.set('productFilters/locationUserInput', null);
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
							var geocoder = new google.maps.Geocoder();

			        geocoder.geocode(
			          {
			            'address': addressString,
									'language': 'de',
									//'result_type': 'street_address|locality' // not available on client geocode API
									componentRestrictions: {
							      country: 'CH',
							      //postalCode: '2000'
							    }
								},
			          function(results, status) {
			             if(status == google.maps.GeocoderStatus.OK) {
			                let location = results[0].geometry.location;
											//console.log("resolved search : ",results);
			                console.log("resolved search : "+location.lat()+"/"+location.lng()+" results: ",results);
											let properLocationFound = false;

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
											console.log("search location new: ",filterLocation," old: ",Session.get('productFilters/location'));
											Session.set('productFilters/location', filterLocation);
											Session.set('productFilters/locationUserInput', inputAddress);

											properLocationFound = true;
											//}

											if (properLocationFound && inputAddress != null && inputAddress != "" && results[0].formatted_address != "Switzerland") {
												$("#geocoderResult").html(results[0].formatted_address.replace(", Switzerland", ""));
												$("#geocoderResultContainer").show();
											}
											else {
												$("#geocoderResult").html(i18next.t("products.noLocationFound", {defaultValue: "No location found"}));
												//$("#geocoderResultContainer").hide();
											}
			              }
										else {
											console.log("geocoder fail: ",results," ",status);

											Session.set('productFilters/location', "9999999999999999,99999999999999999");
											Session.set('productFilters/locationUserInput', null);

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
				const inputAddress = event.target.value;
				console.log("keyup #searchBoxLocation ",event.target.value);
				return $("#searchBoxLocation").trigger("change", event);
			},
			"click #searchBoxLocationClear": function(event) {
				console.log("click #searchBoxLocationClear ");
				$("#searchBoxLocation").val("");
				return $("#searchBoxLocation").trigger("change", event);
			},
	}
);

// ---
// generated by coffee-script 1.9.2
