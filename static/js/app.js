var app = angular.module('app', [
	'ngRoute'
]);
var APIHTTPPrefix = (settings['api']['encrypted'] ? "https://" : "http://") + settings['api']['prefix'];
app.config(['$routeProvider', '$locationProvider',
	function($routeProvider, $locationProvider) {
		$routeProvider
			.when('/list', {
				templateUrl: 'partials/list.html',
				controller: 'listCtrl'
			})
			.when('/hcr/:id/overview', {
				templateUrl: 'partials/overview.html',
				controller: 'overviewCtrl'
			})
			.otherwise({
				redirectTo: '/list'
			});
}]);

app.factory('routeNavigation', function($route, $location) {
	var routes = [];
	angular.forEach($route.routes, function (route, path) {
		if (route.name) {
			routes.push({
				path: path,
				name: route.name
			});
		}
	});
	return {
		routes: routes,
		activeRoute: function (route) {
			return route.path === $location.path();
		}
	};
});

app.directive('navigation', function (routeNavigation) {
	return {
		restrict: "E",
		templateUrl: "partials/navigation.html",
		controllerAs: "navCtrl",
		controller: function ($scope) {
			$scope.showMobileNav = false;
			$scope.routes = routeNavigation.routes;
			$scope.activeRoute = routeNavigation.activeRoute;
		}
	};
});

app.controller('listCtrl', function ($scope, $http) {
	$scope.loading = true;
	$scope.error = false;
	$scope.hcrs = [];
	$http.get(APIHTTPPrefix + settings['api']['schema']['list'])
	.then(function successCallback (response) {
		$scope.hcrs = response.data;
		$scope.loading = false;
	}, function errorCallback(response) {
		$scope.error = true;
		$scope.loading = false;
	});
});
app.controller('overviewCtrl', function($scope, $routeParams, $http) {
	$scope.loading = true;
	$scope.error = false;
	$scope.details = {};
	$scope.details['id'] = $routeParams.id;
	$http.get(APIHTTPPrefix + settings['api']['schema']['details'].replace(/{id}/i,$routeParams.id))
	.then(function successCallback (response) {
		$scope.details = response.data;
		$scope.loading = false;
	}, function errorCallback(response) {
		$scope.error = true;
		$scope.loading = false;
	});
});
