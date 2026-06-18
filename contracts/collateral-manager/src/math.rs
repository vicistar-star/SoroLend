#![allow(dead_code)]
const ONE: i128 = 1_000_000_000_000_000_000;
const DECIMALS: u32 = 18;

pub fn fixed_point_one() -> i128 {
    ONE
}

pub fn mul_div(a: i128, b: i128, c: i128) -> i128 {
    if a == 0 || b == 0 {
        return 0;
    }
    a * b / c
}

pub fn percent_of(value: i128, percent: i128) -> i128 {
    mul_div(value, percent, ONE)
}

pub fn to_fixed_point(value: i128, asset_decimals: u32) -> i128 {
    if asset_decimals >= DECIMALS {
        value / 10i128.pow(asset_decimals - DECIMALS)
    } else {
        value * 10i128.pow(DECIMALS - asset_decimals)
    }
}

pub fn from_fixed_point(value: i128, asset_decimals: u32) -> i128 {
    if asset_decimals >= DECIMALS {
        value * 10i128.pow(asset_decimals - DECIMALS)
    } else {
        value / 10i128.pow(DECIMALS - asset_decimals)
    }
}

pub fn is_zero(value: i128) -> bool {
    value == 0
}

pub fn checked_add(a: i128, b: i128) -> i128 {
    a.checked_add(b).expect("math: addition overflow")
}

pub fn checked_sub(a: i128, b: i128) -> i128 {
    a.checked_sub(b).expect("math: subtraction underflow")
}
