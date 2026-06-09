#![no_std]

mod events;
pub mod interest;
pub mod math;
mod storage;

use events::*;
use interest::*;
use math::*;
use soroban_sdk::{contract, contracterror, contractimpl, Address, Env};
use storage::*;

#[contracterror]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ContractError {
    AlreadyInitialized = 1,
    UserSupplyNotFound = 2,
    InsufficientShares = 3,
    InsufficientLiquidity = 4,
    InsufficientPoolLiquidity = 5,
    UserBorrowNotFound = 6,
    PoolNotActive = 7,
    AssetMismatch = 8,
}

#[soroban_sdk::contractclient(name = "STokenClient")]
pub trait STokenTrait {
    fn mint(env: Env, to: Address, amount: i128);
    fn burn(env: Env, from: Address, amount: i128);
}

#[contract]
pub struct LendingPool;

#[contractimpl]
impl LendingPool {
    pub fn initialize(env: Env, _admin: Address, config: PoolConfig) -> Result<(), ContractError> {
        if has_pool_config(&env) {
            return Err(ContractError::AlreadyInitialized);
        }

        let state = PoolState {
            total_supply: 0,
            total_borrow: 0,
            total_reserves: 0,
            supply_index: fixed_point_one(),
            borrow_index: fixed_point_one(),
            last_update_timestamp: env.ledger().timestamp(),
        };

        write_pool_config(&env, &config);
        write_pool_state(&env, &state);

        Ok(())
    }

    pub fn set_stoken(env: Env, admin: Address, stoken: Address) -> Result<(), ContractError> {
        let config = read_pool_config(&env);
        config.admin.require_auth();
        write_stoken_contract(&env, &stoken);
        Ok(())
    }

    pub fn supply(
        env: Env,
        caller: Address,
        asset: Address,
        amount: i128,
    ) -> Result<i128, ContractError> {
        caller.require_auth();
        let config = read_pool_config(&env);
        Self::validate_pool_active(&config)?;
        Self::validate_asset(&config, &asset)?;

        Self::accrue_interest(&env);

        let mut state = read_pool_state(&env);

        let shares = if state.total_supply == 0 {
            amount
        } else {
            mul_div(amount, state.supply_index, fixed_point_one())
        };

        let mut user_supply = read_user_supply(&env, &caller).unwrap_or(UserSupply {
            shares: 0,
            principal: 0,
        });

        user_supply.shares = checked_add(user_supply.shares, shares);
        user_supply.principal = checked_add(user_supply.principal, amount);

        state.total_supply = checked_add(state.total_supply, amount);

        write_user_supply(&env, &caller, &user_supply);
        write_pool_state(&env, &state);

        // Mint sTokens
        if has_stoken_contract(&env) {
            let stoken_address = read_stoken_contract(&env);
            let stoken_client = STokenClient::new(&env, &stoken_address);
            stoken_client.mint(&caller, &shares);
        }

        emit_supply(&env, &caller, &asset, amount, shares);

        Ok(shares)
    }

    pub fn withdraw(
        env: Env,
        caller: Address,
        asset: Address,
        amount: i128,
    ) -> Result<i128, ContractError> {
        caller.require_auth();
        let config = read_pool_config(&env);
        Self::validate_pool_active(&config)?;
        Self::validate_asset(&config, &asset)?;

        Self::accrue_interest(&env);

        let mut state = read_pool_state(&env);
        let mut user_supply = read_user_supply(&env, &caller).ok_or(ContractError::UserSupplyNotFound)?;

        let shares = mul_div(amount, fixed_point_one(), state.supply_index);

        if shares > user_supply.shares {
            return Err(ContractError::InsufficientShares);
        }

        if amount > state.total_supply {
            return Err(ContractError::InsufficientLiquidity);
        }

        user_supply.shares = checked_sub(user_supply.shares, shares);
        user_supply.principal = checked_sub(user_supply.principal, amount);

        state.total_supply = checked_sub(state.total_supply, amount);

        write_user_supply(&env, &caller, &user_supply);
        write_pool_state(&env, &state);

        // Burn sTokens
        if has_stoken_contract(&env) {
            let stoken_address = read_stoken_contract(&env);
            let stoken_client = STokenClient::new(&env, &stoken_address);
            stoken_client.burn(&caller, &shares);
        }

        emit_withdraw(&env, &caller, &asset, amount, shares);

        Ok(amount)
    }

