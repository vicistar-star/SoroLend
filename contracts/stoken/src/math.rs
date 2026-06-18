#![allow(dead_code)]
const ONE: i128 = 1_000_000_000_000_000_000;

pub fn fixed_point_one() -> i128 {
    ONE
}

pub fn mul_div(a: i128, b: i128, c: i128) -> i128 {
    if a == 0 || b == 0 {
        return 0;
    }
    a * b / c
}
