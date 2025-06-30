import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as moment from 'moment-timezone';
import * as math from 'mathjs';

@Injectable()
export class WeatherService {
  constructor(private configService: ConfigService) {}

  async getWeatherConditions(lat: number, lng: number, isImperial: boolean, timezoneShift: number) {
    console.log('Getting weather conditions for:', { lat, lng, isImperial, timezoneShift });

    // Set data labels for frontend
    let label_accumulation = "mm";
    let label_speed = "km/h";
    let label_temp = "°C";
    let label_percent = "%";

    // Setting optimal conditions
    // Temperature in C
    const Topt = 18;
    const Twid = 20;
    // Wind in km/h
    const Wcut = 30;
    const Wwid = 25;
    // Perception in mm
    const Pcut = 15;
    const Pwid = 18;
    // Rock wettness in h after perception
    const Rcut_light = -12;
    const Rwid_light = 12;
    const Rcut_moderate = -24;
    const Rwid_moderate = 12;
    const Rcut_strong = -36;
    const Rwid_strong = 12;
    const Rcut_violent = -48;
    const Rwid_violent = 12;
    // Other manual factors
    const sunfactor = 8.3;
    const sunrise = 8;
    const sunset = 18;

    // Gaussian function for probability calculations
    const gauss = (x: number, cent: number, wid: number): number => {
      return Math.exp(-1.0 * Math.pow(x - cent, 2) / (2 * Math.pow(wid, 2)));
    };

    // Get the weather forecast from OpenWeatherMap API
    const API_key = this.configService.get<string>('OWM_API_KEY');
    if (!API_key) {
      throw new Error('OpenWeatherMap API key not found in environment variables');
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${API_key}&units=metric`;
    const response = await axios.get(url);
    const forecast = response.data;

    // Initialize data arrays
    const local_times = [];
    const utc_times = [];
    const actual_temperatures = [];
    const wind_speeds = [];
    const humidity_values = [];
    const hours = [];
    const days = [];
    const months = [];
    const cloudiness_values = [];
    const rain_amounts = [];
    const snow_amounts = [];
    const weather_statuses = [];
    const precipitation_amounts = [];
    const temperature_index_shade_felt = [];
    const temperature_index_sun_felt = [];
    const precipitation_index = [];
    const wind_index = [];
    const rain_index = [];
    const snow_index = [];
    const shade_temperatures = [];
    const sun_temperatures = [];
    const shade_felt_temperatures = [];
    const sun_felt_temperatures = [];
    const climbing_probability_sun = [];
    const climbing_probability_shade = [];

    // Process forecast data
    for (const item of forecast.list) {
      const date = moment.unix(item.dt);
      utc_times.push(date.toISOString());
      
      const local_time = date.add(timezoneShift, 'minutes');
      local_times.push(local_time.toISOString());
      
      hours.push(local_time.hour());
      days.push(local_time.date());
      months.push(local_time.month() + 1); // moment months are 0-indexed
      
      actual_temperatures.push(item.main.temp);
      wind_speeds.push(item.wind.speed * 3.6); // Convert m/s to km/h
      humidity_values.push(item.main.humidity);
      cloudiness_values.push(item.clouds.all);
      weather_statuses.push(item.weather[0].description);
      
      // Get rain data if available
      if (item.rain && item.rain['3h']) {
        rain_amounts.push(item.rain['3h']);
      } else {
        rain_amounts.push(0);
      }
      
      // Get snow data if available
      if (item.snow && item.snow['3h']) {
        snow_amounts.push(item.snow['3h']);
      } else {
        snow_amounts.push(0);
      }
    }

    // Perform calculations for each forecast point
    for (let i = 0; i < local_times.length; i++) {
      // Calculate shade temperature (same as actual temperature)
      shade_temperatures.push(actual_temperatures[i]);

      // Calculate sun temperature (adjusted for sunlight based on time of day)
      if (hours[i] < sunrise || hours[i] > sunset) {
        // No sun adjustment during night hours
        sun_temperatures.push(actual_temperatures[i]);
      } else {
        // Add sun factor adjusted by cloudiness during daylight hours
        sun_temperatures.push(actual_temperatures[i] + sunfactor * (1 - cloudiness_values[i]/100));
      }

      // Calculate felt temperature in shade using wind chill or heat index formulas
      if (shade_temperatures[i] <= 10) {
        // Wind chill formula for cold temperatures
        shade_felt_temperatures.push(
          13.12 + 0.6215 * shade_temperatures[i] - 11.37 * Math.pow(wind_speeds[i], 0.16) + 
          0.3965 * shade_temperatures[i] * Math.pow(wind_speeds[i], 0.16)
        );
      } else if (shade_temperatures[i] >= 20) {
        // Heat index formula for hot temperatures
        shade_felt_temperatures.push(
          -8.784695 + 1.61139411 * shade_temperatures[i] + 2.338549 * humidity_values[i] - 
          0.14611605 * shade_temperatures[i] * humidity_values[i] - 0.012308094 * Math.pow(shade_temperatures[i], 2) - 
          0.016424828 * Math.pow(humidity_values[i], 2) + 0.002211732 * Math.pow(shade_temperatures[i], 2) * humidity_values[i] + 
          0.00072546 * shade_temperatures[i] * Math.pow(humidity_values[i], 2) - 
          0.000003582 * Math.pow(shade_temperatures[i], 2) * Math.pow(humidity_values[i], 2)
        );
      } else {
        // For moderate temperatures, felt temperature equals actual temperature
        shade_felt_temperatures.push(shade_temperatures[i]);
      }

      // Calculate felt temperature in sun using wind chill or heat index formulas
      if (sun_temperatures[i] <= 10) {
        // Wind chill formula for cold temperatures
        sun_felt_temperatures.push(
          13.12 + 0.6215 * sun_temperatures[i] - 11.37 * Math.pow(wind_speeds[i], 0.16) + 
          0.3965 * sun_temperatures[i] * Math.pow(wind_speeds[i], 0.16)
        );
      } else if (sun_temperatures[i] >= 20) {
        // Heat index formula for hot temperatures
        sun_felt_temperatures.push(
          -8.784695 + 1.61139411 * sun_temperatures[i] + 2.338549 * humidity_values[i] - 
          0.14611605 * sun_temperatures[i] * humidity_values[i] - 0.012308094 * Math.pow(sun_temperatures[i], 2) - 
          0.016424828 * Math.pow(humidity_values[i], 2) + 0.002211732 * Math.pow(sun_temperatures[i], 2) * humidity_values[i] + 
          0.00072546 * sun_temperatures[i] * Math.pow(humidity_values[i], 2) - 
          0.000003582 * Math.pow(sun_temperatures[i], 2) * Math.pow(humidity_values[i], 2)
        );
      } else {
        // For moderate temperatures, felt temperature equals actual temperature
        sun_felt_temperatures.push(sun_temperatures[i]);
      }

      // Calculate total precipitation
      precipitation_amounts.push(rain_amounts[i] + snow_amounts[i]);

      // Calculate temperature indices for shade and sun
      temperature_index_shade_felt.push(gauss(shade_felt_temperatures[i], Topt, Twid/2.35482));
      temperature_index_sun_felt.push(gauss(sun_felt_temperatures[i], Topt, Twid/2.35482));

      // Calculate precipitation and wind indices
      precipitation_index.push(math.erf(1 - (precipitation_amounts[i] - Pcut) * 2.35482 / Pwid) / 2);
      wind_index.push(math.erf(1 - (wind_speeds[i] - Wcut) * 2.35482 / Wwid) / 2);

      // Calculate rock wetness based on rain history
      let rain_probability_list = [];
      for (let j = 0; j < i; j++) {
        if (rain_amounts[j] === 0) {
          rain_probability_list.push(1);  // No rain means dry rock
        } else {
          // Calculate hours since rain
          const hours_since_rain = (j-i)*3;

          // Determine wetness probability based on rain intensity
          if (rain_amounts[j] > 0 && rain_amounts[j] < 7.5) {
            // Light rain
            rain_probability_list.push(math.erf(1 - (hours_since_rain-Rcut_light)*2.35482/Rwid_light)/2);
          } else if (rain_amounts[j] >= 7.5 && rain_amounts[j] < 30) {
            // Moderate rain
            rain_probability_list.push(math.erf(1 - (hours_since_rain-Rcut_moderate)*2.35482/Rwid_moderate)/2);
          } else if (rain_amounts[j] >= 30 && rain_amounts[j] < 150) {
            // Strong rain
            rain_probability_list.push(math.erf(1 - (hours_since_rain-Rcut_strong)*2.35482/Rwid_strong)/2);
          } else {  // rain_amounts[j] >= 150
            // Violent rain
            rain_probability_list.push(math.erf(1 - (hours_since_rain-Rcut_violent)*2.35482/Rwid_violent)/2);
          }
        }
      }

      // Set rain index based on minimum probability (worst case)
      if (i === 0) {
        rain_index.push(1);  // First forecast point has no history
      } else {
        rain_index.push(Math.min(...rain_probability_list));
      }

      // Calculate rock wetness based on snow history
      let snow_probability_list = [];
      for (let j = 0; j < i; j++) {
        if (snow_amounts[j] === 0) {
          snow_probability_list.push(1);  // No snow means dry rock
        } else {
          // Calculate hours since snow
          const hours_since_snow = (j-i)*3;

          // Determine wetness probability based on snow intensity
          if (snow_amounts[j] > 0 && snow_amounts[j] < 7.5) {
            // Light snow
            snow_probability_list.push(math.erf(1 - (hours_since_snow-Rcut_light)*2.35482/Rwid_light)/2);
          } else if (snow_amounts[j] >= 7.5 && snow_amounts[j] < 30) {
            // Moderate snow
            snow_probability_list.push(math.erf(1 - (hours_since_snow-Rcut_moderate)*2.35482/Rwid_moderate)/2);
          } else if (snow_amounts[j] >= 30 && snow_amounts[j] < 150) {
            // Strong snow
            snow_probability_list.push(math.erf(1 - (hours_since_snow-Rcut_strong)*2.35482/Rwid_strong)/2);
          } else {  // snow_amounts[j] >= 150
            // Violent snow
            snow_probability_list.push(math.erf(1 - (hours_since_snow-Rcut_violent)*2.35482/Rwid_violent)/2);
          }
        }
      }

      // Set snow index based on minimum probability (worst case)
      if (i === 0) {
        snow_index.push(1);  // First forecast point has no history
      } else {
        snow_index.push(Math.min(...snow_probability_list));
      }

      // Calculate climbing condition probabilities
      // Combine all indices to get overall climbing probability
      climbing_probability_sun.push(100 * (
        temperature_index_sun_felt[i] * 
        wind_index[i] * 
        precipitation_index[i] * 
        rain_index[i] * 
        snow_index[i]
      ));

      climbing_probability_shade.push(100 * (
        temperature_index_shade_felt[i] * 
        wind_index[i] * 
        precipitation_index[i] * 
        rain_index[i] * 
        snow_index[i]
      ));

      // Convert to imperial units if requested
      if (isImperial) {
        // Temperature: Celsius to Fahrenheit
        actual_temperatures[i] = 9/5 * actual_temperatures[i] + 32;
        sun_felt_temperatures[i] = 9/5 * sun_felt_temperatures[i] + 32;
        shade_felt_temperatures[i] = 9/5 * shade_felt_temperatures[i] + 32;

        // Speed: km/h to mph
        wind_speeds[i] = wind_speeds[i] / 1.609344;

        // Precipitation: mm to inches
        rain_amounts[i] = rain_amounts[i] / 25.4;
        snow_amounts[i] = snow_amounts[i] / 25.4;

        // Update labels for imperial units
        label_accumulation = "in";
        label_speed = "mph";
        label_temp = "°F";
      }

      // Round values for display
      actual_temperatures[i] = Math.round(actual_temperatures[i] * 10) / 10;
      sun_felt_temperatures[i] = Math.round(sun_felt_temperatures[i] * 10) / 10;
      shade_felt_temperatures[i] = Math.round(shade_felt_temperatures[i] * 10) / 10;
      wind_speeds[i] = Math.round(wind_speeds[i] * 10) / 10;
      rain_amounts[i] = Math.round(rain_amounts[i] * 100) / 100;
      snow_amounts[i] = Math.round(snow_amounts[i] * 100) / 100;
      climbing_probability_sun[i] = Math.round(climbing_probability_sun[i] * 10) / 10;
      climbing_probability_shade[i] = Math.round(climbing_probability_shade[i] * 10) / 10;
    }

    // Format response JSON with standardized structure
    return {
      time: {
        utc: utc_times,
        local: local_times,
        month: months,
        day: days,
        hour: hours,
      },
      status: weather_statuses,
      charts: [
        {
          id: 'rain_chart',
          rows: [rain_amounts],
          dataSet_labels: [`Accumulation (${label_accumulation})`],
          labels: local_times,
          axis_labels: {
            yAxis: `Accumulation (${label_accumulation})`,
            xAxis: '',
          },
          title: 'Rain Accumulation',
          format: label_accumulation,
          show_legend: 'none',
          fullScreen: false,
        },
        {
          id: 'snow_chart',
          rows: [snow_amounts],
          dataSet_labels: [`Accumulation (${label_accumulation})`],
          labels: local_times,
          axis_labels: {
            yAxis: `Accumulation (${label_accumulation})`,
            xAxis: '',
          },
          title: 'Snow Accumulation',
          format: label_accumulation,
          show_legend: 'none',
          fullScreen: false,
        },
        {
          id: 'cloudiness_chart',
          rows: [cloudiness_values],
          dataSet_labels: [`Cloudiness (${label_percent})`],
          labels: local_times,
          axis_labels: {
            yAxis: `Cloudiness (${label_percent})`,
            xAxis: '',
          },
          title: 'Cloudiness',
          format: label_percent,
          show_legend: 'none',
          fullScreen: false,
        },
        {
          id: 'humidity_chart',
          rows: [humidity_values],
          dataSet_labels: [`Humidity (${label_percent})`],
          labels: local_times,
          title: 'Humidity',
          axis_labels: {
            yAxis: `Humidity (${label_percent})`,
            xAxis: '',
          },
          format: label_percent,
          show_legend: 'none',
          fullScreen: false,
        },
        {
          id: 'wind_chart',
          rows: [wind_speeds],
          dataSet_labels: [`Wind (${label_speed})`],
          labels: local_times,
          title: 'Wind',
          axis_labels: {
            yAxis: `Wind (${label_speed})`,
            xAxis: '',
          },
          format: label_speed,
          show_legend: 'none',
          fullScreen: false,
        },
        {
          id: 'temperature_felt_chart',
          rows: [
            sun_felt_temperatures,
            shade_felt_temperatures,
            actual_temperatures,
          ],
          dataSet_labels: ['Sun', 'Shade', 'Actual'],
          labels: local_times,
          title: 'Temperature Felt',
          format: label_temp,
          axis_labels: {
            yAxis: `Temperature Felt (${label_temp})`,
            xAxis: '',
          },
          show_legend: '',
          fullScreen: true,
        },
        {
          id: 'fun_chart',
          rows: [climbing_probability_sun, climbing_probability_shade],
          dataSet_labels: ['In Sun', 'In Shade'],
          labels: local_times,
          title: 'Climbing Fun',
          format: label_percent,
          axis_labels: {
            yAxis: `Climbing Fun (${label_percent})`,
            xAxis: '',
          },
          show_legend: '',
          fullScreen: true,
        },
      ],
    };
  }
}