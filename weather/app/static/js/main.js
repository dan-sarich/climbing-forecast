/***********************************************
 * Google Charts: Line / Multi Line
 * Google location: Landmarks? Or addresses.. IDK
 * Vue.js Build Templates for each type of table. 
 * - Pass in X & Y Axis labels and value arrays
************************************************/
var init = function () {
	$('#geoLocateMe').on('click', geoFindMe);
};

var getChartData = function (latitude, longitude) {
	$.ajax({
		type        : 'POST',
		contentType : 'application/json',
		data        : JSON.stringify({ lat: latitude, lon: longitude }),
		url         : '/data',
		success     : function (result) {
			console.log('from python', result);
		},
		error       : function (err) {
			console.error(err);
		}
	});
};
var geoFindMe = function () {
	var latitude, longitude;

	var success = function (position) {
		latitude = position.coords.latitude;
		longitude = position.coords.longitude;
		var myLocation = 'Latitude: ' + latitude + ' °, Longitude: ' + longitude + ' °';

		$('#locationResult').val(myLocation);
		getChartData(latitude, longitude);
	};
	var error = function () {
		var msg = 'Unable to retrieve your location';
		$('#locationResult').val(msg);
	};
	if (!navigator.geolocation) {
		var msg = 'Geolocation is not supported by your browser';
		$('#locationResult').val(msg);
	} else {
		var msg = 'Locating…';
		$('#locationResult').val(msg);
		navigator.geolocation.getCurrentPosition(success, error);
	}
};
$(document).ready(init);
