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

	google.maps.event.addListener(ac, 'place_changed', function () {
		console.log(ac);
		var place = ac.getPlace();
		var lat = place.geometry.location.lat();
		var lng = place.geometry.location.lng();
		console.log(lat, lng, place);
		getChartData(lat, lng);
		saveToRecients(lat, lng);
	});

	$('#recientsSideNav').sideNav();
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

	var card = $('<div>', { class: 'card bg-dark' }).appendTo(col);
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
			'rgba(255, 255, 255)',
			'rgba(255,99,132,1)',
			'rgba(54, 162, 235, 1)',
			'rgba(255, 206, 86, 1)',
			'rgba(75, 192, 192, 1)',
			'rgba(153, 102, 255, 1)',
			'rgba(255, 159, 64, 1)'
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
				text      : chartData.title,
				fontColor : '#fff'
			},
			scales     : {
				xAxes : [
					{
						type      : 'time',
						time      : {
							displayFormats : {
								millisecond : 'MM/DD',
								second      : 'MM/DD',
								minute      : 'MM/DD',
								hour        : 'MM/DD',
								day         : 'MM/DD',
								week        : 'MM/DD',
								month       : 'MM/DD',
								quarter     : 'MM/DD',
								year        : 'MM/DD'
							}
						},
						fontColor : '#fff',
						ticks     : {
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
							fontColor : '#fff'
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
			borderColor     : [ colorChoice.borderColor[i] ]
		};

		chartOpts.data.datasets.push(rowData);
	});

	var myLineChart = new Chart(chartDiv, chartOpts);
};

var saveToRecients = function (lat, lon, place) {};

$(document).ready(init);
