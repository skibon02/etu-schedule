import express from "express"
import { Database } from "bun:sqlite";
const readline = require("readline")
const path = require('path')

const db = new Database("db.sqlite", {create: true});

let attend_token = 's%3A4sqTfnZzZ430ZvbcNAK6eesyiYZMTmfZ.5CsJTaCWfhNzFUzZvUHnZyuIYQst570B1OlymPMikZE';

let api = express()

// api.use(express.static(path.join(__dirname, "./client/build")))
let port = 3000


api.get('/api', (req, res) => {
    res.send('hello world');
})

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


async function ask() {
    rl.question("\n\t1) Get lesson list\n" + 
    "\t2) check-in lesson\n" + 
    "\t3) exit\n", async (input_raw) => {

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
