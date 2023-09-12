const readline = require("readline")

let attend_token = 's%3A4sqTfnZzZ430ZvbcNAK6eesyiYZMTmfZ.5CsJTaCWfhNzFUzZvUHnZyuIYQst570B1OlymPMikZE';

async function list_lessons() {
    let res = await fetch("https://digital.etu.ru/attendance/api/schedule/check-in", {
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
        console.log(input)

        switch (input[0]) {
            case "1": 
                await list_lessons();
                break;
            case "2":
                await checkin(input[1]);
                break;

            case "3": 
                return
                break;
            
        }
        ask()
    });

}

async function app() {
    await ask();
}

app()
