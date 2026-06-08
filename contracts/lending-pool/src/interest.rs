use crate::math;
use soroban_sdk::contracttype;

pub const ONE: i128 = 1_000_000_000_000_000_000;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RateParams {
    pub base_rate: i128,
    pub slope1: i128,
    pub slope2: i128,
    pub optimal_utilization: i128,
}

impl Default for RateParams {
    fn default() -> Self {
        Self {
            base_rate: 0i128,
            slope1: 4 * ONE / 100,
            slope2: 75 * ONE / 100,
            optimal_utilization: 80 * ONE / 100,
        }
    }
}

pub struct InterestRateModel;

impl InterestRateModel {
    pub fn get_borrow_rate(params: &RateParams, utilization: i128) -> i128 {
        if utilization <= params.optimal_utilization {
            let ratio = math::mul_div(utilization, ONE, params.optimal_utilization);
            params.base_rate + math::mul_div(ratio, params.slope1, ONE)
        } else {
            let excess = math::checked_sub(utilization, params.optimal_utilization);
            let denominator = math::checked_sub(ONE, params.optimal_utilization);
            let ratio = math::mul_div(excess, ONE, denominator);
            params.base_rate + params.slope1 + math::mul_div(ratio, params.slope2, ONE)
        }
    }

    pub fn get_supply_rate(params: &RateParams, utilization: i128, reserve_factor: i128) -> i128 {
        let borrow_rate = Self::get_borrow_rate(params, utilization);
        let rate_to_reserve = math::percent_of(borrow_rate, reserve_factor);
        let rate_after_reserve = math::checked_sub(borrow_rate, rate_to_reserve);
        math::mul_div(rate_after_reserve, utilization, ONE)
    }

    pub fn calculate_utilization(total_supply: i128, total_borrow: i128) -> i128 {
        if math::is_zero(total_supply) {
            return 0;
        }
        math::mul_div(total_borrow, ONE, total_supply)
    }
}

#[cfg(test)]
mod tests {
    extern crate std;
    use super::*;

    fn setup() -> RateParams {
        RateParams {
            base_rate: 0,
            slope1: 4 * ONE / 100,
            slope2: 75 * ONE / 100,
            optimal_utilization: 80 * ONE / 100,
        }
    }

    #[test]
    fn test_borrow_rate_at_zero_utilization() {
        let params = setup();
        let rate = InterestRateModel::get_borrow_rate(&params, 0);
        assert_eq!(rate, 0);
    }

    #[test]
    fn test_borrow_rate_below_kink() {
        let params = setup();
        let utilization = 40 * ONE / 100;
        let rate = InterestRateModel::get_borrow_rate(&params, utilization);
        let ratio = math::mul_div(utilization, ONE, params.optimal_utilization);
        let expected = params.base_rate + math::mul_div(ratio, params.slope1, ONE);
        assert_eq!(rate, expected);
    }

    #[test]
    fn test_borrow_rate_at_kink() {
        let params = setup();
        let utilization = 80 * ONE / 100;
        let rate = InterestRateModel::get_borrow_rate(&params, utilization);
        assert_eq!(rate, 4 * ONE / 100);
    }

    #[test]
    fn test_borrow_rate_above_kink() {
        let params = setup();
        let utilization = 90 * ONE / 100;
        let rate = InterestRateModel::get_borrow_rate(&params, utilization);
        let excess = utilization - params.optimal_utilization;
        let denominator = ONE - params.optimal_utilization;
        let ratio = math::mul_div(excess, ONE, denominator);
        let expected = params.base_rate + params.slope1 + math::mul_div(ratio, params.slope2, ONE);
        assert_eq!(rate, expected);
    }

    #[test]
    fn test_borrow_rate_at_max_utilization() {
        let params = setup();
        let utilization = ONE;
        let rate = InterestRateModel::get_borrow_rate(&params, utilization);
        assert_eq!(rate, 79 * ONE / 100);
    }

    #[test]
    fn test_supply_rate_at_kink() {
        let params = setup();
        let utilization = 80 * ONE / 100;
        let reserve_factor = 10 * ONE / 100;
        let supply_rate = InterestRateModel::get_supply_rate(&params, utilization, reserve_factor);
        let borrow_rate = InterestRateModel::get_borrow_rate(&params, utilization);
        let rate_after_reserve = borrow_rate - math::percent_of(borrow_rate, reserve_factor);
        let expected = math::mul_div(rate_after_reserve, utilization, ONE);
        assert_eq!(supply_rate, expected);
    }

    #[test]
    fn test_utilization_calculation() {
        let total_supply = ONE;
        let total_borrow = 50 * ONE / 100;
        let util = InterestRateModel::calculate_utilization(total_supply, total_borrow);
        assert_eq!(util, 50 * ONE / 100);
    }

    #[test]
    fn test_utilization_zero_supply() {
        let util = InterestRateModel::calculate_utilization(0, 100 * ONE);
        assert_eq!(util, 0);
    }

    #[test]
    fn test_borrow_rate_monotonic() {
        let params = setup();
        let rates: std::vec::Vec<i128> = (0..=100)
            .map(|u| InterestRateModel::get_borrow_rate(&params, u * ONE / 100))
            .collect();

        for i in 1..rates.len() {
            assert!(
                rates[i] >= rates[i - 1],
                "Borrow rate not monotonic at {}%",
                i
            );
        }
    }
}
