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

#[cfg(test)]
mod tests {
    extern crate std;
    use super::*;

    #[test]
    fn test_fixed_point_one() {
        assert_eq!(fixed_point_one(), 1_000_000_000_000_000_000);
    }

    #[test]
    fn test_mul_div() {
        let result = mul_div(ONE, 50 * ONE / 100, ONE);
        assert_eq!(result, 50 * ONE / 100);
    }

    #[test]
    fn test_percent_of() {
        let hundred = 100 * ONE;
        let ten_percent = percent_of(hundred, 10 * ONE / 100);
        assert_eq!(ten_percent, 10 * ONE);
    }

    #[test]
    fn test_to_from_fixed_point() {
        let value = 100_000_000_000i128;
        let decimals = 7;
        let fp = to_fixed_point(value, decimals);
        let back = from_fixed_point(fp, decimals);
        assert_eq!(back, value);
    }

    #[test]
    fn test_is_zero() {
        assert!(is_zero(0));
        assert!(!is_zero(1));
    }

    #[test]
    fn test_checked_add() {
        assert_eq!(checked_add(5, 3), 8);
        assert_eq!(checked_add(0, 0), 0);
    }

    #[test]
    fn test_checked_sub() {
        assert_eq!(checked_sub(5, 3), 2);
        assert_eq!(checked_sub(0, 0), 0);
    }
}