    pub fn borrow(
        env: Env,
        caller: Address,
        asset: Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        caller.require_auth();
        let config = read_pool_config(&env);
        Self::validate_pool_active(&config)?;
        Self::validate_asset(&config, &asset)?;

        Self::accrue_interest(&env);

        let mut state = read_pool_state(&env);

        let available_liquidity = checked_sub(state.total_supply, state.total_borrow);
        if amount > available_liquidity {
            return Err(ContractError::InsufficientPoolLiquidity);
        }

        let mut user_borrow = read_user_borrow(&env, &caller).unwrap_or(UserBorrow {
            principal: 0,
            interest_index: state.borrow_index,
            accrued_interest: 0,
        });

        user_borrow.principal = checked_add(user_borrow.principal, amount);
        state.total_borrow = checked_add(state.total_borrow, amount);

        write_user_borrow(&env, &caller, &user_borrow);
        write_pool_state(&env, &state);
        emit_borrow(&env, &caller, &asset, amount);

        Ok(())
    }

    pub fn repay(
        env: Env,
        caller: Address,
        asset: Address,
        amount: i128,
    ) -> Result<i128, ContractError> {
        caller.require_auth();
        let config = read_pool_config(&env);
        Self::validate_pool_active(&config)?;
        Self::validate_asset(&config, &asset)?;

        Self::accrue_interest(&env);

        let mut state = read_pool_state(&env);
        let mut user_borrow = read_user_borrow(&env, &caller).ok_or(ContractError::UserBorrowNotFound)?;

        let total_debt = checked_add(user_borrow.principal, user_borrow.accrued_interest);
        let repay_amount = if amount > total_debt { total_debt } else { amount };

        let principal_payment = if repay_amount >= user_borrow.principal {
            let remaining = checked_sub(repay_amount, user_borrow.principal);
            user_borrow.accrued_interest = checked_sub(user_borrow.accrued_interest, remaining);
            let old_principal = user_borrow.principal;
            user_borrow.principal = 0;
            old_principal
        } else {
            user_borrow.principal = checked_sub(user_borrow.principal, repay_amount);
            repay_amount
        };

        state.total_borrow = checked_sub(state.total_borrow, principal_payment);

        write_user_borrow(&env, &caller, &user_borrow);
        write_pool_state(&env, &state);
        emit_repay(&env, &caller, &asset, repay_amount);

        Ok(repay_amount)
    }

    pub fn get_supply_apy(env: Env, asset: Address) -> i128 {
        let config = read_pool_config(&env);
        let state = read_pool_state(&env);

        if !Self::validate_asset_internal(&config, &asset) {
            return 0;
        }

        let utilization = InterestRateModel::calculate_utilization(state.total_supply, state.total_borrow);
        InterestRateModel::get_supply_rate(&config.rate_params, utilization, config.reserve_factor)
    }

    pub fn get_borrow_apy(env: Env, asset: Address) -> i128 {
        let config = read_pool_config(&env);
        let state = read_pool_state(&env);

        if !Self::validate_asset_internal(&config, &asset) {
            return 0;
        }

        let utilization = InterestRateModel::calculate_utilization(state.total_supply, state.total_borrow);
        InterestRateModel::get_borrow_rate(&config.rate_params, utilization)
    }

    fn accrue_interest(env: &Env) -> Result<(), ContractError> {
        let config = read_pool_config(env);
        let mut state = read_pool_state(env);

        let current_timestamp = env.ledger().timestamp();
        let time_diff = current_timestamp - state.last_update_timestamp;

        if time_diff == 0 {
            return Ok(());
        }

        let utilization = InterestRateModel::calculate_utilization(state.total_supply, state.total_borrow);
        let borrow_rate = InterestRateModel::get_borrow_rate(&config.rate_params, utilization);

        let seconds_per_year: i128 = 31_536_000;
        let rate_per_second = mul_div(borrow_rate, time_diff as i128, seconds_per_year);

        let borrow_interest = mul_div(state.total_borrow, rate_per_second, fixed_point_one());
        let reserve = mul_div(borrow_interest, config.reserve_factor, fixed_point_one());

        state.total_borrow = checked_add(state.total_borrow, borrow_interest);
        state.total_reserves = checked_add(state.total_reserves, reserve);
        state.supply_index = mul_div(
            state.supply_index,
            checked_add(fixed_point_one(), rate_per_second),
            fixed_point_one(),
        );
        state.borrow_index = mul_div(
            state.borrow_index,
            checked_add(fixed_point_one(), rate_per_second),
            fixed_point_one(),
        );
        state.last_update_timestamp = current_timestamp;

        write_pool_state(env, &state);
        emit_interest_accrued(
            env,
            &config.asset,
            borrow_rate,
            InterestRateModel::get_supply_rate(&config.rate_params, utilization, config.reserve_factor),
            state.total_borrow,
            state.total_supply,
        );

        Ok(())
    }

