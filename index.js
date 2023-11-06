import express from "express"
import { Database } from "bun:sqlite";
const readline = require("readline")
const path = require('path')

const db = new Database("db.sqlite", {create: true});

import attend_token from "./token.js"

let api = express()

// api.use(express.static(path.join(__dirname, "./client/build")))
let port = 3000


api.get('/api', (req, res) => {
    res.send('hello world');
})


let alienIDs = {};
let schedIDs = {};

async function get_any_schedule(group_id) {
    let answ = await fetch("https://digital.etu.ru/api/schedule/objects/publicated?groups=" + group_id + "&withSubjectCode=true&withURL=true", {
      "headers": {
          "accept": "*/*",
      },
        "body": null,
        "method": "GET"
    }).then(res => res.json());

    answ = answ[0];
    if (!answ) {
        console.log("Нет такой группы " + group_id);
        return;
    }
    let subjID1 = {};
    let subjID2 = {};
    let subjdata = {};

    let group = answ.fullNumber;

    let objects = answ.scheduleObjects.map(inp => {
        let res = {};

        let teacher = inp.lesson.teacher ? 
        {
            name: inp.lesson.teacher.initials,
            fullName: inp.lesson.teacher.surname + " " + inp.lesson.teacher.name + " " + inp.lesson.teacher.midname,
            email: inp.lesson.teacher.email,
            birthday: inp.lesson.teacher.birthday,
            phone: inp.lesson.teacher.phone,
            workDepartments: inp.lesson.teacher.workDepartments
        } : null;

        res.schedObjId = inp.id; //for attendance
        res.subjInfo = { // about lesson and subject
            lessonID: inp.lesson.id,
            subjID: inp.lesson.subject.id,
            alienID: inp.lesson.subject.alienId,
            name: inp.lesson.subject.title,
            shortName: inp.lesson.subject.shortTitle,
            type: inp.lesson.subject.subjectType,
            controlType: inp.lesson.subject.controlType,

            teacher,
        }

        subjdata[res.subjInfo.subjID] = {
            name: res.subjInfo.name,
            type: res.subjInfo.type,
            controlType: res.subjInfo.controlType,
        }


        res.placeAndTime = {
            auditorium: inp.lesson.auditoriumReservation.auditoriumNumber,
            auditoriumUpdateTime: inp.lesson.auditoriumReservation.updatedAt,

            scheduleID: inp.lesson.auditoriumReservation.scheduleId,
            weekDay: inp.lesson.auditoriumReservation.reservationTime.weekDay,
            week: inp.lesson.auditoriumReservation.reservationTime.week,
            startTime: inp.lesson.auditoriumReservation.reservationTime.startTime,
            endTime: inp.lesson.auditoriumReservation.reservationTime.endTime,
        }

        if (res.placeAndTime.week == "1" ) {
            if (subjID1[res.subjInfo.subjID])
                subjID1[res.subjInfo.subjID] += 1;
            else
                subjID1[res.subjInfo.subjID] = 1;

        }
        else {
            if (subjID2[res.subjInfo.subjID])
                subjID2[res.subjInfo.subjID] += 1;
            else
                subjID2[res.subjInfo.subjID] = 1;

        }


        //asserts:
        if (inp.form != "standard")
            console.log("form is not standard! " + inp.form);

        if (inp.lesson.byHours1 !== false) {
            console.log("byHours1 is not false! " + inp.lesson.byHours1);
            throw new Error("byHours1 is not false! " + inp.lesson.byHours1);
        }

        if (inp.lesson.byHours2 !== false) {
            console.log("byHours2 is not false! " + inp.lesson.byHours2);
            throw new Error("byHours2 is not false! " + inp.lesson.byHours2);
        }

        if (inp.lesson.isVacant !== false) {
            console.log("vacant is not false! " + inp.lesson.vacant);
            throw new Error("vacant is not false! " + inp.lesson.vacant);
        }

        if (inp.secondTeacher !== null && inp.secondTeacher !== undefined) {
            console.log("secondTeacher is not null! " + inp.secondTeacher);
        }

        if (inp.lesson.newAudDateEnd !== null && inp.lesson.newAudDateEnd !== undefined) {
            console.log("newAudDateEnd is not null! " + inp.lesson.newAudDateEnd);
        }

        if (inp.lesson.newAudDateStart !== null && inp.lesson.newAudDateStart !== undefined) {
            console.log("newAudDateStart is not null! " + inp.lesson.newAudDateStart);
        }

        if (inp.lesson.newAuditoriumReservation !== null && inp.lesson.newAuditoriumReservation !== undefined) {
            console.log("newAuditoriumReservation is not null! " + inp.lesson.newAuditoriumReservation);
        }

        if (inp.lesson.newTeacher !== null && inp.lesson.newTeacher !== undefined) {
            console.log("newTeacher is not null! " + inp.lesson.newTeacher);
        }

        if (inp.lesson.newTeacherDateEnd !== null && inp.lesson.newTeacherDateEnd !== undefined) {
            console.log("newTeacherDateEnd is not null! " + inp.lesson.newTeacherDateEnd);
        }

        if (inp.lesson.newTeacherDateStart !== null && inp.lesson.newTeacherDateStart !== undefined) {
            console.log("newTeacherDateStart is not null! " + inp.lesson.newTeacherDateStart);
        }

        //subject stuff
        let subject = inp.lesson.subject;

        //auditorium reservation stuff
        let aud = inp.lesson.auditoriumReservation;
        if (aud.type !== "schedule"){
            console.log("aud.type is not schedule! " + aud.type);
            throw new Error("aud.type is not schedule! " + aud.type);
        }

        if (aud.reservationTime.repeat !== null) {
            console.log("aud.reservationTime.repeat is not null! " + aud.reservationTime.repeat);
            throw new Error("aud.reservationTime.repeat is not null! " + aud.reservationTime.repeat);
        }



        return res;
    });


    console.log("Найдено объектов расписания: " + objects.length)
    // console.dir(objects)

    // console.log(alienIDs);
    let isok = true;
    for (let k in subjID1) {
        if (subjID1[k] > 2) {
            isok = false;
            break;
        }
    }
    for (let k in subjID2) {
        if (subjID2[k] > 2) {
            isok = false;
            break;
        }
    }

    if (!isok) {
        console.log("ТАК БЛЯ")
        console.log("группа " + group)

        console.log("уникальные предметы неделя 1")
        for (let k in subjID1) {
            if (subjID1[k] > 2) {
                console.log("count: " + subjID1[k])
                console.log(subjdata[k]);
            }
        }
        console.log("уникальные предметы неделя 2")
        for (let k in subjID2) {
            if (subjID2[k] > 2) {
                console.log("count: " + subjID2[k])
                console.log(subjdata[k]);
            }
        }
    }
}

