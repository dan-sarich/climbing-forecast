import { Controller, Get, Post, Body } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherDataDto } from './dto/weather-data.dto';

@Controller('api/weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  getIndex() {
    return { message: 'Welcome to the Weather API', timestamp: new Date().toISOString() };
  }

  @Post('data')
  async getWeatherData(@Body() weatherDataDto: WeatherDataDto) {
    return this.weatherService.getWeatherConditions(
      weatherDataDto.lat,
      weatherDataDto.lng,
      weatherDataDto.imperial,
      weatherDataDto.utc_offset
    );
  }
}