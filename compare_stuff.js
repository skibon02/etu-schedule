let fetch = require("node-fetch");

async function run()
{
    let g0303 = null;
    await fetch("https://digital.etu.ru/api/schedule/objects/publicated?groups=4362&withSubjectCode=true&withURL=true", {
        "headers": {
            "accept": "*/*",
        },
        "body": null,
        "method": "GET",
    }).then(res=>res.json()).then(res=>{g0303 = res[0].scheduleObjects});

    let g0304 = null;
    await fetch("https://digital.etu.ru/api/schedule/objects/publicated?groups=4361&withSubjectCode=true&withURL=true", {
        "headers": {
            "accept": "*/*",
        },
        "body": null,
        "method": "GET",
    }).then(res=>res.json()).then(res=>{g0304 = res[0].scheduleObjects});

    let lessonIDcnt = {};
    let schedIDcnt = {};
    let subjectIDcnt = {};
    let alienIDcnt = {};

    let teacherIDcnt = {};
    let teacherAlienIDcnt = {};

    let auditoriumReservationIDcnt = {};
    let auditoriumReservTimeIDcnt = {};

    function fillSchedID(arr) {
        for (schedObj of arr) {
            let val = schedObj.id;
            if (schedIDcnt[val]) {
                schedIDcnt[val] += 1;
            }
            else {
                schedIDcnt[val] = 1;
            }
        }
    }
    function fillLessonID(arr) {
        for (schedObj of arr) {
            let val = schedObj.lessonId;
            if (lessonIDcnt[val]) {
                lessonIDcnt[val] += 1;
            }
            else {
                lessonIDcnt[val] = 1;
            }
        }
    }
    function fillSubjID(arr) {
        for (schedObj of arr) {
            let val = schedObj.lesson.subject.id;
            if (subjectIDcnt[val]) {
                subjectIDcnt[val] += 1;
            }
            else {
                subjectIDcnt[val] = 1;
            }
        }
    }

    function fillAlienID(arr) {
        for (schedObj of arr) {
            let val = schedObj.lesson.subject.alienId;
            if (alienIDcnt[val]) {
                alienIDcnt[val] += 1;
            }
            else {
                alienIDcnt[val] = 1;
            }
        }
    }

    function fillTeacherID(arr) {
        for (schedObj of arr) {
            let val = "teacher is null"
            if (schedObj.lesson.teacher != null) {
                val = schedObj.lesson.teacher.id;
            }
            if (teacherIDcnt[val]) {
                teacherIDcnt[val] += 1;
            }
            else {
                teacherIDcnt[val] = 1;
            }
        }
    }
    function fillTeacherAlienID(arr) {
        for (schedObj of arr) {
            let val = "teacher is null"
            if (schedObj.lesson.teacher != null) {
                val = schedObj.lesson.teacher.alienId;
            }
            if (teacherAlienIDcnt[val]) {
                teacherAlienIDcnt[val] += 1;
            }
            else {
                teacherAlienIDcnt[val] = 1;
            }
        }
    }

    function fillAuditoriumReservationID(arr) {
        for (schedObj of arr) {
            let val = schedObj.lesson.auditoriumReservation.id;
            if (auditoriumReservationIDcnt[val]) {
                auditoriumReservationIDcnt[val] += 1;
            }
            else {
                auditoriumReservationIDcnt[val] = 1;
            }
        }
    }
    function fillAuditoriumReservTimeID(arr) {
        for (schedObj of arr) {
            let val = schedObj.lesson.auditoriumReservation.reservationTime.id;
            if (auditoriumReservTimeIDcnt[val]) {
                auditoriumReservTimeIDcnt[val] += 1;
            }
            else {
                auditoriumReservTimeIDcnt[val] = 1;
            }
        }
    }

    fillLessonID(g0303)
    // fillLessonID(g0304)
    fillSchedID(g0303)
    // fillSchedID(g0304)
    fillSubjID(g0303)
    // fillSubjID(g0304)
    fillAlienID(g0303)
    // fillAlienID(g0304)

    fillTeacherID(g0303)
    // fillTeacherID(g0304)
    fillTeacherAlienID(g0303)
    // fillTeacherAlienID(g0304)

    fillAuditoriumReservationID(g0303)
    // fillAuditoriumReservationID(g0304)
    fillAuditoriumReservTimeID(g0303)
    // fillAuditoriumReservTimeID(g0304)


    console.log("LessonIDcnt: ")
    console.dir(lessonIDcnt);
    console.log("schedIDcnt: ")
    console.dir(schedIDcnt);
    console.log("subjectIDcnt: ") 
    console.dir(subjectIDcnt);
    console.log("alienIDcnt: ")
    console.dir(alienIDcnt);
    console.log("teacherIDcnt: ")
    console.dir(teacherIDcnt);
    console.log("teacherAlienIDcnt: ")
    console.dir(teacherAlienIDcnt);

    console.log("auditoriumReservationIDcnt: ")
    console.dir(auditoriumReservationIDcnt);
    console.log("auditoriumReservTimeIDcnt: ")
    console.dir(auditoriumReservTimeIDcnt);


    console.log("LessonID elements: " + Object.keys(lessonIDcnt).length)
    console.log("schedID elements: " + Object.keys(schedIDcnt).length)
    console.log("subjectID elements: " + Object.keys(subjectIDcnt).length)
    console.log("alienID elements: " + Object.keys(alienIDcnt).length)
    console.log("teacherID elements: " + Object.keys(teacherIDcnt).length)
    console.log("teacherAlienID elements: " + Object.keys(teacherAlienIDcnt).length)

    console.log("auditoriumReservationID elements: " + Object.keys(auditoriumReservationIDcnt).length)
    console.log("auditoriumReservTimeID elements: " + Object.keys(auditoriumReservTimeIDcnt).length)

}
run()