async function get_group_schedule(group_id) {
    let answ = await fetch("https://digital.etu.ru/api/schedule/objects/publicated?groups=" + group_id + "&withSubjectCode=true&withURL=true", {
      "headers": {
          "accept": "*/*",
      },
        "body": null,
        "method": "GET"
    }).then(res => res.json());

    answ = answ[0];
    alienIDs = {};
    schedIDs = {};

    let group = answ.fullNumber;

    let objects = answ.scheduleObjects.map(inp => {
        let res = {};

        let teacher = inp.lesson.teacher ? 
        {
            name: inp.lesson.teacher.initials,
            fullName: inp.lesson.teacher.surname + " " + inp.lesson.teacher.name + " " + inp.lesson.teacher.midname,
            email: inp.lesson.teacher.email,
            birthday: inp.lesson.teacher.birthday,
            phone: inp.lesson.teacher.phone,
            workDepartments: inp.lesson.teacher.workDepartments
        } : null;

        res.schedObjId = inp.id; //for attendance
        res.subjInfo = { // about lesson and subject
            lessonID: inp.lesson.id,
            subjID: inp.lesson.subject.id,
            alienID: inp.lesson.subject.alienId,
            name: inp.lesson.subject.title,
            shortName: inp.lesson.subject.shortTitle,
            type: inp.lesson.subject.subjectType,
            controlType: inp.lesson.subject.controlType,

            teacher,
        }

        if (alienIDs[inp.lesson.subject.alienId])
            alienIDs[inp.lesson.subject.alienId] += 1;
        else
            alienIDs[inp.lesson.subject.alienId] = 1;

        res.placeAndTime = {
            auditorium: inp.lesson.auditoriumReservation.auditoriumNumber,
            auditoriumUpdateTime: inp.lesson.auditoriumReservation.updatedAt,

            scheduleID: inp.lesson.auditoriumReservation.scheduleId,
            weekDay: inp.lesson.auditoriumReservation.reservationTime.weekDay,
            week: inp.lesson.auditoriumReservation.reservationTime.week,
            startTime: inp.lesson.auditoriumReservation.reservationTime.startTime,
            endTime: inp.lesson.auditoriumReservation.reservationTime.endTime,
        }

        if (schedIDs[res.placeAndTime.scheduleID])
            schedIDs[res.placeAndTime.scheduleID] += 1;
        else
            schedIDs[res.placeAndTime.scheduleID] = 1;


        //asserts:
        if (inp.form != "standard")
            console.log("form is not standard! " + inp.form);

        if (inp.lesson.byHours1 !== false) {
            console.log("byHours1 is not false! " + inp.lesson.byHours1);
            throw new Error("byHours1 is not false! " + inp.lesson.byHours1);
        }

        if (inp.lesson.byHours2 !== false) {
            console.log("byHours2 is not false! " + inp.lesson.byHours2);
            throw new Error("byHours2 is not false! " + inp.lesson.byHours2);
        }

        if (inp.lesson.isVacant !== false) {
            console.log("vacant is not false! " + inp.lesson.vacant);
            throw new Error("vacant is not false! " + inp.lesson.vacant);
        }

        if (inp.secondTeacher !== null && inp.secondTeacher !== undefined) {
            console.log("secondTeacher is not null! " + inp.secondTeacher);
        }

        if (inp.lesson.newAudDateEnd !== null && inp.lesson.newAudDateEnd !== undefined) {
            console.log("newAudDateEnd is not null! " + inp.lesson.newAudDateEnd);
        }

        if (inp.lesson.newAudDateStart !== null && inp.lesson.newAudDateStart !== undefined) {
            console.log("newAudDateStart is not null! " + inp.lesson.newAudDateStart);
        }

        if (inp.lesson.newAuditoriumReservation !== null && inp.lesson.newAuditoriumReservation !== undefined) {
            console.log("newAuditoriumReservation is not null! " + inp.lesson.newAuditoriumReservation);
        }

        if (inp.lesson.newTeacher !== null && inp.lesson.newTeacher !== undefined) {
            console.log("newTeacher is not null! " + inp.lesson.newTeacher);
        }

        if (inp.lesson.newTeacherDateEnd !== null && inp.lesson.newTeacherDateEnd !== undefined) {
            console.log("newTeacherDateEnd is not null! " + inp.lesson.newTeacherDateEnd);
        }

        if (inp.lesson.newTeacherDateStart !== null && inp.lesson.newTeacherDateStart !== undefined) {
            console.log("newTeacherDateStart is not null! " + inp.lesson.newTeacherDateStart);
        }

        //subject stuff
        let subject = inp.lesson.subject;

        //auditorium reservation stuff
        let aud = inp.lesson.auditoriumReservation;
        if (aud.type !== "schedule"){
            console.log("aud.type is not schedule! " + aud.type);
            throw new Error("aud.type is not schedule! " + aud.type);
        }

        if (aud.reservationTime.repeat !== null) {
            console.log("aud.reservationTime.repeat is not null! " + aud.reservationTime.repeat);
            throw new Error("aud.reservationTime.repeat is not null! " + aud.reservationTime.repeat);
        }



        return res;
    });


    console.log("Найдено объектов расписания: " + objects.length)
    console.dir(objects)

    console.log(alienIDs);
    console.log(schedIDs);
}

