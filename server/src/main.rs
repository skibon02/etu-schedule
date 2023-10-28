#[macro_use]
extern crate rocket;
use server::run;

#[launch]
async fn rocket() -> _ {
    run()
}