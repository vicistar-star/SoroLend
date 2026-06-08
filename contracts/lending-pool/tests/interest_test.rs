#![cfg(test)]

extern crate std;

use lending_pool::interest::{InterestRateModel, RateParams, ONE};

fn default_params() -> RateParams {
    RateParams {
        base_rate: 0,
        slope1: 4 * ONE / 100,
        slope2: 75 * ONE / 100,
        optimal_utilization: 80 * ONE / 100,
    }
}

#[test]
fn test_borrow_rate_at_specific_utilizations() {
    let params = default_params();

    let test_cases: [(i128, i128); 6] = [
        (0, 0),
        (20 * ONE / 100, 1 * ONE / 100),
        (40 * ONE / 100, 2 * ONE / 100),
        (60 * ONE / 100, 3 * ONE / 100),
        (80 * ONE / 100, 4 * ONE / 100),
        (ONE, 79 * ONE / 100),
    ];

    for (utilization, expected_rate) in test_cases {
        let rate = InterestRateModel::get_borrow_rate(&params, utilization);
        assert_eq!(
            rate, expected_rate,
            "Borrow rate mismatch at utilization {}",
            utilization
        );
    }
}

#[test]
fn test_supply_rate_at_kink() {
    let params = default_params();
    let reserve_factor = 10 * ONE / 100;

    let supply_rate = InterestRateModel::get_supply_rate(&params, 80 * ONE / 100, reserve_factor);
    let borrow_rate = InterestRateModel::get_borrow_rate(&params, 80 * ONE / 100);

    let expected = borrow_rate - (borrow_rate * reserve_factor / ONE);
    let expected = expected * 80 * ONE / 100 / ONE;

    assert_eq!(supply_rate, expected, "Supply rate at kink mismatch");
}

#[test]
fn test_supply_rate_at_max_utilization() {
    let params = default_params();
    let reserve_factor = 10 * ONE / 100;

    let supply_rate = InterestRateModel::get_supply_rate(&params, ONE, reserve_factor);
    let borrow_rate = InterestRateModel::get_borrow_rate(&params, ONE);

    let expected = borrow_rate - (borrow_rate * reserve_factor / ONE);

    assert_eq!(supply_rate, expected, "Supply rate at max utilization mismatch");
}

#[test]
fn test_reserve_factor_impact() {
    let params = default_params();
    let utilization = 80 * ONE / 100;

    let supply_rate_no_reserve = InterestRateModel::get_supply_rate(&params, utilization, 0);
    let supply_rate_with_reserve =
        InterestRateModel::get_supply_rate(&params, utilization, 10 * ONE / 100);

    assert!(
        supply_rate_with_reserve < supply_rate_no_reserve,
        "Reserve should reduce supply rate"
    );
}

#[test]
fn test_zero_utilization_edge() {
    let params = default_params();

    let borrow_rate = InterestRateModel::get_borrow_rate(&params, 0);
    assert_eq!(borrow_rate, 0, "Borrow rate should be 0 at 0 utilization");

    let supply_rate = InterestRateModel::get_supply_rate(&params, 0, 10 * ONE / 100);
    assert_eq!(supply_rate, 0, "Supply rate should be 0 at 0 utilization");
}

#[test]
fn test_full_utilization_edge() {
    let params = default_params();

    let borrow_rate = InterestRateModel::get_borrow_rate(&params, ONE);
    assert!(
        borrow_rate > 0,
        "Borrow rate should be positive at full utilization"
    );
}

#[test]
fn test_utilization_calculation_edge_cases() {
    assert_eq!(
        InterestRateModel::calculate_utilization(0, 0),
        0,
        "Utilization should be 0 when supply is 0"
    );

    assert_eq!(
        InterestRateModel::calculate_utilization(0, 100),
        0,
        "Utilization should be 0 when supply is 0 even with borrows"
    );

    assert_eq!(
        InterestRateModel::calculate_utilization(100 * ONE, 100 * ONE),
        ONE,
        "Utilization should be 100% when supply equals borrow"
    );

    assert_eq!(
        InterestRateModel::calculate_utilization(100 * ONE, 0),
        0,
        "Utilization should be 0 when borrow is 0"
    );
}

#[test]
fn test_borrow_rate_monotonic_across_kink() {
    let params = default_params();

    let below_kink = InterestRateModel::get_borrow_rate(&params, 79 * ONE / 100);
    let at_kink = InterestRateModel::get_borrow_rate(&params, 80 * ONE / 100);
    let above_kink = InterestRateModel::get_borrow_rate(&params, 81 * ONE / 100);

    assert!(below_kink <= at_kink, "Rate should not decrease below kink");
    assert!(at_kink <= above_kink, "Rate should not decrease at kink");
}

#[test]
fn test_different_slope_parameters() {
    let params = RateParams {
        base_rate: 2 * ONE / 100,
        slope1: 10 * ONE / 100,
        slope2: 100 * ONE / 100,
        optimal_utilization: 70 * ONE / 100,
    };

    let rate_at_optimal = InterestRateModel::get_borrow_rate(&params, 70 * ONE / 100);
    assert_eq!(
        rate_at_optimal,
        12 * ONE / 100,
        "Borrow rate at optimal should be base + slope1"
    );

    let rate_at_max = InterestRateModel::get_borrow_rate(&params, ONE);
    assert_eq!(
        rate_at_max,
        112 * ONE / 100,
        "Borrow rate at max should be base + slope1 + slope2"
    );
}
