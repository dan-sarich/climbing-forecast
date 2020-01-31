/***********************************************
 * Google Charts: Line / Multi Line
 * Vue.js Build Templates for each type of table. 
 * - Pass in X & Y Axis labels and value arrays
************************************************/
var init = function () {
	google.charts.load('current', { packages: [ 'line' ] });

	var ac = new google.maps.places.Autocomplete(document.getElementById('locationSearch'), {
		types  : [ 'geocode' ],
		fields : [ 'formatted_address', 'geometry.location' ]
	});
	loadRecients();
	google.maps.event.addListener(ac, 'place_changed', function () {
		console.log(ac);
		var place = ac.getPlace();
		var lat = place.geometry.location.lat();
		var lng = place.geometry.location.lng();
		console.log(lat, lng, place);
		getChartData(lat, lng);
		saveToRecients(lat, lng, place.formatted_address);
	});
};

var getChartData = function (lat_in, lng_in) {
	$.ajax({
		type        : 'POST',
		contentType : 'application/json',
		data        : JSON.stringify({ lat: lat_in, lng: lng_in }),
		url         : '/data',
		success     : function (result) {
			formatChartData(result);
		},
		error       : function (err) {
			console.error(err);
		}
	});
};

var formatChartData = function (chartData) {
	$('#chartConatiner').empty();

	for (key in chartData.chart_pairing) {
		chartData.chart_pairing[key].labels.forEach(function (time, i) {
			chartData.chart_pairing[key].labels[i] = new Date(time);
		});
		createContainer(key, chartData.chart_pairing[key].fullScreen);
		drawChart(chartData.chart_pairing[key], key);
	}
};

var createContainer = function (chart_id, fs) {
	if (fs) {
		var col = $('<div>', { class: 'col-lg-12 col-xl-12 mt-3' }).prependTo('#chartConatiner');
	} else {
		var col = $('<div>', { class: 'col-lg-12 col-xl-6 mt-3' }).appendTo('#chartConatiner');
	}

	var card = $('<div>', { class: 'card ' }).appendTo(col);
	var card_body = $('<div>', { class: 'card-body' }).appendTo(card);
	var canvas = $('<canvas>', { id: chart_id }).appendTo(card_body);
};

var drawChart = function (chartData, container) {
	var myChartData = [];
	var chartDiv = document.getElementById(container).getContext('2d');
	// var data = new google.visualization.DataTable();

	// chartData.labels.forEach(function (label, i) {
	// 	var colType = i == 0 ? 'datetime' : 'number';
	// 	data.addColumn(colType, label);
	// });

	// chartData.rows.forEach(function (rows, i) {
	// 	rows.forEach(function (innerRow, j) {
	// 		if (i == 0) {
	// 			myChartData.push([]);
	// 			myChartData[j].push(new Date(innerRow));
	// 		} else {
	// 			myChartData[j].push(innerRow);
	// 		}
	// 	});
	// });
	// data.addRows(myChartData);
	// var chartOpts = {
	// 	chart     : {
	// 		title : chartData.title
	// 	},
	// 	legend    : { position: chartData.show_legend },
	// 	hAxis     : {
	// 		title : chartData.axis_labels.hAxis
	// 	},
	// 	vAxis     : {
	// 		title : chartData.axis_labels.vAxis
	// 	},
	// 	width     : '100%',
	// 	height    : 500,
	// 	pointSize : 30
	// };
	// if (chartData.format == 'percent') {
	// 	chartOpts.vAxis.format = "#'%'";
	// 	chartOpts.vAxis.minValue = 0;
	// 	chartOpts.vAxis.maxValue = 100;
	// }
	// var chart = new google.charts.Line(chartDiv);
	// chart.draw(data, google.charts.Line.convertOptions(chartOpts));
	var colorChoice = {
		backgroundColor : [
			'rgba(255, 99, 132, 0.2)',
			'rgba(54, 162, 235, 0.2)',
			'rgba(255, 206, 86, 0.2)',
			'rgba(75, 192, 192, 0.2)',
			'rgba(153, 102, 255, 0.2)',
			'rgba(255, 159, 64, 0.2)'
		],
		borderColor     : [
			"#247BA0",
			"#FF1654",
			"#70C1B3",
			"#B2DBBF"
		]
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
				text      : chartData.title
			},
			scales     : {
				xAxes : [
					{
						type      : 'time',
						time      : {
							unit: 'day',
							displayFormats: {
								second: 'h:MM:SS',
								minute: 'h:MM',
								hour: 'hA',
								day: 'MMM D',
								month: 'YYYY MMM',
								year: 'YYYY',
							}
						},
						scaleLabel: {
							display: true,
							labelString: 'value'
						}
					}
				],
				yAxes : [
					{
						scaleLabel : {
							display     : true,
							labelString : chartData.axis_labels.yAxis
						},
						ticks: {
							beginAtZero: true
						}
					}
				]
			}
		}
	};

	chartData.rows.forEach(function (row, i) {
		var rowData = {
			label           : chartData.dataSet_labels[i],
			data            : row,
			borderWidth     : 3,
			backgroundColor : 'transparent',
			borderColor     : [ colorChoice.borderColor[i] ],
			lineTension		: 0
		};

		chartOpts.data.datasets.push(rowData);
	});

	var myLineChart = new Chart(chartDiv, chartOpts);
};

var saveToRecients = function (lat, lon, place) {
	var myLocations = (localStorage.getItem("climbingLocations") != null) ? JSON.parse(localStorage.getItem("climbingLocations")) : [];

	 var isExists = myLocations.find(function(location, i){
		if (location.place == place)return true;
	})

	console.log(isExists, myLocations);

	if (!isExists){
		myLocations.push({
			lat: lat,
			lon: lon,
			place: place
		})
		localStorage.setItem('climbingLocations', JSON.stringify(myLocations));
	}
};

var loadRecients = function(){
	var myLocations = (localStorage.getItem("climbingLocations") != null) ? JSON.parse(localStorage.getItem("climbingLocations")) : [];

	myLocations.forEach(function(location, i){
		var fLat = location.lat,
			fLon = location.lon,
			fPlace = location.place;
	
		var favLink = $("<a>",{"text": fPlace, "data-lat": fLat, "data-lon": fLon}).appendTo("#favoritesConatiner");
		favLink.on("click", function(){
			getChartData(fLat, fLon);
		})
	})

};

$(document).ready(init);
