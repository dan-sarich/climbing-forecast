/***********************************************
 * Google Charts: Line / Multi Line
 * Vue.js Build Templates for each type of table.
 * - Pass in X & Y Axis labels and value arrays
 *
 * https://bootstrapious.com/p/circular-progress-bar
 ************************************************/
var init = function() {
	google.charts.load('current', { packages: [ 'line' ] });

	var ac = new google.maps.places.Autocomplete(document.getElementById('locationSearch'), {
		types  : [ 'geocode' ],
		fields : [ 'formatted_address', 'geometry.location', 'icon', 'photos', 'name' ]
	});

	loadRecients();

	google.maps.event.addListener(ac, 'place_changed', function() {
		console.log(ac);
		var place = ac.getPlace();
		var lat = place.geometry.location.lat();
		var lng = place.geometry.location.lng();

		getChartData(lat, lng, place.name, place.formatted_address);
	});
};

var getChartData = function(lat_in, lng_in, name, formatted_address) {
	$.ajax({
		type        : 'POST',
		contentType : 'application/json',
		data        : JSON.stringify({ lat: lat_in, lng: lng_in }),
		url         : '/data',
		success     : function(result) {
			console.log('result', lat_in, lng_in, name, formatted_address);
			createTitleArea(name);
			formatChartData(result);
			saveToRecients(lat_in, lng_in, name, formatted_address);
		},
		error       : function(err) {
			console.error(err);
		}
	});
};

var createTitleArea = function(name) {
	$('#titleContainer').empty();
	var col = $('<div>', { class: 'col-12 ' }).prependTo('#titleContainer');
	var heading = $('<h1>', { text: name, class: 'text-white' }).prependTo(col);
};
var formatChartData = function(chartData) {
	$('#chartConatiner').empty();
	console.log(chartData);
	for (key in chartData.chart_pairing) {
		// Loop through and format as date
		chartData.chart_pairing[key].labels.forEach(function(time, i) {
			chartData.chart_pairing[key].labels[i] = new Date(time);
		});

		// Loop through rows and format numbers
		chartData.chart_pairing[key].rows.forEach(function(rows, i) {
			rows.forEach(function(row, j) {
				rows[j] = row.toFixed(2);
			});
		});

		createContainer(key, chartData.chart_pairing[key].fullScreen);
		drawChart(chartData.chart_pairing[key], key);
	}
};

var createContainer = function(chart_id, fs) {
	if (fs) {
		var col = $('<div>', { class: 'col-lg-12 col-xl-12 mt-3' }).prependTo('#chartConatiner');
	} else {
		var col = $('<div>', { class: 'col-lg-12 col-xl-6 mt-3' }).appendTo('#chartConatiner');
	}

	var card = $('<div>', { class: 'card cardTheme-dark' }).appendTo(col);
	var card_body = $('<div>', { class: 'card-body' }).appendTo(card);
	var canvas = $('<canvas>', { id: chart_id }).appendTo(card_body);
};

var drawChart = function(chartData, container) {
	var myChartData = [];
	var chartDiv = document.getElementById(container).getContext('2d');
	var colorChoice = {
		borderColor     : [ '#EA6A47', '#A5D8DD', '#1599D8', '#D9DFE2' ],
		backgroundColor : [ '#EA6A4740', '#A5D8D40D', '#1599D840', '#D9DFE240' ]
	};
	var chartOpts = {
		type    : 'line',
		data    : {
			labels   : chartData.labels,
			datasets : []
		},
		options : {
			responsive : true,
			title      : {
				display   : true,
				text      : chartData.title,
				fontSize  : 24,
				fontColor : '#fff'
			},
			legend     : {
				labels : {
					fontColor : '#fff'
				}
			},
			scales     : {
				xAxes : [
					{
						type       : 'time',
						time       : {
							unit           : 'day',
							tooltipFormat  : 'MMM DD h:MM A',
							displayFormats : {
								second : 'h:MM:SS',
								minute : 'h:MM',
								hour   : 'hA',
								day    : 'MMM D',
								month  : 'YYYY MMM',
								year   : 'YYYY'
							}
						},
						scaleLabel : {
							display     : true,
							labelString : 'value',
							fontColor   : '#fff'
						},
						ticks      : {
							fontColor : '#fff'
						}
					}
				],
				yAxes : [
					{
						scaleLabel : {
							display     : true,
							labelString : chartData.axis_labels.yAxis,
							fontColor   : '#fff'
						},
						ticks      : {
							beginAtZero : true,
							fontColor   : '#fff'
						}
					}
				]
			}
		}
	};

	chartData.rows.forEach(function(row, i) {
		var rowData = {
			label           : chartData.dataSet_labels[i],
			data            : row,
			borderWidth     : 3,
			backgroundColor : 'transparent',
			borderColor     : [ colorChoice.borderColor[i] ],
			lineTension     : 0
		};

		chartOpts.data.datasets.push(rowData);
	});

	if (chartData.format == 'percent') {
		chartOpts.options.scales.yAxes[0].ticks['min'] = 0;
		chartOpts.options.scales.yAxes[0].ticks['max'] = 100;
		chartOpts.options.scales.yAxes[0].ticks['callback'] = function(value) {
			return value + '%';
		};
	}

	var myLineChart = new Chart(chartDiv, chartOpts);
};

var saveToRecients = function(lat, lon, name, address) {
	var myLocations = localStorage.getItem('climbingLocations') != null ? JSON.parse(localStorage.getItem('climbingLocations')) : [];
	var locationObj = {
		lat     : lat,
		lon     : lon,
		name    : name,
		address : address
	};

	var foundObj = myLocations.find(function(loc, i) {
		if (loc.address == address) return loc;
	});
	var isExists = myLocations.indexOf(foundObj);

	if (isExists == -1) {
		myLocations.unshift(locationObj);
	} else {
		myLocations.splice(isExists, 1);
		myLocations.unshift(foundObj);
	}

	localStorage.setItem('climbingLocations', JSON.stringify(myLocations));
	loadRecients();
};

var loadRecients = function() {
	var myLocations = localStorage.getItem('climbingLocations') != null ? JSON.parse(localStorage.getItem('climbingLocations')) : [];

	$('#favoritesConatiner').empty();
	if (myLocations.length) $('.custom-sidebar').show();
	myLocations.forEach(function(loc, i) {
		// only show 6 recients
		if (i < 6) {
			var fLat = loc.lat,
				fLon = loc.lon,
				fName = loc.name,
				fAddress = loc.address;

			var favLink = $('<a>', {
				class      : 'list-group-item list-group-item-action d-flex justify-content-between align-items-center cardTheme-dark',
				text       : fAddress,
				'data-lat' : fLat,
				'data-lon' : fLon
			}).appendTo('#favoritesConatiner');

			favLink.on('click', function() {
				$('#locationSearch').val('');
				getChartData(fLat, fLon, fName, fAddress);
			});
		}
	});
};
var initProgressView = function() {
	$('.progress').each(function() {
		var value = $(this).attr('data-value');
		var left = $(this).find('.progress-left .progress-bar');
		var right = $(this).find('.progress-right .progress-bar');

		if (value > 0) {
			if (value <= 50) {
				right.css('transform', 'rotate(' + percentageToDegrees(value) + 'deg)');
			} else {
				right.css('transform', 'rotate(180deg)');
				left.css('transform', 'rotate(' + percentageToDegrees(value - 50) + 'deg)');
			}
		}
	});
};
var percentageToDegrees = function(percentage) {
	return percentage / 100 * 360;
};

$(document).ready(init);