async function init_db() {
    let table_name = 'week_lessons';
    let query = db.query(`SELECT count(name) as cnt FROM sqlite_master WHERE type='table' AND name='${table_name}';`);
    if (query.get().cnt === 0) {
        // db.query(`create table week_lessons (
        //     id INT primary key,
        //     day_of_week INT check (x >= 0 AND x < 7),
        //
        // )`).run()
    }
}

async function list_lessons(date) {
    let opt_date = "";

    if (typeof date === 'string') {
        opt_date = "?date=" + date;
    }
    let res = await fetch("https://digital.etu.ru/attendance/api/schedule/check-in" + opt_date, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "cookie": "connect.digital-attendance=" + attend_token,
        },
        "body": null,
        "method": "GET"
    }).then(res=>res.json());

    for (let ent of res) {
        console.log(ent.id + ": \n\t" + ent.lesson.title + " " + ent.lesson.subjectType);
    }

    return res
}

async function checkin(id) {
    if (typeof id === 'string' && !isNaN(id)) {
        let res = await fetch("https://digital.etu.ru/attendance/api/schedule/check-in/" + id, {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "cookie": "connect.digital-attendance=" + attend_token,
            },
            "body": null,
            "method": "POST"
        }).then(res=>res.json());

        console.dir(res)
    }
    else {
        console.log("Incorrect value!")
    }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
//         "id": 4365,

async function ask() {
    rl.question("\n\t1) Get lesson list\n" + 
    "\t2) check-in lesson\n" + 
    "\t3) get 0303 schedule\n" +
    "\t4) get 3311 schedule\n" +
    "\t5) get 3388 schedule\n" +
    "\t6) get 0491/1 schedule\n" +
    "\t7) get 0491/2 schedule\n" +
    "\t8) get any schedule\n" +
    "\t9) exit\n", async (input_raw) => {
        let input = input_raw.split(" ")

        switch (input[0]) {
            case "1":

                let res = await list_lessons(input[1]);
                console.dir(res)
                break;
            case "2":
                await checkin(input[1]);
                break;
            case "3":
                await get_group_schedule(4362);
                break;
            case "4":
                await get_group_schedule(4330);
                break;
            case "5":
                await get_group_schedule(4365);
                break;
            case "6":
                await get_group_schedule(4457);
                break;
            case "7":
                await get_group_schedule(4691);
                break;

            case "8":
                for (let i = +input[1]; i < +input[2]; i++) {

                    await get_any_schedule(i);
                }
                break;
            case "9": 
                process.exit()
                return;
            default:
                console.log("cannot recognize input!")
                break;
            
        }
        await ask()
    });

}

async function app() {
    await init_db();

    api.listen(port, () => {
      console.log(`Listening on port ${port}...`);
    });

    await ask();
}

app()
