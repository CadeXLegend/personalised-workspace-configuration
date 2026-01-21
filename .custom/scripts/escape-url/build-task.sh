#!/bin/env bash
cargo build --release
cp ./target/release/escape ./escape
rm -rf ./target
