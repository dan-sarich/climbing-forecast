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
    return render_template('index.html', apiKey=PLACES_API_key)

# This python function requires the coordinates of a place in lat and lon and returns: time, month, day, hour, whetherstatus, actual temperature, temp felt in sun, temp felt in shade,cloudiness,wind_act,humidity_act,rain_act,Probability fun in sun and shade
@app.route('/data', methods=['POST'])
def getconditions():
    # POST request

    print('Incoming..')
    data = request.get_json(force=True)
    print(data)  # parse as JSON
    lat = data['lat']
    lng = data['lng']

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
    sunfactor = 10
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
    # get timezone
    a = requests.get(
        'http://api.timezonedb.com/v2.1/get-time-zone?key=CO1O5TJW8L3Y&format=json&by=position&lat='+str(lat)+'&lng='+str(lng))
    Timezone = a.json()['zoneName']
    # get the wheather
    API_key = app.config['OWM_API_KEY']
    owm = OWM(API_key)
    fc = owm.three_hours_forecast_at_coords(float(lat), float(lng))
    f = fc.get_forecast()
    # Calculations alculating probability
    time = []
    temperature_act = []
    wind_act = []
    humidity_act = []
    timehr = []
    timeday = []
    timemonth = []
    cloudiness = []
    rain_act = []
    snow_act = []
    status = []
    P_act = []
    IT_shade_felt = []
    IT_sun_felt = []
    IP_act = []
    IWac = []
    IRac = []
    ISac = []
    Tshade = []
    Tsun = []
    Tshade_felt = []
    Tsun_felt = []
    P_sun = []
    P_shadow = []
    # organize data
    for weather in f:
        date_str = str(weather.get_reference_time('date'))
        datetime_obj = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S+00:00")
        datetime_obj_utc = datetime_obj.replace(tzinfo=timezone('UTC'))
        timelocal_dummy = datetime_obj_utc.astimezone(timezone(Timezone))
        time.append(timelocal_dummy)
        timehr.append(timelocal_dummy.hour)
        timeday.append(timelocal_dummy.day)
        timemonth.append(timelocal_dummy.month)
        temperature_act.append(weather.get_temperature('celsius')['temp'])
        wind_act.append(weather.get_wind()['speed']*3.6)
        humidity_act.append(weather.get_humidity())
        cloudiness.append(weather.get_clouds())
        status.append(weather.get_detailed_status())
        dummy = weather.get_rain()
        if not bool(dummy) == False:
            rain_act.append(dummy.get('3h', ""))
        if not bool(dummy) == True:
            rain_act.append(0)
        dummy = weather.get_snow()
        if not bool(dummy) == False:
            snow_act.append(dummy.get('3h', ""))
        if not bool(dummy) == True:
            snow_act.append(0)
    # calculations
    i = 0
    while i < len(time):
        Tshade.append(temperature_act[i])
        if timehr[i] < sunrise or timehr[i] > sunset:
            Tsun.append(temperature_act[i])
        if timehr[i] >= sunrise and timehr[i] <= sunset:
            Tsun.append(temperature_act[i]+sunfactor*(1-cloudiness[i]/100))
        if Tshade[i] <= 10:
            Tshade_felt.append(
                13.12+0.6215*Tshade[i]-11.37*wind_act[i]**0.16+0.3965*Tshade[i]*wind_act[i]**0.16)
        if Tshade[i] >= 20:
            Tshade_felt.append(-8.784695 + 1.61139411*Tshade[i] + 2.338549*humidity_act[i] - 0.14611605*Tshade[i]*humidity_act[i] - 0.012308094*Tshade[i]**2 - 0.016424828 *
                               humidity_act[i]**2 + 0.002211732*Tshade[i]**2*humidity_act[i] + 0.00072546*Tshade[i]*humidity_act[i]**2 - 0.000003582*Tshade[i]**2*humidity_act[i]**2)
        if Tshade[i] > 10 and Tshade[i] < 20:
            Tshade_felt.append(Tshade[i])
        if Tsun[i] <= 10:
            Tsun_felt.append(
                13.12+0.6215*Tsun[i]-11.37*wind_act[i]**0.16+0.3965*Tsun[i]*wind_act[i]**0.16)
        if Tsun[i] >= 20:
            Tsun_felt.append(-8.784695 + 1.61139411*Tsun[i] + 2.338549*humidity_act[i] - 0.14611605*Tsun[i]*humidity_act[i] - 0.012308094*Tsun[i]**2 - 0.016424828 *
                             humidity_act[i]**2 + 0.002211732*Tsun[i]**2*humidity_act[i] + 0.00072546*Tsun[i]*humidity_act[i]**2 - 0.000003582*Tsun[i]**2*humidity_act[i]**2)
        if Tsun[i] > 10 and Tsun[i] < 20:
            Tsun_felt.append(Tsun[i])
        P_act.append(rain_act[i]+snow_act[i])
        IT_shade_felt.append(gauss(Tshade_felt[i], Topt, Twid/2.35482))
        IT_sun_felt.append(gauss(Tsun_felt[i], Topt, Twid/2.35482))
        IP_act.append(special.erfc((P_act[i]-Pcut)*2.35482/Pwid)/2)
        IWac.append(special.erfc((wind_act[i]-Wcut)*2.35482/Wwid)/2)
        # caclulate wettness of rock based on rain
        j = 0
        LRainProb = []
        while j < i:
            if rain_act[j] == 0:
                LRainProb.append(1)
            if rain_act[j] > 0 and rain_act[j] < 7.5:
                drain = (j-i)*3
                LRainProb.append(special.erfc(
                    (drain-Rcut_light)*2.35482/Rwid_light)/2)
            if rain_act[j] >= 7.5 and rain_act[j] < 30:
                drain = (j-i)*3
                LRainProb.append(special.erfc(
                    (drain-Rcut_moderate)*2.35482/Rwid_moderate)/2)
            if rain_act[j] >= 30 and rain_act[j] < 150:
                drain = (j-i)*3
                LRainProb.append(special.erfc(
                    (drain-Rcut_strong)*2.35482/Rwid_strong)/2)
            if rain_act[j] >= 150:
                drain = (j-i)*3
                LRainProb.append(special.erfc(
                    (drain-Rcut_violent)*2.35482/Rwid_violent)/2)
            # print(LRainProb)
            j = j+1
        if i == 0:
            IRac.append(1)
        if i > 0:
            IRac.append(np.min(LRainProb))
        j = 0
        LSnowProb = []
        while j < i:
            if snow_act[j] == 0:
                LSnowProb.append(1)
            if snow_act[j] > 0 and snow_act[j] < 7.5:
                dsnow = (j-i)*3
                LSnowProb.append(special.erfc(
                    (dsnow-Rcut_light)*2.35482/Rwid_light)/2)
            if snow_act[j] >= 7.5 and snow_act[j] < 30:
                drain = (j-i)*3
                LSnowProb.append(special.erfc(
                    (dsnow-Rcut_moderate)*2.35482/Rwid_moderate)/2)
            if snow_act[j] >= 30 and snow_act[j] < 150:
                dsnow = (j-i)*3
                LSnowProb.append(special.erfc(
                    (dsnow-Rcut_strong)*2.35482/Rwid_strong)/2)
            if snow_act[j] >= 150:
                dsnow = (j-i)*3
                LSnowProb.append(special.erfc(
                    (dsnow-Rcut_violent)*2.35482/Rwid_violent)/2)
            # print(LRainProb)
            j = j+1
        if i == 0:
            ISac.append(1)
        if i > 0:
            ISac.append(np.min(LSnowProb))
    # Climbing conditions
        P_sun.append(100*(IT_sun_felt[i]*IWac[i]*IP_act[i]*IRac[i]*ISac[i]))
        P_shadow.append(
            100*(IT_shade_felt[i]*IWac[i]*IP_act[i]*IRac[i]*ISac[i]))
        i = i+1

    resp_json = {
        "time": time,
        "timemonth": timemonth,
        "timeday": timeday,
        "timehr": timehr,
        "timezone": Timezone,
        "status": status,
        "chart_pairing": {
            "rain_chart": {
                "rows": [rain_act],
                "dataSet_labels": ["Accumulation (mm)"],
                "labels": time,
                "axis_labels": {
                    "yAxis": "Accumulation (mm)",
                    "xAxis": ""
                },
                "title": "Rain Accumulation",
                "format": "",
                "show_legend": "none",
                "fullScreen": False
            },
            "snow_chart": {
                "rows": [snow_act],
                "dataSet_labels": ["Accumulation (mm)"],
                "labels": time,
                "axis_labels": {
                    "yAxis": "Accumulation (mm)",
                    "xAxis": ""
                },
                "title": "Snow Accumulation",
                "format": "",
                "show_legend": "none",
                "fullScreen": False
            },
            "cloudiness_chart": {
                "rows": [cloudiness],
                "dataSet_labels": ["Cloudiness (%)"],
                "labels": time,
                "axis_labels": {
                    "yAxis": "Cloudiness (%)",
                    "xAxis": ""
                },
                "title": "Cloudiness",
                "format": "percent",
                "show_legend": "none",
                "fullScreen": False
            },
            "humidity_chart": {
                "rows": [humidity_act],
                "dataSet_labels": ["Humidity (%)"],
                "labels": time,
                "title": "Humidity",
                "axis_labels": {
                    "yAxis": "Humidity (%)",
                    "xAxis": ""
                },
                "format": "percent",
                "show_legend": "none",
                "fullScreen": False
            },
            "wind_chart": {
                "rows": [wind_act],
                "dataSet_labels": ["Wind (km/h)"],
                "labels": time,
                "title": "Wind",
                "axis_labels": {
                    "yAxis": "Wind (km/h)",
                    "xAxis": ""
                },
                "format": "",
                "show_legend": "none",
                "fullScreen": False
            },
            "temperature_chart": {
                "rows": [temperature_act],
                "dataSet_labels": ["Temperature (C)"],
                "labels": time,
                "title": "Temperature",
                "format": "",
                "axis_labels": {
                    "yAxis": "Temperature (C)",
                    "xAxis": ""
                },
                "show_legend": "none",
                "fullScreen": False
            },
            "fun_chart": {
                "rows": [P_sun, P_shadow],
                "dataSet_labels": ["In Sun", "In Shade"],
                "labels": time,
                "title": "Climbing Fun",
                "format": "percent",
                "axis_labels": {
                    "yAxis": "Climbing Fun (%)",
                    "xAxis": ""
                },
                "show_legend": "",
                "fullScreen": True
            },
            "temperature_felt_chart": {
                "rows": [Tsun_felt, Tshade_felt],
                "dataSet_labels": ["Temp in Sun", "Temp in Shade"],
                "labels": time,
                "title": "Temperature Felt",
                "format": "",
                "axis_labels": {
                    "yAxis": "Temperature Felt (C)",
                    "xAxis": ""
                },
                "show_legend": "",
                "fullScreen": True
            }
        }
    }

    return resp_json
