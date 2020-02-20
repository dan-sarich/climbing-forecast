function newWeatherApp(params) {
	this.isMetric = false;
	this.lat = null;
	this.lng = null;
	this.name = null;
	this.formatted_address = null;
	this.image = null;
	this.loadingOverlay = null;
	this.loadingCntBox = null;
	this.loadingDisplayTimer = null;

	this.init = function() {
		// CHART DEFAULTS
		Chart.defaults.global.defaultFontFamily = "'Montserrat', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
		Chart.defaults.global.legend.position = 'bottom';
		Chart.defaults.global.legend.labels.usePointStyle = true;
		Chart.defaults.global.legend.labels.boxWidth = 15;
		Chart.defaults.global.tooltips.backgroundColor = '#000';

		var _this = this;
		var ac = new google.maps.places.Autocomplete(document.getElementById('locationSearch'), {
			types  : [ 'geocode' ],
			fields : [ 'formatted_address', 'geometry.location', 'icon', 'photos', 'name', 'utc_offset' ]
		});

		_this.loadRecients();
		_this.manageMetricToggle();
		_this.createLoadingOverlay();

		google.maps.event.addListener(ac, 'place_changed', function() {
			var place = ac.getPlace();
			_this.lat = place.geometry.location.lat();
			_this.lng = place.geometry.location.lng();
			_this.image = typeof place.photos != 'undefined' && place.photos.length ? place.photos[0].getUrl() : '/static/images/default_background.jpg';
			_this.formatted_address = place.formatted_address;
			_this.name = place.name;
			_this.getChartData();
		});

		$('#sidebarCollapse').on('click', function() {
			_this.toggleSideBar();
		});
		$('#metricToggle').on('click', function() {
			var tm = setTimeout(function() {
				var isMetric = $('#metricToggle').is('.active');
				_this.manageMetricToggle(isMetric);
				_this.getChartData();
			}, 250);
		});

		if (window.innerWidth > 575) {
			_this.toggleSideBar(true);
		}
	};

	this.getChartData = function(savedObj) {
		var _this = this;

		if (savedObj != null) {
			_this.lat = savedObj.lat;
			_this.lng = savedObj.lng;
			_this.name = savedObj.name;
			_this.formatted_address = savedObj.address;
			_this.image = savedObj.image;
		}
		_this.loadingOverlayShow();
		$.ajax({
			type        : 'POST',
			contentType : 'application/json',
			data        : JSON.stringify({ lat: _this.lat, lng: _this.lng, imperial: !_this.isMetric }),
			url         : '/data',
			success     : function(result) {
				_this.createTitleArea(_this.name, _this.image, '#titleContainer');
				_this.createTitleArea(_this.name, _this.image, '#titleContainerMobile');
				_this.formatChartData(result);
				_this.saveToRecients();

				if (window.innerWidth <= 575) {
					_this.toggleSideBar(false);
				}
				_this.loadingOverlayHide();
			},
			error       : function(err) {
				console.error(err);
			}
		});
	};

	this.toggleSideBar = function(force) {
		var _this = this;
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

	this.createTitleArea = function(name, image, container) {
		var _this = this;
		$(container).empty();
		var card = $('<div>', { class: 'card card-image', style: 'background-image: url(' + image + ');' }).prependTo(container);
		var innerDiv = $('<div>', { class: 'text-white text-center rgba-stylish-strong p-2' }).appendTo(card);
		var paddingDiv = $('<div>', { class: 'py-5' }).appendTo(innerDiv);
		var heading = $('<h1>', { text: name, class: 'card-title h1 my-4 py-2' }).prependTo(paddingDiv);
	};
	this.createAtAGlance = function(container) {
		var _this = this;
		$(container).empty();
		var card = $('<div>', { class: 'card card-image', style: 'background-image: url(' + image + ');' }).prependTo(container);
		var innerDiv = $('<div>', { class: 'text-white text-center rgba-stylish-strong p-2' }).appendTo(card);
		var paddingDiv = $('<div>', { class: 'py-5' }).appendTo(innerDiv);
		var heading = $('<h1>', { text: name, class: 'card-title h1 my-4 py-2' }).prependTo(paddingDiv);
	};
	this.formatChartData = function(chartData) {
		var _this = this;
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

			_this.createContainer(key, chartData.chart_pairing[key].fullScreen, chartData.chart_pairing[key]);
			_this.drawChart(chartData.chart_pairing[key], key);

			_this.createContainer_mobile(chartData.chart_pairing[key], key);
			_this.drawChart_mobile(chartData.chart_pairing[key], key);
		}
	};
	this.createContainer = function(chart_id, fs, chartData) {
		var _this = this;
		if (fs) {
			var col = $('<div>', { class: 'col-lg-12 col-xl-12 mt-3' }).appendTo('#fsChartConatiner');
			var card = $('<div>', { class: 'card' }).appendTo(col);
			var card_header = $('<div>', { class: 'card-header' }).appendTo(card);
			var card_title = $('<h4>', { class: 'card-title', text: chartData.title }).appendTo(card_header);
			var card_body = $('<div>', { class: 'card-body' }).appendTo(card);
			var canvas = $('<canvas>', { id: chart_id }).appendTo(card_body);
		} else {
			var col = $('<div>', { class: 'col-lg-12 col-xl-6 mt-3' }).appendTo('#chartConatiner');
			var card = $('<div>', { class: 'card' }).appendTo(col);
			var card_header = $('<div>', { class: 'card-header' }).appendTo(card);
			var card_title = $('<h4>', { class: 'card-title', text: chartData.title }).appendTo(card_header);
			var card_body = $('<div>', { class: 'card-body' }).appendTo(card);
			var canvas = $('<canvas>', { id: chart_id }).appendTo(card_body);
		}
	};

	this.createContainer_mobile = function(chartData, chart_id) {
		var _this = this;
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
	this.createDonutChart = function(chartData, container) {
		var _this = this;
		var chartDiv = document.getElementById(container).getContext('2d');

		var donutOpts = {
			type    : 'doughnut', // Set the chart to be a doughnut chart type
			data    : {
				datasets : [
					{
						data        : [ chartData, 100 - percentValue ], // Set the value shown in the chart as a percentage (out of 100)
						borderWidth : 0 // Width of border around the chart
					}
				]
			},
			options : {
				cutoutPercentage : 84, // The percentage of the middle cut out of the chart
				responsive       : false, // Set the chart to not be responsive
				tooltips         : {
					enabled : false // Hide tooltips
				},
				plugins          : {
					colorschemes : {
						scheme : 'tableau.NurielStone9'
					}
				}
			}
		};

		document[container] = new Chart(chartCanvas, donutOpts);
	};
	this.drawChart = function(chartData, container) {
		var _this = this;
		var chartDiv = document.getElementById(container).getContext('2d');
		// var colorChoice = {
		// 	borderColor : [ '#ff723f', '#37548e', '#29b5a8' ]
		// };
		var chartOpts = {
			type    : 'line',
			data    : {
				labels   : chartData.labels,
				datasets : []
			},
			options : {
				responsive : true,
				layout     : {
					padding : {
						left   : 0,
						right  : 0,
						top    : 0,
						bottom : 0
					}
				},
				title      : {
					display   : false,
					text      : chartData.title,
					fontSize  : 24,
					fontColor : '#fff'
				},
				plugins    : {
					colorschemes : {
						scheme : 'tableau.NurielStone9'
					},
					crosshair    : {
						sync : {
							enabled : false
						},
						zoom : {
							enabled : false // enable zooming
						}
					}
				},
				legend     : {
					labels : {
						fontColor : '#fff',
						padding   : 20
					}
				},
				tooltips   : {
					mode              : 'interpolate',
					intersect         : false,
					titleMarginBottom : 10,
					bodySpacing       : 10,
					titleFontSize     : 14,
					callbacks         : {
						label : function(tooltipItem, data) {
							var label = data.datasets[tooltipItem.datasetIndex].label + ': ' + tooltipItem.yLabel + chartData.format;
							return label;
						}
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
									day    : 'ddd D',
									month  : 'YYYY MMM',
									year   : 'YYYY'
								}
							},
							scaleLabel : {
								display   : false,
								fontColor : '#fff'
							},
							ticks      : {
								fontColor : '#fff'
							},
							gridLines  : {
								display : false
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
							},
							gridLines  : {
								display : true,
								color   : '#676767'
							}
						}
					]
				}
			}
		};

		chartData.rows.forEach(function(row, i) {
			var rowData = {
				label            : chartData.dataSet_labels[i],
				data             : row,
				borderWidth      : 3,
				fill             : false,
				pointRadius      : 3,
				pointHoverRadius : 3,
				pointHitRadius   : 3,
				pointBorderWidth : 2
			};

			chartOpts.data.datasets.push(rowData);
		});

		if (chartData.format == '%') {
			chartOpts.options.scales.yAxes[0].ticks['min'] = 0;
			chartOpts.options.scales.yAxes[0].ticks['max'] = 100;
			chartOpts.options.scales.yAxes[0].ticks['callback'] = function(value) {
				return value + '%';
			};
		}
		document[container] = new Chart(chartDiv, chartOpts);
	};

	this.drawChart_mobile = function(chartData, chart_id) {
		var _this = this;
		for (var day in chartData.labelChunks) {
			var container = chart_id + '_' + day;
			var chartDiv = document.getElementById(container).getContext('2d');
			var isSinglePoint = false;

			// var colorChoice = {
			// 	borderColor : [ '#EA6A47', '#1599D8', '#66ab79' ]
			// };
			var chartOpts_MOBILE = {
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
					plugins    : {
						colorschemes : {
							scheme : 'tableau.NurielStone9'
						},
						crosshair    : {
							sync : {
								enabled : false // enable trace line syncing with other charts
							},
							zoom : {
								enabled : false // enable zooming
							}
						}
					},
					tooltips   : {
						titleMarginBottom : 10,
						bodySpacing       : 10,
						titleFontSize     : 14,
						callbacks         : {
							label : function(tooltipItem, data) {
								var label = data.datasets[tooltipItem.datasetIndex].label + ': ' + tooltipItem.yLabel + chartData.format;
								return label;
							}
						}
					},
					responsive : true,
					legend     : {
						padding   : 20,
						fontColor : '#fff'
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
										day    : 'ddd D',
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
					label       : chartData.dataSet_labels[i],
					data        : row[day],
					borderWidth : 3,
					fill        : false
				};

				chartOpts_MOBILE.data.datasets.push(rowData);
			});

			if (chartData.format == '%') {
				chartOpts_MOBILE.options.scales.yAxes[0].ticks['min'] = 0;
				chartOpts_MOBILE.options.scales.yAxes[0].ticks['max'] = 100;
				chartOpts_MOBILE.options.scales.yAxes[0].ticks['callback'] = function(value) {
					return value + '%';
				};
			}
			console.log('isSinglePoint', isSinglePoint);
			if (!isSinglePoint) {
				document[container] = new Chart(chartDiv, chartOpts_MOBILE);
			} else {
				_this.createDonutChart(chartData, container);
			}
		}
	};

	this.saveToRecients = function() {
		var _this = this;
		var myLocations = Cookies.get('climbingLocations') != null ? JSON.parse(Cookies.get('climbingLocations')) : [];
		var locationObj = {
			lat     : _this.lat,
			lng     : _this.lng,
			name    : _this.name,
			address : _this.formatted_address,
			image   : _this.image
		};

		var foundObj = myLocations.find(function(loc, i) {
			if (loc.address == _this.formatted_address) return loc;
		});
		var isExists = myLocations.indexOf(foundObj);

		if (isExists == -1) {
			myLocations.unshift(locationObj);
		} else {
			myLocations.splice(isExists, 1);
			myLocations.unshift(foundObj);
		}

		Cookies.set('climbingLocations', JSON.stringify(myLocations));
		_this.loadRecients();
	};
	this.manageMetricToggle = function(isMetric) {
		var _this = this;

		if (isMetric != null) {
			_this.isMetric = isMetric;
			Cookies.set('isMetricToggle', _this.isMetric);
		} else {
			var isSavedMetric = Cookies.get('isMetricToggle') != null ? Cookies.get('isMetricToggle') : false;
			_this.isMetric = isSavedMetric == 'true';
			var tm = setTimeout(function() {
				$('#metricToggle').toggleClass('active', _this.isMetric);
			}, 250);
		}
	};
	this.loadRecients = function() {
		var _this = this;
		var myLocations = Cookies.get('climbingLocations') != null ? JSON.parse(Cookies.get('climbingLocations')) : [];

		$('#favoritesConatiner').empty();
		if (myLocations.length) $('.custom-sidebar').show();
		myLocations.forEach(function(loc, i) {
			// only show 6 recients
			if (i < 6) {
				var listItem = $('<li>').appendTo('#favoritesConatiner');
				var favLink = $('<a>', {
					class : '',
					text  : loc.address
				}).appendTo(listItem);

				favLink.on('click', function() {
					$('#locationSearch').val('');
					_this.getChartData(loc);
				});
			}
		});
	};
	/* loading Overlay */
	this.createLoadingOverlay = function() {
		var _this = this;

		_this.loadingOverlay = $('<div>', { class: 'loadingOverlayBox' }).appendTo(document.body);
		var pageOverlay = $('<div>', { class: 'loadingOverlay' }).appendTo(_this.loadingOverlay);

		_this.loadingCntBox = $('<div>', { class: 'loadingOverlayCnt' }).appendTo(_this.loadingOverlay);
		var spinner = $('<i>', { class: 'fa fa-spinner fa-spin' }).appendTo(_this.loadingCntBox);
	};

	this.loadingOverlayHide = function() {
		var _this = this;

		clearTimeout(_this.loadingDisplayTimer);
		$(_this.loadingOverlay).removeClass('loadingOverlayAnimate');
		$(_this.loadingOverlay).removeClass('dspOverlay');

		this.displayTimer = setTimeout(function() {
			$(_this.loadingOverlay).removeClass('loadingOverlayDisplay');
			$(document.body).removeClass('loadingOverlayBody');
		}, 350);
	};

	this.loadingOverlayShow = function() {
		var _this = this;

		clearTimeout(_this.loadingDisplayTimer);
		$(_this.loadingOverlay).addClass('loadingOverlayDisplay');
		$(document.body).addClass('loadingOverlayBody');

		var displayTimout = setTimeout(function() {
			$(_this.loadingOverlay).addClass('dspOverlay');
			$(_this.loadingOverlay).addClass('loadingOverlayAnimate');
		}, 1);
	};

	for (var key in params) {
		this[key] = params[key];
	}

	return this;
}

$(document).ready(function() {
	var weatherApp = newWeatherApp();
	weatherApp.init();
});
