use clap::Command;
use color_print::cprintln;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;

mod formatter;

macro_rules! bold {
    ($($arg:tt)*) => (cprintln!("<bold>{}</>", format!($($arg)*)));
}

macro_rules! bold_underlined {
    ($($arg:tt)*) => (cprintln!("<bold><u>{}</u></bold>", format!($($arg)*)));
}

macro_rules! cyan {
    ($($arg:tt)*) => (cprintln!("<cyan>{}</>", format!($($arg)*)));
}

macro_rules! yellow {
    ($($arg:tt)*) => (cprintln!("<yellow>{}</>", format!($($arg)*)));
}

macro_rules! red {
    ($($arg:tt)*) => (cprintln!("<red>{}</>", format!($($arg)*)));
}

#[derive(Deserialize, Serialize)]
struct Config {
    colours: HashMap<String, String>,
}

fn get_args() -> Vec<String> {
    env::args().collect()
}

fn print_help(command: &Command, _args: &[String]) {
    let help = command.clone().render_help();
    println!("{}", help);
}

fn print_formatted_help() {
    cprintln!("The Starship Theme Manager for astronauts. ☄🌌\n");

    cprintln!("<bold><u>Usage:</u></bold> <bold>stardust</bold> [command]\n");
    cprintln!("<bold><u>Commands</u></bold>:");
    cprintln!("  <bold>generate</bold>  Generate template to <cyan>starship.toml</cyan>");
    cprintln!("  <bold>list</bold>      List all colour options");
    cprintln!("  <bold>get</bold>       Get a specific colour value");
    cprintln!("  <bold>set</bold>       Set a colour value and generate\n");
    cprintln!("<bold><u>Options</u></bold>:");
    cprintln!("  <bold>-h</bold>, <bold>--help</bold>     Print help");
    cprintln!("  <bold>-V</bold>, <bold>--version</bold>  Print version\n");
    cprintln!("");
}

fn build_cli() -> Command {
    use anstyle::Style;

    Command::new("stardust")
        .author("Stardust Theme Manager")
        .version("0.1.0")
        .about("The Starship Theme Manager for astronauts. ☄🌌")
        .override_usage("stardust <command>")
        .subcommand_required(false)
        .styles(
            clap::builder::Styles::styled()
                .header(Style::new().bold().underline())
                .usage(Style::new().bold().underline())
                .literal(Style::new().bold())
                .placeholder(Style::new().bold().underline()),
        )
        .subcommand(Command::new("generate").about("generate template to starship.toml"))
        .subcommand(Command::new("list").about("List all colour options"))
        .subcommand(
            Command::new("get")
                .about("Get a specific colour value")
                .arg(clap::Arg::new("key").required(true)),
        )
        .subcommand(
            Command::new("set")
                .about("Set a colour value and generate")
                .arg(clap::Arg::new("key").required(true))
                .arg(clap::Arg::new("value").required(true)),
        )
}

fn main() {
    let args = get_args();
    let command = build_cli();
    let has_subcommand = args.len() > 1 && !args[1].starts_with('-');

    if !has_subcommand {
        print_formatted_help();
        return;
    }

    let template_base = dirs::home_dir()
        .unwrap_or_else(|| panic!("Could not find home directory"))
        .join(env::var("STARDUST_TEMPLATE_PATH").unwrap_or_else(|_| ".custom/configs".to_string()));

    let config_path = template_base.join("stardust-template-params.json");
    let template_path = template_base.join("starship.toml.template");
    let output_path = template_base.join("starship.toml");

    let matches = command.clone().get_matches_from(&args);

    match matches.subcommand() {
        Some(("generate", _)) => {
            generate_template(&config_path, &template_path, &output_path);
            bold!(
                "Starship config generated successfully to {}",
                output_path.display()
            );
        }
        Some(("list", _)) => {
            list_colours(&config_path);
        }
        Some(("get", sub_m)) => {
            let key = sub_m.get_one::<String>("key").unwrap();
            get_colour(&config_path, key);
        }
        Some(("set", sub_m)) => {
            let key = sub_m.get_one::<String>("key").unwrap();
            let value = sub_m.get_one::<String>("value").unwrap();
            set_colour(&config_path, key, value);
        }
        _ => {
            print_formatted_help();
        }
    }
}

fn read_config(path: &std::path::PathBuf) -> Config {
    let content = fs::read_to_string(path).expect("Failed to read config file");
    serde_json::from_str(&content).expect("Failed to parse config JSON")
}

fn generate_template(
    config_path: &std::path::PathBuf,
    template_path: &std::path::PathBuf,
    output_path: &std::path::PathBuf,
) {
    let config = read_config(config_path);
    let template = fs::read_to_string(template_path).expect("Failed to read template file");

    let mut result = template;
    for (key, value) in &config.colours {
        let placeholder = format!("{{{{{}}}}}", key);
        result = result.replace(&placeholder, value);
    }

    fs::write(output_path, result).expect("Failed to write output file");
}

fn list_colours(config_path: &std::path::PathBuf) {
    let config = read_config(config_path);
    bold_underlined!("\nAvailable colour options:");
    for (key, value) in &config.colours {
        bold!("  {} = ", key);
        cyan!("{}", value);
    }
}

fn get_colour(config_path: &std::path::PathBuf, key: &str) {
    let config = read_config(config_path);
    match config.colours.get(key) {
        Some(value) => cyan!("{}", value),
        None => red!("Unknown key: {}", key),
    }
}

fn set_colour(config_path: &std::path::PathBuf, key: &str, value: &str) {
    let mut config = read_config(config_path);
    config.colours.insert(key.to_string(), value.to_string());

    let json = serde_json::to_string_pretty(&config).expect("Failed to serialize config");
    fs::write(config_path, json).expect("Failed to write config file");

    let template_base = config_path
        .parent()
        .unwrap_or_else(|| panic!("Could not determine template base directory"));
    let output_path = dirs::config_dir()
        .unwrap_or_else(|| panic!("Could not find config directory"))
        .join("starship.toml");

    generate_template(
        config_path,
        &template_base.join("starship.toml.template"),
        &output_path,
    );
    bold!("Set ");
    yellow!("{}", key);
    bold!(" to ");
    cyan!("{}", value);
    bold!(" and generated config");
}
