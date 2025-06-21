#!/usr/bin/python
from app import app
from flask import Flask, request, render_template, jsonify, make_response
import numpy as np
import matplotlib.pyplot as plt
from scipy import special
from pyowm import OWM
from pyowm.utils import geo
from pytz import timezone
from datetime import datetime, timedelta
import pytz
import webbrowser
import requests
import json


@app.route("/")
def index():
    PLACES_API_key = app.config['PLACES_API']
    return render_template('index.html', apiKey=PLACES_API_key, now=datetime.now().strftime('%s'))

# This python function requires the coordinates of a place in lat and lon and returns: time, month, day, hour, whetherstatus, actual temperature, temp felt in sun, temp felt in shade,cloudiness,wind_act,humidity_act,rain_act,Probability fun in sun and shade
@app.route('/data', methods=['POST'])
def getconditions():
    # POST request

    print('Incoming..')
    data = request.get_json(force=True)
    print(data)  # parse as JSON
    lat = data['lat']
    lng = data['lng']
    isImperial = data['imperial']
    Timezoneshift = data['utc_offset']

    # set data labels for frontend

    label_accumulation = "mm"
    label_speed = "km/h"
    label_temp = "°C"
    label_percent = "%"

    # setting optimal conditions
    #Temperature in C
    Topt = 18
    Twid = 20
    #wind in km/h
    Wcut = 30
    Wwid = 25
    #Perception in mm
    Pcut = 15
    Pwid = 18
    # Rock wettness in h after perception
    Rcut_light = -12
    Rwid_light = 12
    Rcut_moderate = -24
    Rwid_moderate = 12
    Rcut_strong = -36
    Rwid_strong = 12
    Rcut_violent = -48
    Rwid_violent = 12
    # other manual factors
    sunfactor = 8.3
    sunrise = 8
    sunset = 18

    def gauss(x, cent, wid):
        out = 1 * np.exp(-1.0 * (x - cent)**2 / (2 * wid**2))
        return out
    # setup probabilities
    Tspace = np.linspace(Topt-2*Twid, Topt+2*Twid, num=100)
    IT = gauss(Tspace, Topt, Twid/2.35482)

    Wspace = np.linspace(0, 75, num=100)
    IW = special.erfc((Wspace-Wcut)*2.35482/Wwid)/2

    Pspace = np.linspace(0, 75, num=100)
    IP = special.erfc((Pspace-Pcut)*2.35482/Pwid)/2

    Rspace = np.linspace(-72, 0, num=100)
    IR_light = special.erfc((Rspace-Rcut_light)*2.35482/Rwid_light)/2
    IR_moderate = special.erfc((Rspace-Rcut_moderate)*2.35482/Rwid_moderate)/2
    IR_strong = special.erfc((Rspace-Rcut_strong)*2.35482/Rwid_strong)/2
    IR_violent = special.erfc((Rspace-Rcut_violent)*2.35482/Rwid_violent)/2

    # get the weather
    API_key = app.config['OWM_API_KEY']
    owm = OWM(API_key)
    forecast_client = owm.three_hours_forecast_at_coords(float(lat), float(lng))
    forecast = forecast_client.get_forecast()
    # Initialize data arrays for calculations and probability
    local_times = []
    utc_times = []
    actual_temperatures = []
    wind_speeds = []
    humidity_values = []
    hours = []
    days = []
    months = []
    cloudiness_values = []
    rain_amounts = []
    snow_amounts = []
    weather_statuses = []
    precipitation_amounts = []
    temperature_index_shade_felt = []
    temperature_index_sun_felt = []
    precipitation_index = []
    wind_index = []
    rain_index = []
    snow_index = []
    shade_temperatures = []
    sun_temperatures = []
    shade_felt_temperatures = []
    sun_felt_temperatures = []
    climbing_probability_sun = []
    climbing_probability_shade = []
    # organize data
    for weather in forecast:
        date_str = str(weather.get_reference_time('date'))
        datetime_obj = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S+00:00")
        utc_times.append(datetime_obj)
        local_time = datetime_obj + timedelta(minutes=Timezoneshift)
        local_times.append(local_time)
        hours.append(local_time.hour)
        days.append(local_time.day)
        months.append(local_time.month)
        actual_temperatures.append(weather.get_temperature('celsius')['temp'])
        wind_speeds.append(weather.get_wind()['speed']*3.6)
        humidity_values.append(weather.get_humidity())
        cloudiness_values.append(weather.get_clouds())
        weather_statuses.append(weather.get_detailed_status())
        rain_data = weather.get_rain()
        if rain_data:
            rain_amounts.append(rain_data.get('3h', 0))
        else:
            rain_amounts.append(0)
        snow_data = weather.get_snow()
        if snow_data:
            snow_amounts.append(snow_data.get('3h', 0))
        else:
            snow_amounts.append(0)
    # calculations
    i = 0
    while i < len(local_times):
        # Calculate shade temperature (same as actual temperature)
        shade_temperatures.append(actual_temperatures[i])

        # Calculate sun temperature (adjusted for sunlight based on time of day)
        if hours[i] < sunrise or hours[i] > sunset:
            # No sun adjustment during night hours
            sun_temperatures.append(actual_temperatures[i])
        else:
            # Add sun factor adjusted by cloudiness during daylight hours
            sun_temperatures.append(actual_temperatures[i] + sunfactor * (1 - cloudiness_values[i]/100))

        # Calculate felt temperature in shade using wind chill or heat index formulas
        if shade_temperatures[i] <= 10:
            # Wind chill formula for cold temperatures
            shade_felt_temperatures.append(
                13.12 + 0.6215 * shade_temperatures[i] - 11.37 * wind_speeds[i]**0.16 + 0.3965 * shade_temperatures[i] * wind_speeds[i]**0.16)
        elif shade_temperatures[i] >= 20:
            # Heat index formula for hot temperatures
            shade_felt_temperatures.append(-8.784695 + 1.61139411 * shade_temperatures[i] + 2.338549 * humidity_values[i] - 
                               0.14611605 * shade_temperatures[i] * humidity_values[i] - 0.012308094 * shade_temperatures[i]**2 - 
                               0.016424828 * humidity_values[i]**2 + 0.002211732 * shade_temperatures[i]**2 * humidity_values[i] + 
                               0.00072546 * shade_temperatures[i] * humidity_values[i]**2 - 0.000003582 * shade_temperatures[i]**2 * humidity_values[i]**2)
        else:
            # For moderate temperatures, felt temperature equals actual temperature
            shade_felt_temperatures.append(shade_temperatures[i])

        # Calculate felt temperature in sun using wind chill or heat index formulas
        if sun_temperatures[i] <= 10:
            # Wind chill formula for cold temperatures
            sun_felt_temperatures.append(
                13.12 + 0.6215 * sun_temperatures[i] - 11.37 * wind_speeds[i]**0.16 + 0.3965 * sun_temperatures[i] * wind_speeds[i]**0.16)
        elif sun_temperatures[i] >= 20:
            # Heat index formula for hot temperatures
            sun_felt_temperatures.append(-8.784695 + 1.61139411 * sun_temperatures[i] + 2.338549 * humidity_values[i] - 
                             0.14611605 * sun_temperatures[i] * humidity_values[i] - 0.012308094 * sun_temperatures[i]**2 - 
                             0.016424828 * humidity_values[i]**2 + 0.002211732 * sun_temperatures[i]**2 * humidity_values[i] + 
                             0.00072546 * sun_temperatures[i] * humidity_values[i]**2 - 0.000003582 * sun_temperatures[i]**2 * humidity_values[i]**2)
        else:
            # For moderate temperatures, felt temperature equals actual temperature
            sun_felt_temperatures.append(sun_temperatures[i])

        # Calculate total precipitation
        precipitation_amounts.append(rain_amounts[i] + snow_amounts[i])

        # Calculate temperature indices for shade and sun
        temperature_index_shade_felt.append(gauss(shade_felt_temperatures[i], Topt, Twid/2.35482))
        temperature_index_sun_felt.append(gauss(sun_felt_temperatures[i], Topt, Twid/2.35482))

        # Calculate precipitation and wind indices
        precipitation_index.append(special.erfc((precipitation_amounts[i] - Pcut) * 2.35482 / Pwid) / 2)
        wind_index.append(special.erfc((wind_speeds[i] - Wcut) * 2.35482 / Wwid) / 2)
        # Calculate rock wetness based on rain history
        j = 0
        rain_probability_list = []
        while j < i:
            if rain_amounts[j] == 0:
                rain_probability_list.append(1)  # No rain means dry rock
            else:
                # Calculate hours since rain
                hours_since_rain = (j-i)*3

                # Determine wetness probability based on rain intensity
                if rain_amounts[j] > 0 and rain_amounts[j] < 7.5:
                    # Light rain
                    rain_probability_list.append(special.erfc(
                        (hours_since_rain-Rcut_light)*2.35482/Rwid_light)/2)
                elif rain_amounts[j] >= 7.5 and rain_amounts[j] < 30:
                    # Moderate rain
                    rain_probability_list.append(special.erfc(
                        (hours_since_rain-Rcut_moderate)*2.35482/Rwid_moderate)/2)
                elif rain_amounts[j] >= 30 and rain_amounts[j] < 150:
                    # Strong rain
                    rain_probability_list.append(special.erfc(
                        (hours_since_rain-Rcut_strong)*2.35482/Rwid_strong)/2)
                else:  # rain_amounts[j] >= 150
                    # Violent rain
                    rain_probability_list.append(special.erfc(
                        (hours_since_rain-Rcut_violent)*2.35482/Rwid_violent)/2)
            j += 1

        # Set rain index based on minimum probability (worst case)
        if i == 0:
            rain_index.append(1)  # First forecast point has no history
        else:
            rain_index.append(np.min(rain_probability_list))

        # Calculate rock wetness based on snow history
        j = 0
        snow_probability_list = []
        while j < i:
            if snow_amounts[j] == 0:
                snow_probability_list.append(1)  # No snow means dry rock
            else:
                # Calculate hours since snow
                hours_since_snow = (j-i)*3

                # Determine wetness probability based on snow intensity
                if snow_amounts[j] > 0 and snow_amounts[j] < 7.5:
                    # Light snow
                    snow_probability_list.append(special.erfc(
                        (hours_since_snow-Rcut_light)*2.35482/Rwid_light)/2)
                elif snow_amounts[j] >= 7.5 and snow_amounts[j] < 30:
                    # Moderate snow
                    snow_probability_list.append(special.erfc(
                        (hours_since_snow-Rcut_moderate)*2.35482/Rwid_moderate)/2)
                elif snow_amounts[j] >= 30 and snow_amounts[j] < 150:
                    # Strong snow
                    snow_probability_list.append(special.erfc(
                        (hours_since_snow-Rcut_strong)*2.35482/Rwid_strong)/2)
                else:  # snow_amounts[j] >= 150
                    # Violent snow
                    snow_probability_list.append(special.erfc(
                        (hours_since_snow-Rcut_violent)*2.35482/Rwid_violent)/2)
            j += 1

        # Set snow index based on minimum probability (worst case)
        if i == 0:
            snow_index.append(1)  # First forecast point has no history
        else:
            snow_index.append(np.min(snow_probability_list))
        # Calculate climbing condition probabilities
        # Combine all indices to get overall climbing probability
        climbing_probability_sun.append(100 * (
            temperature_index_sun_felt[i] * 
            wind_index[i] * 
            precipitation_index[i] * 
            rain_index[i] * 
            snow_index[i]
        ))

        climbing_probability_shade.append(100 * (
            temperature_index_shade_felt[i] * 
            wind_index[i] * 
            precipitation_index[i] * 
            rain_index[i] * 
            snow_index[i]
        ))

        # Convert to imperial units if requested
        if isImperial:
            # Temperature: Celsius to Fahrenheit
            actual_temperatures[i] = 9/5 * actual_temperatures[i] + 32
            sun_felt_temperatures[i] = 9/5 * sun_felt_temperatures[i] + 32
            shade_felt_temperatures[i] = 9/5 * shade_felt_temperatures[i] + 32

            # Speed: km/h to mph
            wind_speeds[i] = wind_speeds[i] / 1.609344

            # Precipitation: mm to inches
            rain_amounts[i] = rain_amounts[i] / 25.4
            snow_amounts[i] = snow_amounts[i] / 25.4

            # Update labels for imperial units
            label_accumulation = "in"
            label_speed = "mph"
            label_temp = "°F"

        # Round values for display
        actual_temperatures[i] = round(actual_temperatures[i], 1)
        sun_felt_temperatures[i] = round(sun_felt_temperatures[i], 1)
        shade_felt_temperatures[i] = round(shade_felt_temperatures[i], 1)
        # cloudiness_values doesn't need rounding as it's already an integer percentage
        wind_speeds[i] = round(wind_speeds[i], 1)
        # humidity_values doesn't need rounding as it's already an integer percentage
        rain_amounts[i] = round(rain_amounts[i], 2)  # Two decimal places for precipitation
        snow_amounts[i] = round(snow_amounts[i], 2)  # Two decimal places for precipitation
        climbing_probability_sun[i] = round(climbing_probability_sun[i], 1)
        climbing_probability_shade[i] = round(climbing_probability_shade[i], 1)

        # Move to next forecast point
        i += 1

    resp_json = {
        "time": utc_times,
        "timemonth": months,
        "timeday": days,
        "timehr": hours,
        "status": weather_statuses,
        "chart_pairing": {
            "rain_chart": {
                "rows": [rain_amounts],
                "dataSet_labels": ["Accumulation (" + label_accumulation + ")"],
                "labels": local_times,
                "axis_labels": {
                    "yAxis": "Accumulation (" + label_accumulation + ")",
                    "xAxis": ""
                },
                "title": "Rain Accumulation",
                "format": label_accumulation,
                "show_legend": "none",
                "fullScreen": False
            },
            "snow_chart": {
                "rows": [snow_amounts],
                "dataSet_labels": ["Accumulation (" + label_accumulation + ")"],
                "labels": local_times,
                "axis_labels": {
                    "yAxis": "Accumulation (" + label_accumulation + ")",
                    "xAxis": ""
                },
                "title": "Snow Accumulation",
                "format": label_accumulation,
                "show_legend": "none",
                "fullScreen": False
            },
            "cloudiness_chart": {
                "rows": [cloudiness_values],
                "dataSet_labels": ["Cloudiness (" + label_percent + ")"],
                "labels": local_times,
                "axis_labels": {
                    "yAxis": "Cloudiness (" + label_percent + ")",
                    "xAxis": ""
                },
                "title": "Cloudiness",
                "format": label_percent,
                "show_legend": "none",
                "fullScreen": False
            },
            "humidity_chart": {
                "rows": [humidity_values],
                "dataSet_labels": ["Humidity (" + label_percent + ")"],
                "labels": local_times,
                "title": "Humidity",
                "axis_labels": {
                    "yAxis": "Humidity (" + label_percent + ")",
                    "xAxis": ""
                },
                "format": label_percent,
                "show_legend": "none",
                "fullScreen": False
            },
            "wind_chart": {
                "rows": [wind_speeds],
                "dataSet_labels": ["Wind (" + label_speed + ")"],
                "labels": local_times,
                "title": "Wind",
                "axis_labels": {
                    "yAxis": "Wind (" + label_speed + ")",
                    "xAxis": ""
                },
                "format": label_speed,
                "show_legend": "none",
                "fullScreen": False
            },
            "temperature_felt_chart": {
                "rows": [sun_felt_temperatures, shade_felt_temperatures, actual_temperatures],
                "dataSet_labels": ["Sun", "Shade", "Actual"],
                "labels": local_times,
                "title": "Temperature Felt",
                "format": label_temp,
                "axis_labels": {
                    "yAxis": "Temperature Felt (" + label_temp + ")",
                    "xAxis": ""
                },
                "show_legend": "",
                "fullScreen": True
            },
            "fun_chart": {
                "rows": [climbing_probability_sun, climbing_probability_shade],
                "dataSet_labels": ["In Sun", "In Shade"],
                "labels": local_times,
                "title": "Climbing Fun",
                "format": label_percent,
                "axis_labels": {
                    "yAxis": "Climbing Fun (" + label_percent + ")",
                    "xAxis": ""
                },
                "show_legend": "",
                "fullScreen": True
            }
        }
    }

    return resp_json
