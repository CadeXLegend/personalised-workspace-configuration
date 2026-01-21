#!/bin/env bash
cargo build --release
cp ./target/release/gradiate ./gradiate
rm -rf ./target
