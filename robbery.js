'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    var freeTimesSchedule = getFreeTime(schedule, workingHours);
    convertToTimeStamps(freeTimesSchedule, workingHours);
    var attackTimes = getAttackTimes(freeTimesSchedule, workingHours);

    var correctAttackTimes = filterAttackTimes(attackTimes, duration);

    var replacer = function (match, p) {
        var format = {
            '%HH': function(time) {
                return new Date(time).getHours();
            },
            '%MM': function(time) {
                var minutes = new Date(time).getMinutes();

                return ('0'+-~(minutes - 1)).substr(-2,2);
            },
            '%DD': function(time) {
                var days = {
                    1: 'ПН',
                    2: 'ВТ',
                    3: 'СР'
                };

                var day = new Date(time).getDay();
                return days[day];
            }
        };
        return format[p](correctAttackTimes[0].from);
    };


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return correctAttackTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {

                return '';
            }

            return template.replace(/(%\S\S)/g, replacer);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            correctAttackTimes[0].from += 30 * 60 * 1000;
            var _correctAttackTimes = filterAttackTimes(correctAttackTimes, duration);
            if (_correctAttackTimes.length > 0) {
                correctAttackTimes = _correctAttackTimes;

                return true;
            }
            correctAttackTimes[0].from -= 30 * 60 * 1000;

            return false;
        }
    };
};

function print(times) {
    times.forEach(function (time) {
        console.log(timeToString(time.from) + ' - ' + timeToString(time.to));
    });
}

function filterAttackTimes(attackTimes, duration) {
    var durationInMilliseconds = duration * 60 * 1000;

    return attackTimes.filter(function(time) {
        return time.from + durationInMilliseconds <= time.to;
    });
}

function getAttackTimes(schedule, workingHours) {
    var attackTimes = [];

    var names = Object.keys(schedule);

    var bankSchedule = [];
    ['ПН ', 'ВТ ', 'СР '].forEach(function(day) {
        bankSchedule.push({
            from: getGangstaTimeStamp(day + workingHours.from),
            to: getGangstaTimeStamp(day + workingHours.to)
        });
    });

    attackTimes = getSchedulesIntersection(bankSchedule, schedule[names[0]]);
    for (var i = 1; i < names.length; i++) {
        attackTimes = getSchedulesIntersection(schedule[names[i]], attackTimes);
    }

    return attackTimes;
}

function timeToString(time) {
    var days = {
        1: 'ПН',
        2: 'ВТ',
        3: 'СР'
    };

    var date = new Date(time);
    return days[date.getDay()] + ' ' + date.getHours() + ':' + date.getMinutes();
}

function getSchedulesIntersection(schedule1, schedule2) {
    var intersections = [];
    for (var i = 0; i < schedule1.length; i++) {
        for (var j = 0; j < schedule2.length; j++) {
            var intersection = getTimeIntersection(schedule1[i], schedule2[j]);
            if (intersection.exist) {
                intersections.push(intersection);
            }
        }
    }

    return intersections;
}

function getFreeTime(schedule, workingHours) {
    var freeSchedule = {};
    Object.keys(schedule).forEach(function(gang) {
        var gangsta = schedule[gang];
        var freeTimes = [];

        freeTimes.push({
            from: 'ПН ' + workingHours.from,
            to: gangsta[0].from
        });

        for (var i = 1; i < gangsta.length; i++) {
            freeTimes.push({
                from: gangsta[i - 1].to,
                to: gangsta[i].from
            });
        }

        freeTimes.push({
            from: gangsta[gangsta.length - 1].to,
            to: 'СР ' + workingHours.to
        });

        freeSchedule[gang] = freeTimes;
    });

    return freeSchedule;
}

function convertToTimeStamps(schedule, workingHours) {
    Object.keys(schedule).forEach(function(gangsta) {
        schedule[gangsta].forEach(function(time, index) {
            time.from = getGangstaTimeStamp(time.from);
            time.to = getGangstaTimeStamp(time.to);
        });
    });
}

function getTimeIntersection(firstRange, secondRange) { // ..Range : TimeStamp
    var intersection = {
        exist: false,
        from: Math.max(firstRange.from, secondRange.from),
        to: Math.min(firstRange.to, secondRange.to)
    };

    if (intersection.from < intersection.to) {
        intersection.exist = true;
    }

    return intersection;
}

function getGangstaTimeStamp(date) { // 'ПН 09:00+3'
    var convertWeekDay = {
        ПН: '01-04-2016',
        ВТ: '01-05-2016',
        СР: '01-06-2016'
    };
    var weekDay = date.split(' ')[0];
    var time = date.split(' ')[1];

    return new Date(convertWeekDay[weekDay] + ' ' + time).getTime();
}
