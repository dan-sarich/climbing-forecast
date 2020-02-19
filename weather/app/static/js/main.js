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
		var photoToUse = typeof place.photos != 'undefined' && place.photos.length ? place.photos[0].getUrl() : '/static/images/default_background.jpg';
		console.log(place);
		getChartData(lat, lng, place.name, place.formatted_address, photoToUse);
	});

	$('#sidebarCollapse').on('click', function() {
		toggleSideBar();
	});

	if (window.innerWidth > 575) {
		toggleSideBar(true);
	}
};

var getChartData = function(lat_in, lng_in, name, formatted_address, image) {
	$.ajax({
		type        : 'POST',
		contentType : 'application/json',
		data        : JSON.stringify({ lat: lat_in, lng: lng_in }),
		url         : '/data',
		success     : function(result) {
			console.log('result', lat_in, lng_in, name, formatted_address, image);
			createTitleArea(name, image);
			formatChartData(result);
			saveToRecients(lat_in, lng_in, name, formatted_address, image);

			if (window.innerWidth <= 575) {
				toggleSideBar(false);
			}
		},
		error       : function(err) {
			console.error(err);
		}
	});
};

var toggleSideBar = function(force) {
	if (force != null) {
		$('#sidebar').toggleClass('active', force);
		$('.navbar').toggleClass('active', force);
		$('#content').toggleClass('active', force);
	} else {
		$('#sidebar').toggleClass('active');
		$('.navbar').toggleClass('active');
		$('#content').toggleClass('active');
	}
};

