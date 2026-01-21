use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: escape <text>");
        std::process::exit(1);
    }
    print!("{}", urlencoding::encode(&args[1]));
}
