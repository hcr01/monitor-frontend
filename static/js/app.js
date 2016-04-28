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
});
app.run(function ($translate) {
	// try to detect the browser language
	var browserLang = navigator.language || navigator.userLanguage;
	settings['languages'].forEach(function (obj){
		browserLang.split("-").forEach(function (part){
			if (obj.indexOf(part) !=-1) {
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
		legend: ["jan","feb","mar","apr","may"],
		ymax: 4096,
		ymin: 0,
		height: 300,
		width: 600,
		margin: 40,
		title: "title",
		lines:[{
			data: [0,1,2,4,16,32,64,128,256,512,1024,2048,4096],
			color: "red",
			stroke: "2",
			type: "polyline"
		},{
			data: [4096,0,4096,0,4096,0,4096,0,4096,0,4096,0,4096],
			color: "blue",
			stroke: "2",
			type: "path"
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
			$scope.tabs = [
				{
					"name":"overview"
				},{
					"name":"realtime"
				},{
					"name":"charts"
				}
			];
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
			$scope.init = function() {
				$scope.margin = $scope.data.margin || 30;
				$scope.height = $scope.data.height - $scope.margin * 2;
				$scope.width = $scope.data.width - $scope.margin * 2;
				$scope.ymin = $scope.data.ymin || 0;
				$scope.ymax = $scope.data.ymax || 10; // TODO
				$scope.ytickCount = $scope.data.ytickCount || $scope.height / 40;

				// init the y ticks...
				$scope.calculateY()
			}
			// converts from value to value in chart
			$scope.getPointx = function (line, index) {
				return $scope.width / (line.length-1) * index;;
			};
			// the same with the y axis
			$scope.getPointy = function (line, index) {
				var yFactor = $scope.height / Math.abs($scope.data.ymin - $scope.data.ymax)
				return $scope.height + $scope.data.ymin * yFactor - line[index] * yFactor;
			};
			// converts array of one line to a svg <path d=""> readable string
			$scope.getPath = function (line) {
				return line.map(function (item, itemIndex) {
					var final = (itemIndex == 0 ? 'M' : '') + $scope.getPointx(line, itemIndex) + ' ' + $scope.getPointy(line, itemIndex);
					if (itemIndex < line.length - 1) {
						final += ' C ' + $scope.getPointx(line, itemIndex + 0.3) + ' ' + $scope.getPointy(line, itemIndex) + ' ' + $scope.getPointx(line, itemIndex + 0.7) + ' ' + $scope.getPointy(line, itemIndex + 1);
					}
					return final;
				}).join(' ');
			};
			// converts array of one line to a svg <polyline points=""> readable string
			$scope.getPoints = function (line) {
				return line.map(function (item, itemIndex) {
					return $scope.getPointx(line, itemIndex) + ',' + $scope.getPointy(line, itemIndex);
				}).join(',');
			};
			// calculates smart y axis labels
			$scope.calculateY = function () {
				// Copyright (c) 2010-2016, Michael Bostock
				var span = $scope.ymax - $scope.ymin;
				var step = Math.pow(10, Math.floor(Math.log(span / $scope.ytickCount) / Math.LN10));
				var err = $scope.ytickCount / span * step;

				if (err <= .15) step *= 10;
				else if (err <= .35) step *= 5;
				else if (err <= .75) step *= 2;

				var tstart = Math.ceil($scope.ymin / step) * step;
				var tstop = Math.floor($scope.ymax / step) * step + step * .5;
				$scope.yticks = [];

				for (i = tstart; i < tstop; i += step) {
					$scope.yticks.push(i);
				}
			}
			// listens to changes on the vars, and redraws the chart if needed
			$scope.$watch('data.height', $scope.init);
			$scope.$watch('data.width', $scope.init);
			$scope.$watch('data.margin', $scope.init);
		}
	}
})