var createTitleArea = function(name, image) {
	$('#titleContainer').empty();
	var card = $('<div>', { class: 'card card-image', style: 'background-image: url(' + image + ');' }).prependTo('#titleContainer');
	var innerDiv = $('<div>', { class: 'text-white text-center rgba-stylish-strong py-5 px-4' }).appendTo(card);
	var paddingDiv = $('<div>', { class: 'py-5' }).appendTo(innerDiv);
	var heading = $('<h1>', { text: name, class: 'card-title h1 my-4 py-2' }).prependTo(paddingDiv);
};
var formatChartData = function(chartData) {
	$('#chartConatiner').empty();
	$('#fsChartConatiner').empty();
	$('#chartConatinerMobile').empty();

	for (key in chartData.chart_pairing) {
		// Loop through and format as date
		chartData.chart_pairing[key].labelChunks = {};
		chartData.chart_pairing[key].dataChunks = [];

		chartData.chart_pairing[key].labels.forEach(function(time, i) {
			var tz = moment(time).tz(chartData.timezone);
			chartData.chart_pairing[key].labels[i] = tz.format('ddd, MMM DD h:mm A');

			var t = tz.format('ddd');
			if (typeof chartData.chart_pairing[key].labelChunks[t] == 'undefined') chartData.chart_pairing[key].labelChunks[t] = [];
			chartData.chart_pairing[key].labelChunks[t].push(tz.format('ddd, MMM DD h:mm A'));

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

		createContainer_mobile(chartData.chart_pairing[key], key);
		drawChart_mobile(chartData.chart_pairing[key], key);
	}
};
var createContainer = function(chart_id, fs) {
	if (fs) {
		var col = $('<div>', { class: 'col-lg-12 col-xl-12 mt-3' }).appendTo('#fsChartConatiner');
		var card = $('<div>', { class: 'card' }).appendTo(col);
		var card_body = $('<div>', { class: 'card-body' }).appendTo(card);
		var canvas = $('<canvas>', { id: chart_id }).appendTo(card_body);
	} else {
		var col = $('<div>', { class: 'col-lg-12 col-xl-6 mt-3' }).appendTo('#chartConatiner');
		var card = $('<div>', { class: 'card' }).appendTo(col);
		var card_body = $('<div>', { class: 'card-body' }).appendTo(card);
		var canvas = $('<canvas>', { id: chart_id }).appendTo(card_body);
	}
};

var createContainer_mobile = function(chartData, chart_id) {
	var col = $('<div>', { class: 'col-12 mt-3' }).appendTo('#chartConatinerMobile');
	var card = $('<div>', { class: 'card' }).appendTo(col);
	var card_body = $('<div>', { class: 'card-body' }).appendTo(card);
	var days_list = $('<ul>', { class: 'nav nav-tabs daysList d-flex' }).appendTo(card);
	var days_chart_container = $('<div>', { class: 'tab-content daysChart' }).appendTo(card);

	$('<h4>', { class: 'card-title font-weight-bold', text: chartData.title }).appendTo(card_body);

	// Build tabs
	var i = 0;
	for (var day in chartData.labelChunks) {
		var dayTab = $('<li>', { class: 'nav-item flex-fill' }).appendTo(days_list);

		if (i == 0) {
			var dayLink = $('<a>', {
				href          : '#' + chart_id + '_' + day + '_container',
				text          : day,
				'data-day'    : day,
				class         : 'nav-link active text-center',
				id            : chart_id + '_' + day + '_tab',
				'data-toggle' : 'tab',
				role          : 'tab'
			}).appendTo(dayTab);

			var dayPane = $('<div>', {
				class : 'tab-pane chart-container fade show active',
				id    : chart_id + '_' + day + '_container',
				role  : 'tabpanel'
			}).appendTo(days_chart_container);
		} else {
			var dayLink = $('<a>', {
				href          : '#' + chart_id + '_' + day + '_container',
				text          : day,
				'data-day'    : day,
				class         : 'nav-link text-center',
				id            : chart_id + '_' + day + '_tab',
				'data-toggle' : 'tab',
				role          : 'tab'
			}).appendTo(dayTab);

			var dayPane = $('<div>', {
				class : 'tab-pane chart-container fade',
				id    : chart_id + '_' + day + '_container',
				role  : 'tabpanel'
			}).appendTo(days_chart_container);
		}
		var canvas = $('<canvas>', { id: chart_id + '_' + day }).appendTo(dayPane);
		i++;
	}
};

var drawChart = function(chartData, container) {
	var chartDiv = document.getElementById(container).getContext('2d');
	var colorChoice = {
		borderColor : [ '#ff723f', '#37548e', '#8697ba' ]
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
							display   : true,
							fontColor : '#fff'
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
			pointHitRadius  : 10,
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

var drawChart_mobile = function(chartData, chart_id) {
	for (var day in chartData.labelChunks) {
		var container = chart_id + '_' + day;
		var chartDiv = document.getElementById(container).getContext('2d');
		var isSinglePoint = false;

		var colorChoice = {
			borderColor : [ '#EA6A47', '#1599D8', '#66ab79' ]
		};
		var chartOpts = {
			type    : 'line',
			data    : {
				labels   : chartData.labelChunks[day],
				datasets : []
			},
			options : {
				layout     : {
					padding : {
						left   : 0,
						right  : 0,
						top    : 0,
						bottom : 0
					}
				},
				responsive : true,
				legend     : {
					display : false
				},
				scales     : {
					xAxes : [
						{
							type       : 'time',
							time       : {
								unit           : 'hour',
								displayFormats : {
									second : 'h:MM:SS',
									minute : 'h:MM A',
									hour   : 'hA',
									day    : 'MMM D',
									month  : 'YYYY MMM',
									year   : 'YYYY'
								}
							},
							gridLines  : {
								display : false
							},
							scaleLabel : {
								display : false
							},
							ticks      : {
								fontColor : '#fff'
							}
						}
					],
					yAxes : [
						{
							gridLines  : {
								drawBorder : false
							},
							scaleLabel : {
								display   : false,
								fontColor : '#fff'
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

		chartData.dataChunks.forEach(function(row, i) {
			isSinglePoint = row.length == 1 ? true : false;
			var rowData = {
				label           : chartData.dataSet_labels[i],
				data            : row[day],
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

		if (!isSinglePoint) {
			document[container] = new Chart(chartDiv, chartOpts);
		}
	}
};

var saveToRecients = function(lat, lon, name, address, image) {
	var myLocations = localStorage.getItem('climbingLocations') != null ? JSON.parse(localStorage.getItem('climbingLocations')) : [];
	var locationObj = {
		lat     : lat,
		lon     : lon,
		name    : name,
		address : address,
		image   : image
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
				fAddress = loc.address,
				fImage = loc.image;
			var listItem = $('<li>').appendTo('#favoritesConatiner');
			var favLink = $('<a>', {
				class      : '',
				text       : fAddress,
				'data-lat' : fLat,
				'data-lon' : fLon
			}).appendTo(listItem);

			favLink.on('click', function() {
				$('#locationSearch').val('');
				getChartData(fLat, fLon, fName, fAddress, fImage);
			});
		}
	});
};

$(document).ready(init);
