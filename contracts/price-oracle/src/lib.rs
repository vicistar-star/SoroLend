#![no_std]

mod events;
mod math;
mod storage;

use events::*;
use math::{checked_mul, percent_of, abs_diff, checked_add};
use soroban_sdk::{contract, contractimpl, Address, Env};
use storage::*;

#[cfg(test)]
use math::fixed_point_one;

#[contract]
pub struct PriceOracle;

#[contractimpl]
impl PriceOracle {
    pub fn initialize(
        env: Env,
        admin: Address,
        deviation_threshold: i128,
        min_interval: u64,
    ) {
        if has_admin(&env) {
            panic!("already initialized");
        }
        write_admin(&env, &admin);
        set_keeper(&env, &admin, true);
        write_deviation_threshold(&env, deviation_threshold);
        write_min_interval(&env, min_interval);
    }

    pub fn set_keeper(env: Env, admin: Address, keeper: Address, enable: bool) {
        admin.require_auth();
        let stored_admin = read_admin(&env);
        if admin != stored_admin {
            panic!("not authorized");
        }
        set_keeper(&env, &keeper, enable);
        emit_keeper_set(&env, &admin, &keeper, enable);
    }

    pub fn set_price(env: Env, keeper: Address, asset: Address, price: i128) {
        keeper.require_auth();
        if !is_keeper(&env, &keeper) {
            panic!("not a keeper");
        }
        if price <= 0 {
            panic!("invalid price");
        }

        let now = env.ledger().timestamp();
        let last_update = read_last_update(&env, &asset);

        if last_update != 0 {
            let elapsed = now - last_update;
            let min_interval = read_min_interval(&env);
            if min_interval > 0 && elapsed < min_interval {
                panic!("update interval too short");
            }

            let old_price = read_price(&env, &asset);
            if old_price > 0 {
                let deviation = abs_diff(price, old_price);
                let max_deviation = percent_of(old_price, read_deviation_threshold(&env));
                if deviation > max_deviation {
                    panic!("price deviation exceeds threshold");
                }
            }

            let cumulative_price = read_cumulative_price(&env, &asset);
            let cumulative_time = read_cumulative_time(&env, &asset);
            let price_time = checked_add(
                cumulative_price,
                checked_mul(old_price, elapsed as i128),
            );
            let new_time = checked_add(cumulative_time as i128, elapsed as i128) as u64;
            write_cumulative_price(&env, &asset, price_time);
            write_cumulative_time(&env, &asset, new_time);
        }

        write_price(&env, &asset, price);
        write_last_update(&env, &asset, now);

        emit_price_update(&env, &keeper, &asset, read_price(&env, &asset), price);
    }

    pub fn get_price(env: Env, asset: Address) -> i128 {
        read_price(&env, &asset)
    }

    pub fn get_twap(env: Env, asset: Address) -> i128 {
        let cumulative_price = read_cumulative_price(&env, &asset);
        let cumulative_time = read_cumulative_time(&env, &asset);

        if cumulative_time == 0 {
            return read_price(&env, &asset);
        }

        cumulative_price / cumulative_time as i128
    }

    pub fn get_deviation_threshold(env: Env) -> i128 {
        read_deviation_threshold(&env)
    }

    pub fn get_min_interval(env: Env) -> u64 {
        read_min_interval(&env)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};

    fn create_test_env() -> (Env, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register_contract(None, PriceOracle);

        env.ledger().set(LedgerInfo {
            timestamp: 1_000_000,
            protocol_version: 26,
            sequence_number: 1,
            network_id: [0; 32],
            base_reserve: 10,
            min_temp_entry_ttl: 100,
            min_persistent_entry_ttl: 100,
            max_entry_ttl: 2_000_000,
        });

        (env, admin, contract_id)
    }

    fn invoke_initialize(
        env: &Env,
        contract_id: &Address,
        admin: &Address,
        deviation_threshold: i128,
        min_interval: u64,
    ) {
        env.as_contract(contract_id, || {
            PriceOracle::initialize(
                env.clone(),
                admin.clone(),
                deviation_threshold,
                min_interval,
            )
        });
    }

    fn invoke_set_price(
        env: &Env,
        contract_id: &Address,
        keeper: &Address,
        asset: &Address,
        price: i128,
    ) {
        env.as_contract(contract_id, || {
            PriceOracle::set_price(env.clone(), keeper.clone(), asset.clone(), price)
        });
    }

