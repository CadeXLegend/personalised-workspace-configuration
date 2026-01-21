use std::env;

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();

    let mut anchor_right = false;
    let mut max_length: usize = 30;
    let mut positional: Vec<&String> = Vec::new();

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--anchor-right" => anchor_right = true,
            "--max-length" => {
                i += 1;
                if i < args.len() {
                    max_length = args[i].parse().expect("Invalid max-length");
                }
            }
            _ => positional.push(&args[i]),
        }
        i += 1;
    }

    if positional.len() < 3 {
        eprintln!("Usage: gradient [--anchor-right] [--max-length N] \"text\" startHexColour endHexColour");
        std::process::exit(1);
    }

    let text = positional[0];
    let (start_h, start_s, start_v) = rgb_to_hsv(parse_hex(positional[1]));
    let (end_h, end_s, end_v) = rgb_to_hsv(parse_hex(positional[2]));

    let len = text.chars().count();
    let delta_h = end_h - start_h;
    let delta_s = end_s - start_s;
    let delta_v = end_v - start_v;

    let mut output = String::with_capacity(text.len() * 20);

    for (i, c) in text.chars().enumerate() {
        let t = if anchor_right {
            let distance_from_end = len - 1 - i;
            1.0 - (distance_from_end as f64 / max_length as f64).min(1.0)
        } else {
            if len <= 1 { 1.0 } else { i as f64 / (len - 1) as f64 }
        };

        let h = start_h + delta_h * t;
        let s = start_s + delta_s * t;
        let v = start_v + delta_v * t;
        let (r, g, b) = hsv_to_rgb(h, s, v);
        output.push_str(&format!("\x1b[38;2;{r};{g};{b}m{c}"));
    }

    print!("{output}\x1b[39m");
}

fn parse_hex(hex: &str) -> (u8, u8, u8) {
    let hex = hex.trim_start_matches('#');
    let r = u8::from_str_radix(&hex[0..2], 16).expect("Invalid hex");
    let g = u8::from_str_radix(&hex[2..4], 16).expect("Invalid hex");
    let b = u8::from_str_radix(&hex[4..6], 16).expect("Invalid hex");
    (r, g, b)
}

fn rgb_to_hsv((r, g, b): (u8, u8, u8)) -> (f64, f64, f64) {
    let r = r as f64 / 255.0;
    let g = g as f64 / 255.0;
    let b = b as f64 / 255.0;

    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let chroma = max - min;

    let h = if chroma == 0.0 {
        0.0
    } else if max == r {
        (g - b) / chroma
    } else if max == g {
        2.0 + (b - r) / chroma
    } else {
        4.0 + (r - g) / chroma
    };

    let h = (h * 60.0 + 360.0) % 360.0;
    let s = if max == 0.0 { 0.0 } else { chroma / max };

    (h, s, max)
}

fn hsv_to_rgb(h: f64, s: f64, v: f64) -> (u8, u8, u8) {
    let c = v * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = v - c;

    let (r, g, b) = match (h / 60.0) as u32 {
        0 => (c + m, x + m, m),
        1 => (x + m, c + m, m),
        2 => (m, c + m, x + m),
        3 => (m, x + m, c + m),
        4 => (x + m, m, c + m),
        _ => (c + m, m, x + m),
    };

    ((r * 255.0) as u8, (g * 255.0) as u8, (b * 255.0) as u8)
}
