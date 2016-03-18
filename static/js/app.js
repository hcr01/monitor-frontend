// init some vars
// cach vars
var cache = {};
cache['list'] = [];
cache['details'] = {};
// init angular application
var app = angular.module('app', [
	'ngRoute'
]);
// create route provider
app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider
		.when('/list', {
			templateUrl: 'partials/list.html',
			controller: 'listCtrl'
		})
		.when('/hcr/:id/:operation', {
			templateUrl: 'partials/details.html',
			controller: 'detailsCtrl'
		})
		.otherwise({
			redirectTo: '/list'
		});
}]);
// create the list on /list
app.controller('listCtrl', function ($scope, $http) {
	$scope.loading = true;
	$scope.error = false;
	$scope.hcrs = [];
	if (cache['list'].length == 0) {
		$http.get(settings['api']['schema']['list'])
		.then(function successCallback (response) {
			$scope.hcrs = response.data;
			cache['list'] = response.data;
			$scope.loading = false;
		}, function errorCallback(response) {
			$scope.error = true;
			$scope.loading = false;
		});
	} else {
		$scope.hcrs = cache['list'];
		$scope.loading = false;
	}
});
// tabs and structure of details
app.controller('detailsCtrl', function($scope, $routeParams, $http) {
	$scope.id = $routeParams.id;
	// tabs definition
	$scope.tabs = [
		{
			"operation":"overview",
			"name":"Overview"
		},{
			"operation":"realtime",
			"name":"Realtime"
		},{
			"operation":"charts",
			"name":"Charts"
		}
	];
	// function used at the tab selector
	$scope.activeTab = function (operation) {
		return operation == $routeParams.operation;
	}
	// set default status
	$scope.loading = true;
	$scope.error = false;
	$scope.details = {};
	// get the data (if not already downloaded) from the api server
	if (cache['details'][$routeParams.id] == undefined) {
		$http.get(settings['api']['schema']['details'].replace(/{id}/i,$routeParams.id))
		.then(function successCallback (response) {
			$scope.details = response.data;
			cache['details'][$routeParams.id] = response.data;
			$scope.loading = false;
		}, function errorCallback(response) {
			$scope.error = true;
			$scope.loading = false;
		});
	} else {
		$scope.details = cache['details'][$routeParams.id];
		$scope.loading = false;
	}
});
// directives
app.directive('tabsOverview', function () {
	return {
		templateUrl: "partials/overview.html",
		controller: function ($scope) {
			// controller of overview
		}
	}
})
app.directive('tabsCharts', function () {
	return {
		templateUrl: "partials/charts.html",
		controller: function ($scope) {
			// controller of overview
		}
	}
})
app.directive('tabsRealtime', function () {
	return {
		templateUrl: "partials/realtime.html",
		controller: function ($scope) {
			// controller of realtime
		}
	}
})
