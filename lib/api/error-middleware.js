const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf((info) => {
  return `${info.timestamp}.[${info.label}].${info.level}: ${info.message}. Stack: ${info.stack}`;
});

const logger = createLogger({
  format: combine(
    label({ label: 'general' }),
    timestamp(),
    myFormat
  ),
  transports: [
    new transports.File({ filename: 'error.log' })
  ]
});

module.exports = function (err, req, res, next)  {
  logger.error(err);

  let response = {
    error: err.message
  };
  if (err.errors) {
    response.errors = err.errors;
    if (!err.status) err.status = 400; // correct validation
  }
  let status = err.status || 500;

  res.status(status);
  res.send(response);
};