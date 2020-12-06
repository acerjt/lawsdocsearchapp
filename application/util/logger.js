'use strict';
const winston = require('winston');
const format = winston.format;
const myFormat = format.printf(info => {
    const data = { timestamp: info.timestamp, message: info.message};
    return `${JSON.stringify(data)}`;
});
const path = require('path')

winston.loggers.add('default', {
    transports: [
        new winston.transports.File({
            maxsize: 10000000, /*10MB*/
            filename: path.resolve(__dirname + '/../logs/log.log'),
            format: format.combine(
                format.timestamp(),
                myFormat
            )
        }),
        new winston.transports.Console({
            format: format.combine(
                format.timestamp(),
                myFormat
            )
        })
    ]
});
winston.loggers.add('client', {
    transports: [
        new winston.transports.File({
            maxsize: 10000000, /*10MB*/
            filename: path.resolve(__dirname + '/../logs/client.log'),
            format: format.combine(
                format.timestamp(),
                myFormat
            ),
            maxFiles: 5
        })
    ]
});
// winston.loggers.add('userEventSms', {
//     transports: [
//         new winston.transports.File({
//             maxsize: 10000000, /*10MB*/
//             filename: __dirname + '/../../logs/userEventSms.log',
//             format: format.combine(
//                 format.timestamp(),
//                 myFormat
//             )
//         }),
//         new winston.transports.Console({
//             format: format.combine(
//                 format.timestamp(),
//                 myFormat
//             )
//         })
//     ]
// });
module.exports = {
    Logger: winston.loggers.get('default'),
    ClientLogger: winston.loggers.get('client')
};