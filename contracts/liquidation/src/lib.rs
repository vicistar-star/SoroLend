#![no_std]

mod events;
mod math;
mod storage;

use events::*;
use math::*;
use soroban_sdk::{contract, contractimpl, contractclient, Address, Env};
use storage::*;

#[contractclient(name = "LendingPoolClient")]
pub trait LendingPoolTrait {
    fn liquidate_repay(env: Env, liquidator: Address, borrower: Address, asset: Address, amount: i128) -> i128;
}

#[contractclient(name = "CollateralManagerClient")]
pub trait CollateralManagerTrait {
    fn seize_collateral(env: Env, caller: Address, borrower: Address, asset: Address, amount: i128);
}

#[contract]
pub struct Liquidation;

#[contractimpl]
impl Liquidation {
    pub fn initialize(env: Env, admin: Address, treasury: Address) {
        if has_admin(&env) {
            panic!("already initialized");
        }
        write_admin(&env, &admin);
        write_protocol_treasury(&env, &treasury);
    }

    pub fn liquidate(
        env: Env,
        liquidator: Address,
        borrower: Address,
        debt_asset: Address,
        debt_amount: i128,
        debt_price: i128,
        collateral_asset: Address,
        collateral_price: i128,
        collateral_value_usd: i128,
        collateral_threshold: i128,
        liquidation_penalty: i128,
        pool_address: Address,
        coll_manager_address: Address,
    ) -> i128 {
        liquidator.require_auth();
        if debt_amount <= 0 {
            panic!("invalid debt amount");
        }
        if debt_price <= 0 || collateral_price <= 0 {
            panic!("invalid price");
        }

        // Calculate debt value in USD
        let debt_value_usd = mul_div(debt_amount, debt_price, fixed_point_one());

        // Calculate weighted collateral value
        let weighted_collateral = percent_of(collateral_value_usd, collateral_threshold);

        // Check health factor: must be < 1.0 (under-collateralized)
        let health_factor = if debt_value_usd == 0 {
            fixed_point_one() * 100
        } else {
            mul_div(weighted_collateral, fixed_point_one(), debt_value_usd)
        };

        if health_factor >= fixed_point_one() {
            panic!("borrower is not under-collateralized");
        }

        // Calculate debt value in collateral terms
        let debt_in_collateral = mul_div(debt_amount, debt_price, collateral_price);

        // Apply liquidation bonus for the liquidator
        let collateral_to_seize = checked_add(
            debt_in_collateral,
            percent_of(debt_in_collateral, liquidation_penalty),
        );

        // Repay debt via lending pool
        let pool_client = LendingPoolClient::new(&env, &pool_address);
        let actual_covered = pool_client.liquidate_repay(&liquidator, &borrower, &debt_asset, &debt_amount);

        // Seize collateral from borrower
        let coll_client = CollateralManagerClient::new(&env, &coll_manager_address);
        coll_client.seize_collateral(&liquidator, &borrower, &collateral_asset, &collateral_to_seize);

        emit_liquidation(
            &env,
            &liquidator,
            &borrower,
            &debt_asset,
            &collateral_asset,
            actual_covered,
            collateral_to_seize,
            liquidation_penalty,
        );

        actual_covered
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[contract]
    pub struct MockLendingPool;

    #[contractimpl]
    impl MockLendingPool {
        pub fn liquidate_repay(
            _env: Env,
            _liquidator: Address,
            _borrower: Address,
            _asset: Address,
            amount: i128,
        ) -> i128 {
            amount
        }
    }

    #[contract]
    pub struct MockCollateralManager;

    #[contractimpl]
    impl MockCollateralManager {
        pub fn seize_collateral(_env: Env, _caller: Address, _borrower: Address, _asset: Address, _amount: i128) {}
    }

    #[contract]
    pub struct CheckCollateralManager;

    #[contractimpl]
    impl CheckCollateralManager {
        pub fn seize_collateral(_env: Env, _caller: Address, _borrower: Address, _asset: Address, amount: i128) {
            // debt_in_collateral = 100 * ONE * ONE / ONE = 100 * ONE
            // collateral_to_seize = 100 * ONE + 5% of 100 * ONE = 105 * ONE
            assert_eq!(amount, 105 * fixed_point_one());
        }
    }

    fn create_test_env() -> (Env, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register_contract(None, Liquidation);
        (env, admin, contract_id)
    }

    fn invoke_initialize(env: &Env, contract_id: &Address, admin: &Address, treasury: &Address) {
        env.as_contract(contract_id, || {
            Liquidation::initialize(env.clone(), admin.clone(), treasury.clone())
        });
    }

    #[test]
    fn test_initialize() {
        let (env, admin, contract_id) = create_test_env();
        let treasury = Address::generate(&env);
        invoke_initialize(&env, &contract_id, &admin, &treasury);
        let stored_treasury = env.as_contract(&contract_id, || {
            read_protocol_treasury(&env)
        });
        assert_eq!(stored_treasury, treasury);
    }

    #[test]
    #[should_panic(expected = "borrower is not under-collateralized")]
    fn test_liquidate_healthy_borrower_fails() {
        let (env, admin, contract_id) = create_test_env();
        let treasury = Address::generate(&env);
        invoke_initialize(&env, &contract_id, &admin, &treasury);

        let pool_id = env.register_contract(None, MockLendingPool);
        let cm_id = env.register_contract(None, MockCollateralManager);

        let liquidator = Address::generate(&env);
        let borrower = Address::generate(&env);

        env.as_contract(&contract_id, || {
            Liquidation::liquidate(
                env.clone(),
                liquidator.clone(),
                borrower.clone(),
                Address::generate(&env),
                5 * fixed_point_one(),
                fixed_point_one(),
                Address::generate(&env),
                fixed_point_one(),
                10 * fixed_point_one(),
                80 * fixed_point_one() / 100,
                5 * fixed_point_one() / 100,
                pool_id.clone(),
                cm_id.clone(),
            )
        });
    }

    #[test]
    fn test_liquidate_works() {
        let (env, admin, contract_id) = create_test_env();
        let treasury = Address::generate(&env);
        invoke_initialize(&env, &contract_id, &admin, &treasury);

        let pool_id = env.register_contract(None, MockLendingPool);
        let cm_id = env.register_contract(None, MockCollateralManager);

        let liquidator = Address::generate(&env);
        let borrower = Address::generate(&env);

        let result = env.as_contract(&contract_id, || {
            Liquidation::liquidate(
                env.clone(),
                liquidator.clone(),
                borrower.clone(),
                Address::generate(&env),
                5 * fixed_point_one(),
                fixed_point_one(),
                Address::generate(&env),
                fixed_point_one(),
                fixed_point_one(),
                80 * fixed_point_one() / 100,
                5 * fixed_point_one() / 100,
                pool_id.clone(),
                cm_id.clone(),
            )
        });
        assert_eq!(result, 5 * fixed_point_one());
    }

    #[test]
    #[should_panic(expected = "invalid debt amount")]
    fn test_liquidate_zero_debt_fails() {
        let (env, admin, contract_id) = create_test_env();
        let treasury = Address::generate(&env);
        invoke_initialize(&env, &contract_id, &admin, &treasury);

        env.as_contract(&contract_id, || {
            Liquidation::liquidate(
                env.clone(),
                Address::generate(&env),
                Address::generate(&env),
                Address::generate(&env),
                0,
                fixed_point_one(),
                Address::generate(&env),
                fixed_point_one(),
                10 * fixed_point_one(),
                80 * fixed_point_one() / 100,
                5 * fixed_point_one() / 100,
                Address::generate(&env),
                Address::generate(&env),
            )
        });
    }

    #[test]
    #[should_panic(expected = "invalid price")]
    fn test_liquidate_bad_price_fails() {
        let (env, admin, contract_id) = create_test_env();
        let treasury = Address::generate(&env);
        invoke_initialize(&env, &contract_id, &admin, &treasury);

        env.as_contract(&contract_id, || {
            Liquidation::liquidate(
                env.clone(),
                Address::generate(&env),
                Address::generate(&env),
                Address::generate(&env),
                5 * fixed_point_one(),
                0,
                Address::generate(&env),
                fixed_point_one(),
                10 * fixed_point_one(),
                80 * fixed_point_one() / 100,
                5 * fixed_point_one() / 100,
                Address::generate(&env),
                Address::generate(&env),
            )
        });
    }

    #[test]
    fn test_liquidate_collateral_seized_is_calculated_correctly() {
        let (env, admin, contract_id) = create_test_env();
        let treasury = Address::generate(&env);
        invoke_initialize(&env, &contract_id, &admin, &treasury);

        let pool_id = env.register_contract(None, MockLendingPool);
        let cm_id = env.register_contract(None, CheckCollateralManager);

        let liquidator = Address::generate(&env);
        let borrower = Address::generate(&env);

        let result = env.as_contract(&contract_id, || {
            Liquidation::liquidate(
                env.clone(),
                liquidator.clone(),
                borrower.clone(),
                Address::generate(&env),
                100 * fixed_point_one(),
                fixed_point_one(),
                Address::generate(&env),
                fixed_point_one(),
                100 * fixed_point_one(),
                80 * fixed_point_one() / 100,
                5 * fixed_point_one() / 100,
                pool_id.clone(),
                cm_id.clone(),
            )
        });
        assert_eq!(result, 100 * fixed_point_one());
    }
}
