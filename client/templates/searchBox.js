
Template.searchBox.onCreated(
	function() {
		// session does not survive page reload?!?
		if (Session.get('productFilters/forSaleOnDate') != null) {
			$('#searchBoxDate').val(Session.get('productFilters/forSaleOnDate'));
		}
		if (Session.get('productFilters/location') != null) {
			// can't use resolved lat/long! need to store original location search string too
			$('#searchBoxLocation').val(Session.get('productFilters/location'));
		}
	}
);


Template.searchBox.onRendered(
	function() {
	  $('#searchBoxDate').datepicker();

		GoogleMaps.load();

		Meteor.setTimeout(function() {
			/*
		  $("#searchBox").autocomplete({
		    minLength: 3
		  }, {
		    source: function(request, response) {
		      console.log("search term " + request.term);
		      return Meteor.call("searchProducts", request.term, function(error, result) {
		        if (error) {
		          console.log(error);
		        }
		        if (result) {
		          return response(result);
		        }
		      });
		    }
		  }).data("ui-autocomplete")._renderItem = function(ul, item) {
		    var listItemHtml;
		    listItemHtml = "<a href=\"/product/" + item.id + "\"> " + item.value + "\n  <span class=\"search-item-price\">\n    $" + item.price + "\n  </span>\n</a>";
				//listItemHtml = '<a href="'+ReactionRouter.pathFor('/product/', item.id)+'"> ' + item.value + '\n	<span class="search-item-price">\n		$' + item.price + '\n	</span>\n</a>';
		    return $("<li>").html(listItemHtml).appendTo(ul);
		  }; */

			/*
		  return $("#searchBoxDate").autocomplete({
		    minLength: 8,
		    source: function(request, response) {
					let filterDate = new Date(request.term);
		      console.log("search date new: ",filterDate," old: ",Session.get('productFilters/forSaleOnDate'));
					Session.set('productFilters/forSaleOnDate', filterDate);
		      return Meteor.call("searchProductsByDate", request.term, function(error, result) {
		        if (error) {
		          console.log(error);
		        }
		        if (result) {
		          return response(result);
		        }
		      });
		    }
		  }).data("ui-autocomplete")._renderItem = function(ul, item) {
		    var listItemHtml;
//		    listItemHtml = '<a href="/product/' + item.id + '"> ' + item.value + '\n	<span class="search-item-price">\n		$' + item.price + '\n	</span>\n</a>';
				listItemHtml = '<a href="'+ReactionRouter.pathFor('product', item.id)+'"> ' + item.value + '\n	<span class="search-item-price">\n		$' + item.price + '\n	</span>\n</a>';
		    return $("<li>").html(listItemHtml).appendTo(ul);
		  };
			/*/

		}, 1000);
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

Template.searchBox.events(
	{
			"change #searchBoxDate": function(event) {
				const value = event.target.value;
				let filterDate = new Date(value);
				if (filterDate.toString() == "Invalid Date") {
					filterDate = null;
				}
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
				const inputAddress = event.target.value;

				if (inputAddress == null || inputAddress.trim() == "") {
					Session.set('productFilters/location', null);
				}
				else {
					let addressString = inputAddress+", Switzerland";

					if (GoogleMaps.loaded()) {
						var geocoder = new google.maps.Geocoder();

		        geocoder.geocode(
		          {
		            'address': addressString
		          },
		          function(results, status) {
		             if(status == google.maps.GeocoderStatus.OK) {
		                let location = results[0].geometry.location;
										//console.log("resolved search : ",results);
		                console.log("resolved search : "+location.lat()+"/"+location.lng());

										// show this as autocomplete: results[0].formatted_address
										console.log("nearest hit: ",results[0].formatted_address);

										let filterLocation = location.lat()+"/"+location.lng();
										console.log("search location new: ",filterLocation," old: ",Session.get('productFilters/location'));
										Session.set('productFilters/location', filterLocation);
		              }
									else {
										Session.set('productFilters/location', null);
									}
		          }
		        );
			    }
				}
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
