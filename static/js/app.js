// init some vars
// cach vars
var cache = {};
cache['list'] = [];
cache['details'] = {};

var APIHTTPPrefix = (settings['api']['encrypted'] ? "https://" : "http://") + settings['api']['prefix'];
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
// navigation directive
app.directive('navigation', function () {
	return {
		restrict: "E",
		templateUrl: "partials/navigation.html",
	};
});
// create the list on /list
app.controller('listCtrl', function ($scope, $http) {
	$scope.loading = true;
	$scope.error = false;
	$scope.hcrs = [];
	if (cache['list'].length == 0) {
		$http.get(APIHTTPPrefix + settings['api']['schema']['list'])
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
	$scope.tabs = [
		{
			"operation":"overview",
			"name":"Overview"
		},{
			"operation":"charts",
			"name":"Charts"
		},
	];
	$scope.activeTab = function (operation) {
		return operation === $routeParams.operation;
	}
	$scope.loading = true;
	$scope.error = false;
	$scope.details = {};
	if (cache['details'][$routeParams.id] == undefined) {
		$http.get(APIHTTPPrefix + settings['api']['schema']['details'].replace(/{id}/i,$routeParams.id))
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