    pub fn get_pool_state(env: Env) -> PoolState {
        read_pool_state(&env)
    }

    pub fn get_pool_config(env: Env) -> PoolConfig {
        read_pool_config(&env)
    }

    pub fn get_user_supply(env: Env, user: Address) -> UserSupply {
        read_user_supply(&env, &user).unwrap_or(UserSupply {
            shares: 0,
            principal: 0,
        })
    }

    pub fn get_user_borrow(env: Env, user: Address) -> UserBorrow {
        read_user_borrow(&env, &user).unwrap_or(UserBorrow {
            principal: 0,
            interest_index: fixed_point_one(),
            accrued_interest: 0,
        })
    }

    fn validate_pool_active(config: &PoolConfig) -> Result<(), ContractError> {
        if !config.is_active {
            return Err(ContractError::PoolNotActive);
        }
        Ok(())
    }

    fn validate_asset(config: &PoolConfig, asset: &Address) -> Result<(), ContractError> {
        if config.asset != *asset {
            return Err(ContractError::AssetMismatch);
        }
        Ok(())
    }

    fn validate_asset_internal(config: &PoolConfig, asset: &Address) -> bool {
        config.asset == *asset
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};

    fn create_test_env() -> (Env, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let asset = Address::generate(&env);
        let contract_id = env.register_contract(None, LendingPool);

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

        (env, admin, asset, contract_id)
    }

    fn create_pool_config(asset: &Address) -> PoolConfig {
        PoolConfig {
            admin: Address::generate(&soroban_sdk::Env::default()),
            asset: asset.clone(),
            rate_params: RateParams {
                base_rate: 0,
                slope1: 4 * ONE / 100,
                slope2: 75 * ONE / 100,
                optimal_utilization: 80 * ONE / 100,
            },
            reserve_factor: 10 * ONE / 100,
            ltv_ratio: 75 * ONE / 100,
            liquidation_threshold: 80 * ONE / 100,
            liquidation_penalty: 5 * ONE / 100,
            decimals: 7,
            is_active: true,
        }
    }

    fn invoke_initialize(env: &Env, contract_id: &Address, admin: &Address, config: PoolConfig) -> Result<(), ContractError> {
        env.as_contract(contract_id, || {
            LendingPool::initialize(env.clone(), admin.clone(), config)
        })
    }

    fn invoke_supply(env: &Env, contract_id: &Address, caller: &Address, asset: &Address, amount: i128) -> Result<i128, ContractError> {
        env.as_contract(contract_id, || {
            LendingPool::supply(env.clone(), caller.clone(), asset.clone(), amount)
        })
    }

    fn invoke_withdraw(env: &Env, contract_id: &Address, caller: &Address, asset: &Address, amount: i128) -> Result<i128, ContractError> {
        env.as_contract(contract_id, || {
            LendingPool::withdraw(env.clone(), caller.clone(), asset.clone(), amount)
        })
    }

    fn invoke_borrow(env: &Env, contract_id: &Address, caller: &Address, asset: &Address, amount: i128) -> Result<(), ContractError> {
        env.as_contract(contract_id, || {
            LendingPool::borrow(env.clone(), caller.clone(), asset.clone(), amount)
        })
    }

    fn invoke_repay(env: &Env, contract_id: &Address, caller: &Address, asset: &Address, amount: i128) -> Result<i128, ContractError> {
        env.as_contract(contract_id, || {
            LendingPool::repay(env.clone(), caller.clone(), asset.clone(), amount)
        })
    }

    fn invoke_get_pool_state(env: &Env, contract_id: &Address) -> PoolState {
        env.as_contract(contract_id, || {
            LendingPool::get_pool_state(env.clone())
        })
    }

    fn invoke_get_supply_apy(env: &Env, contract_id: &Address, asset: &Address) -> i128 {
        env.as_contract(contract_id, || {
            LendingPool::get_supply_apy(env.clone(), asset.clone())
        })
    }

    fn invoke_get_borrow_apy(env: &Env, contract_id: &Address, asset: &Address) -> i128 {
        env.as_contract(contract_id, || {
            LendingPool::get_borrow_apy(env.clone(), asset.clone())
        })
    }

