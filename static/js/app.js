// init some vars
// cach vars
var cache = {};
cache['list'] = [];
cache['details'] = {};
// init angular application
var app = angular.module('app', [
	'ngRoute',
	'pascalprecht.translate'
]);
// create route provider
app.config(function($routeProvider, $locationProvider, $translateProvider) {
	$routeProvider
		.when('/list', {
			templateUrl: 'partials/list.html',
			controller: 'listCtrl'
		})
		.when('/hcr/:id/overview', {
			templateUrl: 'partials/overview.html',
			controller: 'overviewCtrl'
		})
		.when('/hcr/:id/charts', {
			templateUrl: 'partials/charts.html',
			controller: 'chartsCtrl'
		})
		.when('/hcr/:id/realtime', {
			templateUrl: 'partials/realtime.html',
			controller: 'realtimeCtrl'
		})
		.otherwise({
			redirectTo: '/list'
		});
	// init translateProvider
	// if detecting the browser language doesn't work, use the language of settings.js
	$translateProvider.preferredLanguage(settings['preferredLanguage']);
	$translateProvider.useStaticFilesLoader({
		prefix: 'static/lang/',
		suffix: '.json'
	});
	$translateProvider.useSanitizeValueStrategy('escape');
});
app.run(function ($translate) {
	// try to detect the browser language
	var browserLang = navigator.language || navigator.userLanguage;
	settings['languages'].forEach(function (obj){
		browserLang.split("-").forEach(function (part){
			if (obj.indexOf(part) != -1) {
				$translate.use(obj);
			}
		});
	})
})
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
app.controller("overviewCtrl", function($scope){
	// controller @/hcr/{id}/overview
});
app.controller("realtimeCtrl", function($scope){
	// controller @/hcr/{id}/realtime
});
app.controller("chartsCtrl", function($scope){
	// controller @/hcr/{id}/charts
	$scope.data = {
		legend: ["Jan","Feb","Mar","Apr","May"],
		xlabel: "time in months",
		ylabel: "active in gramms",
		height: 300,
		width: 600,
		title: "title",
		lines:[{
			data: [4,1,2,4,5,9,2,9,16,38,22,23,20],
			color: "red",
			stroke: "2"
		}]
	}
});
// tabs directive
app.directive('detailsTabs', function() {
	return {
		templateUrl : 'partials/details.html',
		controller : function($scope, $routeParams, $location, $http) {
			$scope.id = $routeParams.id;
			// tabs definition
			$scope.tabs = ["overview", "realtime", "charts"];
			// function used at the tab selector
			$scope.activeTab = function (name) {
				return "/hcr/" + $routeParams.id + "/" + name == $location.path();
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
		}
	}
});
app.directive("lineChart", function() {
	return {
		templateUrl: 'partials/linechart.html',
		scope: {
			data: '=data'
		},
		controller: function ($scope) {
			// if user doesn't set the margin, set it to {} to prevent errors
			if ($scope.data.margin == undefined) $scope.data.margin = {};
			// the init function; it sets lot's of vars which are needed do continue
			$scope.init = function() {
				console.log("drawing chart...")
				$scope.margin = {
					left: $scope.data.margin.left || 0,
					right: $scope.data.margin.right || 30,
					top: $scope.data.margin.top || 30,
					bottom: $scope.data.margin.bottom || ($scope.data.xlabel != undefined ? 40 : 20),
				};
				$scope.height = $scope.data.height - ($scope.margin.top + $scope.margin.bottom);
				$scope.width = $scope.data.width - ($scope.margin.left + $scope.margin.right);
				$scope.ytickCount = $scope.data.ytickCount || $scope.height / 40;
				$scope.ymin = $scope.data.ymin || 0;
				$scope.ymax = $scope.data.ymax || 0;
				if ($scope.data.ymin == undefined || $scope.data.ymax == undefined) {
					$scope.data.lines.map(function(item) {
						item.data.map(function(itemofitem) {
							if ($scope.data.ymax == undefined && itemofitem > $scope.ymax) $scope.ymax = itemofitem;
							if ($scope.data.ymin == undefined && itemofitem < $scope.ymin) $scope.ymin = itemofitem;
						})
					})
				}
				// init the y ticks...
				$scope.calculateY()
			}
			// converts from value to value in chart
			$scope.getPointx = function (line, index) {
				return Math.round($scope.width / (line.length - 1) * index);
			};
			// the same with the y axis
			$scope.getPointy = function (point) {
				var yFactor = $scope.height / Math.abs($scope.ymin - $scope.ymax)
				return Math.round($scope.height + $scope.ymin * yFactor - point * yFactor);
			};
			// converts array of one line to a svg <polyline points=""> readable string
			$scope.getPoints = function (line) {
				return line.map(function (item, itemIndex) {
					return $scope.getPointx(line, itemIndex) + ',' + $scope.getPointy(line[itemIndex]);
				}).join(',');
			};
			// calculates smart y axis labels
			$scope.calculateY = function () {
				// Copyright (c) 2010-2016, Michael Bostock
				var span = $scope.ymax - $scope.ymin;
				var step = Math.pow(10, Math.floor(Math.log(span / $scope.ytickCount) / Math.LN10));
				var err = $scope.ytickCount / span * step;

				if (err <= 0.15) step *= 10;
				else if (err <= 0.35) step *= 5;
				else if (err <= 0.75) step *= 2;

				var i = Math.ceil($scope.ymin / step) * step;
				var max = Math.floor($scope.ymax / step) * step + step * 0.5;
				$scope.yticks = [];

				while(i < max) {
					$scope.yticks.push(Math.round(i));
					// adjust margin.left on the Y axis ticks label size
					var newLeft = String(i).length * 6 + ($scope.data.ylabel != undefined ? 30 : 15);
					if ($scope.margin.left < newLeft) {
						$scope.margin.left = newLeft;
						// calculate the width again
						$scope.width = $scope.data.width - ($scope.margin.left + $scope.margin.right);
					}
					i = i + step;
				}
			}
			// show zero line in the chart or not?
			$scope.showZeroLine = function () {
				if ($scope.data.showZeroLine == undefined) {
					return ($scope.ymin < 0 && $scope.ymax > 0);
				} else if ($scope.data.showZeroLine == false) {
					return false;
				} else if ($scope.data.showZeroLine == true) {
					return true
				}
			}
			// listens to changes of directive parameters and redraws the chart if required
			$scope.$watch('data', $scope.init);
		}
	}
})
