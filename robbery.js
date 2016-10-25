'use strict';

exports.isStar = true;

var TIME_ZONE;

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var index = 0;
    // console.info(schedule, duration, workingHours);

    TIME_ZONE = parseInt(workingHours.from.split('+')[1]) % 24;
    workingHours.from = workingHours.from.slice(0, 8);
    workingHours.to = workingHours.to.slice(0, 8);

    schedule = invertSchedule(schedule);
    setTimeStamps(schedule);
    var bestAttackTime = filterSchedule(schedule, workingHours, duration);
    var startTimesToAttack = getStartTimes(bestAttackTime, duration);

    var replacer = function (match, p) {
        var timeDiff = TIME_ZONE * 60 * 60 * 1000;
        var format = {
            '%HH': function (time) {
                var hours = new Date(time + timeDiff).getUTCHours();

                return addZero(hours);
            },
            '%MM': function (time) {
                var minutes = new Date(time + timeDiff).getUTCMinutes();

                return addZero(minutes);
            },
            '%DD': function (time) {
                var days = {
                    0: 'ВС',
                    1: 'ПН',
                    2: 'ВТ',
                    3: 'СР',
                    4: 'ЧТ'
                };
                var day = new Date(time + timeDiff).getUTCDay();

                return days[day];
            }
        };

        return format[p](startTimesToAttack[index]);
    };

    return {
        exists: function () {
            return startTimesToAttack.length > 0;
        },

        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            return template.replace(/(%\S\S)/g, replacer);
        },

        tryLater: function () {
            if (index < startTimesToAttack.length - 1) {
                index++;

                return true;
            }

            return false;
        }
    };
};

function addZero(digit) {
    if (digit.toString().length === 1) {

        return '0' + digit.toString();
    }

    return digit;
}

function getStartTimes(bestAttackTime, duration) {
    var times = [];
    var halfHour = 30 * 60 * 1000;
    var count = 0;
    var durationInMilliseconds = duration * 60 * 1000;
    for (var i = 0; i < bestAttackTime.length; i++) {
        if (bestAttackTime[i].from +
            count * halfHour +
            durationInMilliseconds <= bestAttackTime[i].to) {
            times.push(bestAttackTime[i].from + count * halfHour);
            i--;
            count++;
        } else {
            count = 0;
        }
    }

    return times;
}

function filterSchedule(schedule, workingHours, duration) {
    var names = Object.keys(schedule);

    var bankSchedule = [];
    ['ПН ', 'ВТ ', 'СР '].forEach(function (day) {
        bankSchedule.push({
            from: getTimeStamp(day + workingHours.from + TIME_ZONE.toString()),
            to: getTimeStamp(day + workingHours.to + TIME_ZONE.toString())
        });
    });

    var tIntrsc = getSchedulesIntersection(bankSchedule, schedule[names[0]]);
    for (var i = 1; i < names.length; i++) {
        tIntrsc = getSchedulesIntersection(schedule[names[i]], tIntrsc);
    }

    var durationInMilliseconds = duration * 60 * 1000;

    return tIntrsc.filter(function (time) {
        return time.from + durationInMilliseconds <= time.to;
    });
}

function getSchedulesIntersection(schedule1, schedule2) {
    var intersections = [];
    schedule1.forEach(function (sc1) {
        schedule2.forEach(function (sc2) {
            var intersection = getTimeIntersection(sc1, sc2);
            if (intersection.exist) {
                intersections.push(intersection);
            }
        });
    });

    return intersections;
}

function invertSchedule(schedule) {
    var _new = {};
    Object.keys(schedule).forEach(function (name) {
        var busyTime = schedule[name];
        var freeTime = [];

        freeTime.push({
            from: 'ПН 00:00+' + TIME_ZONE.toString(),
            to: busyTime[0].from
        });

        for (var i = 1; i < busyTime.length; i++) {
            freeTime.push({
                from: busyTime[i - 1].to,
                to: busyTime[i].from
            });
        }

        freeTime.push({
            from: busyTime[busyTime.length - 1].to,
            to: 'ВС 23:59+' + TIME_ZONE.toString()
        });
        _new[name] = freeTime;
    });

    return _new;
}

function setTimeStamps(schedule) {
    Object.keys(schedule).forEach(function (name) {
        schedule[name].forEach(function (time) {
            time.from = getTimeStamp(time.from);
            time.to = getTimeStamp(time.to);
        });
    });
}

function getTimeIntersection(firstRange, secondRange) {
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

function getTimeStamp(date) {
    var toFullDate = {
        ПН: '01-04-2016',
        ВТ: '01-05-2016',
        СР: '01-06-2016',
        ЧТ: '01-07-2016',
        ПТ: '01-08-2016',
        СБ: '01-09-2016',
        ВС: '01-10-2016'
    };
    var day = date.split(' ')[0];
    var time = date.split(' ')[1];

    return Date.parse(toFullDate[day] + ' ' + time);
}
