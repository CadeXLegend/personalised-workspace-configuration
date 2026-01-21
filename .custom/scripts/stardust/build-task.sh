#!/bin/env bash
cargo build --release
cp ./target/release/stardust ./stardust
rm -rf ./target

