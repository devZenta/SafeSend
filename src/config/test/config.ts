import COMMON_CONFIG from '../common/config.js';
import { type AppConfig } from 'application-services';

const CONFIG: AppConfig = {
  ...COMMON_CONFIG,
  BASE_ENV: {
    JWT_SECRET: 'oudelali',
    SMTP_CONNECTION_URL: 'smtp://localhost:1025',
  },
  HOST: 'localhost',
  // Let's mock the time starting at a special date when testing
  CLOCK_MOCK: {
    isFixed: false,
    mockedTime: Date.parse('2012-01-15T00:00:00Z'),
    referenceTime: Date.now(),
  },
};

export default CONFIG;
