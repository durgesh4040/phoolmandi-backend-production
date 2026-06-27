import winston, { format } from 'winston';
import DailyRotateFile from "winston-daily-rotate-file";
import {getRequestId} from "../middleware/requestId.js"
// Injects the current requestId into every log entry for request tracing
const requestIdFormat = format((info) => {
  info.requestId = getRequestId();
  return info;
});

var options = {
  allfile: {
    level: 'silly',
    filename: './logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    handleExceptions: true,
    json: true,
    maxsize: '50m',
    maxFiles: 30,
    colorize: false,
  },
  errorfile: {
    level: 'error',
    filename: './logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    handleExceptions: true,
    json: true,
    maxsize: '50m',
    maxFiles: 30,
    colorize: false,
  },
  combinedfile: {
    level: 'info',
    filename: './logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    handleExceptions: true,
    json: true,
    maxsize: '50m',
    maxFiles: 30,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

var logger = winston.createLogger({
  format: format.combine(
    requestIdFormat(),
    format.timestamp(),
    format.splat(),
    format.json()
  ),
  transports: [
    new DailyRotateFile(options.allfile),
    new DailyRotateFile(options.errorfile),
    new DailyRotateFile(options.combinedfile),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false,
});

logger.stream = {
  write: function (message, encoding) {
    logger.info(message);
  },
};

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
export default logger;
