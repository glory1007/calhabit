import { DayWeather } from '../types';

export function getWeatherForDate(date: Date): DayWeather {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const seed = (month * 31 + day) % 100;

  let baseHigh = 20;
  let baseLow = 12;

  if (month >= 12 || month <= 2) {
    baseHigh = 4 + (seed % 6) - 2;
    baseLow = -5 + (seed % 6) - 3;
  } else if (month >= 3 && month <= 5) {
    baseHigh = 16 + (seed % 8);
    baseLow = 7 + (seed % 6);
  } else if (month >= 6 && month <= 8) {
    baseHigh = 28 + (seed % 6);
    baseLow = 22 + (seed % 5);
  } else {
    baseHigh = 19 + (seed % 6);
    baseLow = 10 + (seed % 5);
  }

  let condition: DayWeather['condition'] = 'sunny';
  let icon = '맑음';
  let summary = '맑음';

  if (seed % 5 === 0) {
    condition = 'rainy';
    icon = '비';
    summary = '비';
  } else if (seed % 3 === 0) {
    condition = 'partlyCloudy';
    icon = '구름';
    summary = '구름조금';
  } else if (seed % 4 === 0) {
    condition = 'cloudy';
    icon = '흐림';
    summary = '흐림';
  } else if (month <= 2 && seed % 7 === 0) {
    condition = 'snow';
    icon = '눈';
    summary = '눈';
  }

  return {
    tempHigh: baseHigh,
    tempLow: baseLow,
    condition,
    icon,
    summary,
  };
}
