Template.searchBox.onRendered(
	function() {
		Meteor.setTimeout(function() {
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
		    return $("<li>").html(listItemHtml).appendTo(ul);
		  };
		  $('#searchBoxDate').datepicker();
		  return $("#searchBoxDate").autocomplete({
		    minLength: 8,
		    source: function(request, response) {
		      console.log("search date " + new Date(request.term));
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
		    listItemHtml = "<a href=\"/product/" + item.id + "\"> " + item.value + "\n	<span class=\"search-item-price\">\n		$" + item.price + "\n	</span>\n</a>";
		    return $("<li>").html(listItemHtml).appendTo(ul);
		  };
		}, 1000);
	}
);

// ---
// generated by coffee-script 1.9.2