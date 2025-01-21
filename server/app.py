from flask import Flask, request
import numpy as np
import os
from scipy import special
from pyowm import OWM
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route("/")
def index():
    return 'hello world'

# This python function requires the coordinates of a place in lat and lon and returns: time, month, day, hour, whether status, actual temperature, temp felt in sun, temp felt in shade,cloudiness,wind_act,humidity_act,rain_act,Probability fun in sun and shade
@app.route('/conditions', methods=['POST'])
def conditions():
    # POST request

    print('Incoming..')
    data = request.get_json(force=True)
    print(data)  # parse as JSON

    lat = data['lat']
    lng = data['lng']
    is_imperial = data['imperial']
    timezone_shift = data['utc_offset']

    # set data labels for frontend

    label_accumulation = "mm"
    label_speed = "km/h"
    label_temp = "°C"
    label_percent = "%"

    # setting optimal conditions
    #Temperature in C
    t_opt = 18
    t_wid = 20
    #wind in km/h
    w_cut = 30
    w_wid = 25
    #Perception in mm
    p_cut = 15
    p_wid = 18
    # Rock wetness in h after perception
    r_cut_light = -12
    r_wid_light = 12
    r_cut_moderate = -24
    r_wid_moderate = 12
    r_cut_strong = -36
    r_wid_strong = 12
    r_cut_violent = -48
    r_wid_violent = 12
    # other manual factors
    sun_factor = 8.3
    sunrise = 8
    sunset = 18

    def gauss(x, cent, wid):
        out = 1 * np.exp(-1.0 * (x - cent)**2 / (2 * wid**2))
        return out

    # get weather
    owm = OWM(os.environ.get('OWM_API_KEY'))
    fc = owm.three_hours_forecast_at_coords(float(lat), float(lng))
    f = fc.get_forecast()
    # Calculations calculating probability
    time = []
    time_global = []
    temperature_act = []
    wind_act = []
    humidity_act = []
    time_hr = []
    time_day = []
    time_month = []
    cloudiness = []
    rain_act = []
    snow_act = []
    status = []
    p_act = []
    it_shade_felt = []
    it_sun_felt = []
    ip_act = []
    i_wac = []
    i_rac = []
    i_sac = []
    t_shade = []
    t_sun = []
    t_shade_felt = []
    t_sun_felt = []
    p_sun = []
    p_shadow = []
    # organize data
    for weather in f:
        date_str = str(weather.get_reference_time('date'))
        datetime_obj = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S+00:00")
        time_global.append(datetime_obj)
        time_local = datetime_obj + timedelta(minutes=timezone_shift)
        time.append(time_local)
        time_hr.append(time_local.hour)
        time_day.append(time_local.day)
        time_month.append(time_local.month)
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
        t_shade.append(temperature_act[i])
        if time_hr[i] < sunrise or time_hr[i] > sunset:
            t_sun.append(temperature_act[i])
        if sunrise <= time_hr[i] <= sunset:
            t_sun.append(temperature_act[i]+sun_factor*(1-cloudiness[i]/100))
        if t_shade[i] <= 10:
            t_shade_felt.append(
                13.12+0.6215*t_shade[i]-11.37*wind_act[i]**0.16+0.3965*t_shade[i]*wind_act[i]**0.16)
        if t_shade[i] >= 20:
            t_shade_felt.append(-8.784695 + 1.61139411*t_shade[i] + 2.338549*humidity_act[i] - 0.14611605*t_shade[i]*humidity_act[i] - 0.012308094*t_shade[i]**2 - 0.016424828 *
                               humidity_act[i]**2 + 0.002211732*t_shade[i]**2*humidity_act[i] + 0.00072546*t_shade[i]*humidity_act[i]**2 - 0.000003582*t_shade[i]**2*humidity_act[i]**2)
        if 10 < t_shade[i] < 20:
            t_shade_felt.append(t_shade[i])
        if t_sun[i] <= 10:
            t_sun_felt.append(
                13.12+0.6215*t_sun[i]-11.37*wind_act[i]**0.16+0.3965*t_sun[i]*wind_act[i]**0.16)
        if t_sun[i] >= 20:
            t_sun_felt.append(-8.784695 + 1.61139411*t_sun[i] + 2.338549*humidity_act[i] - 0.14611605*t_sun[i]*humidity_act[i] - 0.012308094*t_sun[i]**2 - 0.016424828 *
                             humidity_act[i]**2 + 0.002211732*t_sun[i]**2*humidity_act[i] + 0.00072546*t_sun[i]*humidity_act[i]**2 - 0.000003582*t_sun[i]**2*humidity_act[i]**2)
        if 10 < t_sun[i] < 20:
            t_sun_felt.append(t_sun[i])
        p_act.append(rain_act[i]+snow_act[i])
        it_shade_felt.append(gauss(t_shade_felt[i], t_opt, t_wid/2.35482))
        it_sun_felt.append(gauss(t_sun_felt[i], t_opt, t_wid/2.35482))
        ip_act.append(special.erfc((p_act[i]-p_cut)*2.35482/p_wid)/2)
        i_wac.append(special.erfc((wind_act[i]-w_cut)*2.35482/w_wid)/2)
        # calculate wetness of rock based on rain
        j = 0
        l_rain_prob = []
        while j < i:
            if rain_act[j] == 0:
                l_rain_prob.append(1)
            if 0 < rain_act[j] < 7.5:
                drain = (j-i)*3
                l_rain_prob.append(special.erfc(
                    (drain-r_cut_light)*2.35482/r_wid_light)/2)
            if 7.5 <= rain_act[j] < 30:
                drain = (j-i)*3
                l_rain_prob.append(special.erfc(
                    (drain-r_cut_moderate)*2.35482/r_wid_moderate)/2)
            if 30 <= rain_act[j] < 150:
                drain = (j-i)*3
                l_rain_prob.append(special.erfc(
                    (drain-r_cut_strong)*2.35482/r_wid_strong)/2)
            if rain_act[j] >= 150:
                drain = (j-i)*3
                l_rain_prob.append(special.erfc(
                    (drain-r_cut_violent)*2.35482/r_wid_violent)/2)
            # print(LRainProb)
            j = j+1
        if i == 0:
            i_rac.append(1)
        if i > 0:
            i_rac.append(np.min(l_rain_prob))
        j = 0
        l_snow_prob = []
        while j < i:
            if snow_act[j] == 0:
                l_snow_prob.append(1)
            if 0 < snow_act[j] < 7.5:
                d_snow = (j-i)*3
                l_snow_prob.append(special.erfc(
                    (d_snow-r_cut_light)*2.35482/r_wid_light)/2)
            if 7.5 <= snow_act[j] < 30:
                d_snow = (j-i)*3
                l_snow_prob.append(special.erfc(
                    (d_snow-r_cut_moderate)*2.35482/r_wid_moderate)/2)
            if 30 <= snow_act[j] < 150:
                d_snow = (j-i)*3
                l_snow_prob.append(special.erfc(
                    (d_snow-r_cut_strong)*2.35482/r_wid_strong)/2)
            if snow_act[j] >= 150:
                d_snow = (j-i)*3
                l_snow_prob.append(special.erfc(
                    (d_snow-r_cut_violent)*2.35482/r_wid_violent)/2)
            # print(LRainProb)
            j = j+1
        if i == 0:
            i_sac.append(1)
        if i > 0:
            i_sac.append(np.min(l_snow_prob))
        # Climbing conditions
        p_sun.append(100*(it_sun_felt[i]*i_wac[i]*ip_act[i]*i_rac[i]*i_sac[i]))
        p_shadow.append(
            100*(it_shade_felt[i]*i_wac[i]*ip_act[i]*i_rac[i]*i_sac[i]))
        # test imperial
        if is_imperial:
            temperature_act[i] = 9/5*temperature_act[i]+32
            t_sun_felt[i] = 9/5*t_sun_felt[i]+32
            t_shade_felt[i] = 9/5*t_shade_felt[i]+32
            wind_act[i] = wind_act[i]/1.609344
            rain_act[i] = rain_act[i]/25.4
            snow_act[i] = snow_act[i]/25.4
            label_accumulation = "in"
            label_speed = "mph"
            label_temp = "°F"
        # round to one digit (rain and snow to two, inch is small)
        temperature_act[i] = round(temperature_act[i], 1)
        t_sun_felt[i] = round(t_sun_felt[i], 1)
        t_shade_felt[i] = round(t_shade_felt[i], 1)
        cloudiness[i] = cloudiness[i]
        wind_act[i] = round(wind_act[i], 1)
        humidity_act[i] = humidity_act[i]
        rain_act[i] = round(rain_act[i], 2)
        snow_act[i] = round(snow_act[i], 2)
        p_sun[i] = round(p_sun[i], 1)
        p_shadow[i] = round(p_shadow[i], 1)
        i = i+1

    resp_json = {
        "time": time_global,
        "time_month": time_month,
        "time_day": time_day,
        "time_hr": time_hr,
        "status": status,
        "chart_pairing": {
            "rain_chart": {
                "rows": [rain_act],
                "dataSet_labels": ["Accumulation (" + label_accumulation + ")"],
                "labels": time,
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
                "rows": [snow_act],
                "dataSet_labels": ["Accumulation (" + label_accumulation + ")"],
                "labels": time,
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
                "rows": [cloudiness],
                "dataSet_labels": ["Cloudiness (" + label_percent + ")"],
                "labels": time,
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
                "rows": [humidity_act],
                "dataSet_labels": ["Humidity (" + label_percent + ")"],
                "labels": time,
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
                "rows": [wind_act],
                "dataSet_labels": ["Wind (" + label_speed + ")"],
                "labels": time,
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
                "rows": [t_sun_felt, t_shade_felt, temperature_act],
                "dataSet_labels": ["Sun", "Shade", "Actual"],
                "labels": time,
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
                "rows": [p_sun, p_shadow],
                "dataSet_labels": ["In Sun", "In Shade"],
                "labels": time,
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