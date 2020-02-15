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
		fields : [ 'formatted_address', 'geometry.location', 'icon', 'photos', 'name', 'utc_offset' ]
	});

	loadRecients();

	google.maps.event.addListener(ac, 'place_changed', function() {
		var place = ac.getPlace();
		var lat = place.geometry.location.lat();
		var lng = place.geometry.location.lng();
		console.log(place);
		getChartData(lat, lng, place.name, place.formatted_address);
	});

	$('#sidebarCollapse').on('click', function() {
		$('#sidebar').toggleClass('active');
		$('.navbar').toggleClass('active');
		$('#content').toggleClass('active');
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
	$('#fsChartConatiner').empty();

	for (key in chartData.chart_pairing) {
		// Loop through and format as date
		chartData.chart_pairing[key].labelChunks = {};
		chartData.chart_pairing[key].dataChunks = [];

		chartData.chart_pairing[key].labels.forEach(function(time, i) {
			var tz = moment(time).tz(chartData.timezone);
			chartData.chart_pairing[key].labels[i] = tz.format('MMM DD h:mm A');

			var t = tz.format('ddd');
			if (typeof chartData.chart_pairing[key].labelChunks[t] == 'undefined') chartData.chart_pairing[key].labelChunks[t] = [];
			chartData.chart_pairing[key].labelChunks[t].push(tz.format('h:mm A'));

			// Loop through rows and format numbers
			chartData.chart_pairing[key].rows.forEach(function(rows, x) {
				if (typeof chartData.chart_pairing[key].dataChunks[x] == 'undefined') chartData.chart_pairing[key].dataChunks[x] = {};

				rows[i] = rows[i].toFixed(2);
				if (typeof chartData.chart_pairing[key].dataChunks[x][t] == 'undefined') chartData.chart_pairing[key].dataChunks[x][t] = [];
				chartData.chart_pairing[key].dataChunks[x][t].push(rows[i]);
			});
		});

		createContainer(key, chartData.chart_pairing[key].fullScreen);
		drawChart(chartData.chart_pairing[key], key);
	}
	console.log(chartData);
};
var createContainer = function(chart_id, fs) {
	if (fs) {
		var col = $('<div>', { class: 'col-lg-12 col-xl-12 mt-3' }).appendTo('#fsChartConatiner');
		var card = $('<div>', { class: 'card cardTheme-dark' }).appendTo(col);
		var card_body = $('<div>', { class: 'card-body' }).appendTo(card);
		var canvas = $('<canvas>', { id: chart_id }).appendTo(card_body);
	} else {
		var col = $('<div>', { class: 'col-lg-12 col-xl-6 mt-3' }).appendTo('#chartConatiner');
		var card = $('<div>', { class: 'card cardTheme-dark' }).appendTo(col);
		var card_body = $('<div>', { class: 'card-body' }).appendTo(card);
		var canvas = $('<canvas>', { id: chart_id }).appendTo(card_body);
	}
};

var drawChart = function(chartData, container) {
	var myChartData = [];
	var chartDiv = document.getElementById(container).getContext('2d');
	var colorChoice = {
		borderColor : [ '#EA6A47', '#1599D8', '#66ab79' ]
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

	document[container] = new Chart(chartDiv, chartOpts);
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
			var listItem = $('<li>').appendTo('#favoritesConatiner');
			var favLink = $('<a>', {
				class      : '',
				text       : fAddress,
				'data-lat' : fLat,
				'data-lon' : fLon
			}).appendTo(listItem);

			favLink.on('click', function() {
				$('#locationSearch').val('');
				getChartData(fLat, fLon, fName, fAddress);
			});
		}
	});
};

$(document).ready(init);
