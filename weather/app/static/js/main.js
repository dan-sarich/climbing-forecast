/***********************************************
 * Google Charts: Line / Multi Line
 * Vue.js Build Templates for each type of table. 
 * - Pass in X & Y Axis labels and value arrays
************************************************/
var init = function () {
	google.charts.load('current', { packages: [ 'line' ] });

	var ac = new google.maps.places.Autocomplete(document.getElementById('locationSearch'), {
		types : [ 'geocode' ]
	});
	google.maps.event.addListener(ac, 'place_changed', function () {
		var place = ac.getPlace();
		var lat = place.geometry.location.lat();
		var lng = place.geometry.location.lng();
		console.log(lat, lng);
		getChartData(lat, lng);
	});
};

var getChartData = function (lat_in, lng_in) {
	$.ajax({
		type        : 'POST',
		contentType : 'application/json',
		data        : JSON.stringify({ lat: lat_in, lng: lng_in }),
		url         : '/data',
		success     : function (result) {
			console.log(result);
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
		createContainer(key, chartData.chart_pairing[key].fullScreen);
		drawChart(chartData.chart_pairing[key], key);
	}
};

var createContainer = function (chart_id, fs) {
	if (fs) {
		var col = $('<div>', { class: 'col-md-12 col-lg-12 mt-3' }).prependTo('#chartConatiner');
	} else {
		var col = $('<div>', { class: 'col-md-12 col-lg-6 mt-3' }).appendTo('#chartConatiner');
	}

	var card = $('<div>', { class: 'card' }).appendTo(col);
	var card_body = $('<div>', { class: 'card-body', id: chart_id }).appendTo(card);
};

var drawChart = function (chartData, container) {
	console.log(chartData);
	var myChartData = [];
	var chartDiv = document.getElementById(container);
	var data = new google.visualization.DataTable();

	chartData.labels.forEach(function (label, i) {
		var colType = i == 0 ? 'datetime' : 'number';
		data.addColumn(colType, label);
	});

	chartData.rows.forEach(function (rows, i) {
		rows.forEach(function (innerRow, j) {
			if (i == 0) {
				myChartData.push([]);
				myChartData[j].push(new Date(innerRow));
			} else {
				myChartData[j].push(innerRow);
			}
		});
	});
	data.addRows(myChartData);
	var chartOpts = {
		chart     : {
			title : chartData.title
		},
		width     : '100%',
		height    : 500,
		lineWidth : 8,
		chartArea : {
			width : '85%'
		},
		hAxis     : {
			title : chartData.labels[0]
		},
		vAxis     : {
			title : chartData.labels[1]
		}
	};
	var chart = new google.charts.Line(chartDiv);
	chart.draw(data, chartOpts);
};

$(document).ready(init);