    #[test]
    fn test_initialize() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);

        let result = invoke_initialize(&env, &contract_id, &admin, config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_initialize_twice_fails() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);

        assert!(invoke_initialize(&env, &contract_id, &admin, config.clone()).is_ok());
        let result = invoke_initialize(&env, &contract_id, &admin, config);
        assert_eq!(result, Err(ContractError::AlreadyInitialized));
    }

    #[test]
    fn test_supply() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);
        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let user = Address::generate(&env);
        let amount = 1_000_000_000i128;

        let result = invoke_supply(&env, &contract_id, &user, &asset, amount);
        assert!(result.is_ok());

        let state = invoke_get_pool_state(&env, &contract_id);
        assert_eq!(state.total_supply, amount);
    }

    #[test]
    fn test_supply_and_withdraw() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);
        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let user = Address::generate(&env);
        let amount = 1_000_000_000i128;

        assert!(invoke_supply(&env, &contract_id, &user, &asset, amount).is_ok());
        let result = invoke_withdraw(&env, &contract_id, &user, &asset, amount);
        assert!(result.is_ok());

        let state = invoke_get_pool_state(&env, &contract_id);
        assert_eq!(state.total_supply, 0);
    }

    #[test]
    fn test_borrow_insufficient_liquidity() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);
        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let user = Address::generate(&env);
        let result = invoke_borrow(&env, &contract_id, &user, &asset, 1000);
        assert_eq!(result, Err(ContractError::InsufficientPoolLiquidity));
    }

    #[test]
    fn test_supply_and_borrow() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);
        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let supplier = Address::generate(&env);
        let borrower = Address::generate(&env);

        assert!(invoke_supply(&env, &contract_id, &supplier, &asset, 1000).is_ok());
        let result = invoke_borrow(&env, &contract_id, &borrower, &asset, 500);
        assert!(result.is_ok());

        let state = invoke_get_pool_state(&env, &contract_id);
        assert_eq!(state.total_borrow, 500);
    }

    #[test]
    fn test_get_apy() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);
        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let apy = invoke_get_supply_apy(&env, &contract_id, &asset);
        assert_eq!(apy, 0);

        let borrow_apy = invoke_get_borrow_apy(&env, &contract_id, &asset);
        assert_eq!(borrow_apy, 0);
    }

    #[test]
    fn test_withdraw_more_than_supplied_fails() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);
        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let user = Address::generate(&env);
        assert!(invoke_supply(&env, &contract_id, &user, &asset, 500).is_ok());
        let result = invoke_withdraw(&env, &contract_id, &user, &asset, 1000);
        assert_eq!(result, Err(ContractError::InsufficientShares));
    }

    #[test]
    fn test_repay_full_debt() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);
        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let supplier = Address::generate(&env);
        let borrower = Address::generate(&env);

        assert!(invoke_supply(&env, &contract_id, &supplier, &asset, 1000).is_ok());
        assert!(invoke_borrow(&env, &contract_id, &borrower, &asset, 500).is_ok());
        let result = invoke_repay(&env, &contract_id, &borrower, &asset, 500);
        assert!(result.is_ok());

        let state = invoke_get_pool_state(&env, &contract_id);
        assert_eq!(state.total_borrow, 0);
    }

    #[test]
    fn test_pool_not_active() {
        let (env, admin, asset, contract_id) = create_test_env();
        let mut config = create_pool_config(&asset);
        config.is_active = false;

        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let user = Address::generate(&env);
        let result = invoke_supply(&env, &contract_id, &user, &asset, 100);
        assert_eq!(result, Err(ContractError::PoolNotActive));
    }

    #[test]
    fn test_wrong_asset_fails() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);
        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let wrong_asset = Address::generate(&env);
        let user = Address::generate(&env);
        let result = invoke_supply(&env, &contract_id, &user, &wrong_asset, 100);
        assert_eq!(result, Err(ContractError::AssetMismatch));
    }

    #[contract]
    pub struct MockSToken;
    #[contractimpl]
    impl MockSToken {
        pub fn mint(_env: Env, _to: Address, _amount: i128) {}
        pub fn burn(_env: Env, _from: Address, _amount: i128) {}
    }

    #[test]
    fn test_stoken_integration() {
        let (env, admin, asset, contract_id) = create_test_env();
        let config = create_pool_config(&asset);
        assert!(invoke_initialize(&env, &contract_id, &admin, config).is_ok());

        let mock_stoken_id = env.register_contract(None, MockSToken);
        
        env.as_contract(&contract_id, || {
            LendingPool::set_stoken(env.clone(), admin.clone(), mock_stoken_id.clone()).unwrap();
        });

        let user = Address::generate(&env);
        let amount = 1_000_000_000i128;

        // Supply should call mint
        assert!(invoke_supply(&env, &contract_id, &user, &asset, amount).is_ok());

        // Withdraw should call burn
        assert!(invoke_withdraw(&env, &contract_id, &user, &asset, amount).is_ok());
    }
}
