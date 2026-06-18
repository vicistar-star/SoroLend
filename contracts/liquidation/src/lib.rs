#![no_std]

mod events;
mod math;
mod storage;

use events::*;
use math::*;
use soroban_sdk::{contract, contractimpl, contractclient, contracttype, Address, Env};
use storage::*;

#[contracttype]
pub struct LiquidateParams {
    pub liquidator: Address,
    pub borrower: Address,
    pub debt_asset: Address,
    pub debt_amount: i128,
    pub debt_price: i128,
    pub collateral_asset: Address,
    pub collateral_price: i128,
    pub collateral_value_usd: i128,
    pub collateral_threshold: i128,
    pub liquidation_penalty: i128,
    pub pool_address: Address,
    pub coll_manager_address: Address,
}

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
        params: LiquidateParams,
    ) -> i128 {
        params.liquidator.require_auth();
        if params.debt_amount <= 0 {
            panic!("invalid debt amount");
        }
        if params.debt_price <= 0 || params.collateral_price <= 0 {
            panic!("invalid price");
        }

        let debt_value_usd = mul_div(params.debt_amount, params.debt_price, fixed_point_one());
        let weighted_collateral = percent_of(params.collateral_value_usd, params.collateral_threshold);

        let health_factor = if debt_value_usd == 0 {
            fixed_point_one() * 100
        } else {
            mul_div(weighted_collateral, fixed_point_one(), debt_value_usd)
        };

        if health_factor >= fixed_point_one() {
            panic!("borrower is not under-collateralized");
        }

        let debt_in_collateral = mul_div(params.debt_amount, params.debt_price, params.collateral_price);
        let collateral_to_seize = checked_add(
            debt_in_collateral,
            percent_of(debt_in_collateral, params.liquidation_penalty),
        );

        let pool_client = LendingPoolClient::new(&env, &params.pool_address);
        let actual_covered = pool_client.liquidate_repay(&params.liquidator, &params.borrower, &params.debt_asset, &params.debt_amount);

        let coll_client = CollateralManagerClient::new(&env, &params.coll_manager_address);
        coll_client.seize_collateral(&params.liquidator, &params.borrower, &params.collateral_asset, &collateral_to_seize);

        emit_liquidation(&env, &LiquidationParams {
            liquidator: &params.liquidator,
            borrower: &params.borrower,
            debt_asset: &params.debt_asset,
            collateral_asset: &params.collateral_asset,
            debt_covered: actual_covered,
            collateral_seized: collateral_to_seize,
            liquidation_bonus: params.liquidation_penalty,
        });

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
                LiquidateParams {
                    liquidator: liquidator.clone(),
                    borrower: borrower.clone(),
                    debt_asset: Address::generate(&env),
                    debt_amount: 5 * fixed_point_one(),
                    debt_price: fixed_point_one(),
                    collateral_asset: Address::generate(&env),
                    collateral_price: fixed_point_one(),
                    collateral_value_usd: 10 * fixed_point_one(),
                    collateral_threshold: 80 * fixed_point_one() / 100,
                    liquidation_penalty: 5 * fixed_point_one() / 100,
                    pool_address: pool_id.clone(),
                    coll_manager_address: cm_id.clone(),
                },
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
                LiquidateParams {
                    liquidator: liquidator.clone(),
                    borrower: borrower.clone(),
                    debt_asset: Address::generate(&env),
                    debt_amount: 5 * fixed_point_one(),
                    debt_price: fixed_point_one(),
                    collateral_asset: Address::generate(&env),
                    collateral_price: fixed_point_one(),
                    collateral_value_usd: fixed_point_one(),
                    collateral_threshold: 80 * fixed_point_one() / 100,
                    liquidation_penalty: 5 * fixed_point_one() / 100,
                    pool_address: pool_id.clone(),
                    coll_manager_address: cm_id.clone(),
                },
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
                LiquidateParams {
                    liquidator: Address::generate(&env),
                    borrower: Address::generate(&env),
                    debt_asset: Address::generate(&env),
                    debt_amount: 0,
                    debt_price: fixed_point_one(),
                    collateral_asset: Address::generate(&env),
                    collateral_price: fixed_point_one(),
                    collateral_value_usd: 10 * fixed_point_one(),
                    collateral_threshold: 80 * fixed_point_one() / 100,
                    liquidation_penalty: 5 * fixed_point_one() / 100,
                    pool_address: Address::generate(&env),
                    coll_manager_address: Address::generate(&env),
                },
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
                LiquidateParams {
                    liquidator: Address::generate(&env),
                    borrower: Address::generate(&env),
                    debt_asset: Address::generate(&env),
                    debt_amount: 5 * fixed_point_one(),
                    debt_price: 0,
                    collateral_asset: Address::generate(&env),
                    collateral_price: fixed_point_one(),
                    collateral_value_usd: 10 * fixed_point_one(),
                    collateral_threshold: 80 * fixed_point_one() / 100,
                    liquidation_penalty: 5 * fixed_point_one() / 100,
                    pool_address: Address::generate(&env),
                    coll_manager_address: Address::generate(&env),
                },
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
                LiquidateParams {
                    liquidator: liquidator.clone(),
                    borrower: borrower.clone(),
                    debt_asset: Address::generate(&env),
                    debt_amount: 100 * fixed_point_one(),
                    debt_price: fixed_point_one(),
                    collateral_asset: Address::generate(&env),
                    collateral_price: fixed_point_one(),
                    collateral_value_usd: 100 * fixed_point_one(),
                    collateral_threshold: 80 * fixed_point_one() / 100,
                    liquidation_penalty: 5 * fixed_point_one() / 100,
                    pool_address: pool_id.clone(),
                    coll_manager_address: cm_id.clone(),
                },
            )
        });
        assert_eq!(result, 100 * fixed_point_one());
    }
}
