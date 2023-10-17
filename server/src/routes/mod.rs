use rocket::Route;

pub mod auth;
pub mod schedule;

pub fn get_api_routes() -> Vec<Route> {
    let mut routes = Vec::new();
    routes.append(&mut auth::get_routes());
    routes.append(&mut schedule::get_routes());
    routes
}