    fn invoke_get_price(env: &Env, contract_id: &Address, asset: &Address) -> i128 {
        env.as_contract(contract_id, || {
            PriceOracle::get_price(env.clone(), asset.clone())
        })
    }

    fn invoke_get_twap(env: &Env, contract_id: &Address, asset: &Address) -> i128 {
        env.as_contract(contract_id, || {
            PriceOracle::get_twap(env.clone(), asset.clone())
        })
    }

    #[test]
    fn test_initialize() {
        let (env, admin, contract_id) = create_test_env();
        invoke_initialize(&env, &contract_id, &admin, 5 * fixed_point_one() / 100, 60);
        let threshold = env.as_contract(&contract_id, || {
            PriceOracle::get_deviation_threshold(env.clone())
        });
        assert_eq!(threshold, 5 * fixed_point_one() / 100);
    }

    #[test]
    fn test_set_and_get_price() {
        let (env, admin, contract_id) = create_test_env();
        let asset = Address::generate(&env);
        invoke_initialize(&env, &contract_id, &admin, 10 * fixed_point_one() / 100, 0);

        invoke_set_price(&env, &contract_id, &admin, &asset, 100 * fixed_point_one());
        let price = invoke_get_price(&env, &contract_id, &asset);
        assert_eq!(price, 100 * fixed_point_one());
    }

    #[test]
    #[should_panic(expected = "price deviation exceeds threshold")]
    fn test_deviation_check_rejects_large_change() {
        let (env, admin, contract_id) = create_test_env();
        let asset = Address::generate(&env);

        invoke_initialize(&env, &contract_id, &admin, 5 * fixed_point_one() / 100, 0);
        invoke_set_price(&env, &contract_id, &admin, &asset, 100 * fixed_point_one());

        env.ledger().set(LedgerInfo {
            timestamp: 1_000_060,
            protocol_version: 26,
            sequence_number: 1,
            network_id: [0; 32],
            base_reserve: 10,
            min_temp_entry_ttl: 100,
            min_persistent_entry_ttl: 100,
            max_entry_ttl: 2_000_000,
        });

        invoke_set_price(&env, &contract_id, &admin, &asset, 200 * fixed_point_one());
    }

    #[test]
    fn test_twap_accumulation() {
        let (env, admin, contract_id) = create_test_env();
        let asset = Address::generate(&env);

        invoke_initialize(&env, &contract_id, &admin, 10 * fixed_point_one() / 100, 0);
        invoke_set_price(&env, &contract_id, &admin, &asset, 100 * fixed_point_one());

        env.ledger().set(LedgerInfo {
            timestamp: 1_000_100,
            protocol_version: 26,
            sequence_number: 1,
            network_id: [0; 32],
            base_reserve: 10,
            min_temp_entry_ttl: 100,
            min_persistent_entry_ttl: 100,
            max_entry_ttl: 2_000_000,
        });

        invoke_set_price(&env, &contract_id, &admin, &asset, 105 * fixed_point_one());

        let twap = invoke_get_twap(&env, &contract_id, &asset);
        // TWAP = (100 * 100 + 105 * 0) / 100 = 100
        assert_eq!(twap, 100 * fixed_point_one());
    }

    #[test]
    fn test_twap_returns_latest_when_no_history() {
        let (env, admin, contract_id) = create_test_env();
        let asset = Address::generate(&env);
        invoke_initialize(&env, &contract_id, &admin, 10 * fixed_point_one() / 100, 0);
        invoke_set_price(&env, &contract_id, &admin, &asset, 500 * fixed_point_one());

        let twap = invoke_get_twap(&env, &contract_id, &asset);
        assert_eq!(twap, 500 * fixed_point_one());
    }

    #[test]
    #[should_panic(expected = "invalid price")]
    fn test_invalid_price_rejected() {
        let (env, admin, contract_id) = create_test_env();
        let asset = Address::generate(&env);
        invoke_initialize(&env, &contract_id, &admin, 10 * fixed_point_one() / 100, 0);

        invoke_set_price(&env, &contract_id, &admin, &asset, 0);
    }

    #[test]
    #[should_panic(expected = "update interval too short")]
    fn test_min_interval_enforced() {
        let (env, admin, contract_id) = create_test_env();
        let asset = Address::generate(&env);

        invoke_initialize(&env, &contract_id, &admin, 10 * fixed_point_one() / 100, 100);
        invoke_set_price(&env, &contract_id, &admin, &asset, 100 * fixed_point_one());

        invoke_set_price(&env, &contract_id, &admin, &asset, 101 * fixed_point_one());
    }
}
