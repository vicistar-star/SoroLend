#![no_std]
use soroban_sdk::{contract, contractimpl, contractclient, Address, Env};

mod storage;
mod math;
mod events;

use crate::storage::*;
use crate::math::{mul_div, fixed_point_one, checked_add, checked_sub};
use crate::events::{emit_collateral_deposit, emit_collateral_withdraw, emit_collateral_seized};

#[contractclient(name = "PriceOracleClient")]
pub trait PriceOracleTrait {
    fn get_price(env: Env, asset: Address) -> i128;
}

#[contract]
pub struct CollateralManager;

#[contractimpl]
impl CollateralManager {
    pub fn initialize(env: Env, admin: Address) {
        if has_admin(&env) {
            panic!("already initialized");
        }
        write_admin(&env, &admin);
    }

    pub fn set_oracle(env: Env, admin: Address, oracle: Address) {
        admin.require_auth();
        let stored_admin = read_admin(&env);
        if admin != stored_admin {
            panic!("not authorized");
        }
        write_oracle(&env, &oracle);
    }

    pub fn deposit_collateral(env: Env, user: Address, asset: Address, amount: i128) {
        user.require_auth();
        let current_amount = read_collateral(&env, user.clone()).get(asset.clone()).unwrap_or(0);
        let new_amount = checked_add(current_amount, amount);
        write_collateral(&env, user.clone(), asset.clone(), new_amount);
        emit_collateral_deposit(&env, &user, &asset, amount);
    }

    pub fn withdraw_collateral(env: Env, user: Address, asset: Address, amount: i128) {
        user.require_auth();
        let current_amount = read_collateral(&env, user.clone()).get(asset.clone()).unwrap_or(0);
        let new_amount = checked_sub(current_amount, amount);
        write_collateral(&env, user.clone(), asset.clone(), new_amount);
        emit_collateral_withdraw(&env, &user, &asset, amount);
    }

    pub fn seize_collateral(env: Env, caller: Address, borrower: Address, asset: Address, amount: i128) {
        caller.require_auth();
        let current_amount = read_collateral(&env, borrower.clone()).get(asset.clone()).unwrap_or(0);
        if amount > current_amount {
            panic!("insufficient collateral");
        }
        let new_borrower_amount = checked_sub(current_amount, amount);
        write_collateral(&env, borrower.clone(), asset.clone(), new_borrower_amount);

        let caller_current = read_collateral(&env, caller.clone()).get(asset.clone()).unwrap_or(0);
        let new_caller_amount = checked_add(caller_current, amount);
        write_collateral(&env, caller.clone(), asset.clone(), new_caller_amount);

        emit_collateral_seized(&env, &caller, &borrower, &asset, amount);
    }

    fn get_price_internal(env: &Env, asset: Address) -> i128 {
        if has_oracle(env) {
            let oracle_addr = read_oracle(env);
            let oracle_client = PriceOracleClient::new(env, &oracle_addr);
            oracle_client.get_price(&asset)
        } else {
            read_price(env, asset)
        }
    }

    pub fn get_collateral_value_usd(env: Env, user: Address) -> i128 {
        let collaterals = read_collateral(&env, user);
        let mut total_value = 0;
        for (asset, amount) in collaterals.iter() {
            let price = Self::get_price_internal(&env, asset);
            total_value = checked_add(total_value, mul_div(amount, price, fixed_point_one()));
        }
        total_value
    }

    pub fn get_available_borrow_usd(env: Env, user: Address) -> i128 {
        let collaterals = read_collateral(&env, user);
        let mut available_borrow = 0;
        for (asset, amount) in collaterals.iter() {
            let price = Self::get_price_internal(&env, asset.clone());
            let threshold = read_liquidation_threshold(&env, asset);
            let value = mul_div(amount, price, fixed_point_one());
            available_borrow = checked_add(available_borrow, mul_div(value, threshold, fixed_point_one()));
        }
        available_borrow
    }

    pub fn get_health_factor(env: Env, user: Address, total_borrow_usd: i128) -> i128 {
        if total_borrow_usd == 0 {
            return fixed_point_one() * 100;
        }
        let available_borrow = Self::get_available_borrow_usd(env.clone(), user);
        mul_div(available_borrow, fixed_point_one(), total_borrow_usd)
    }

    pub fn get_price(env: Env, asset: Address) -> i128 {
        Self::get_price_internal(&env, asset)
    }

    pub fn set_price(env: Env, asset: Address, price: i128) {
        // Fallback when no oracle is set
        write_price(&env, asset, price);
    }

    pub fn set_liquidation_threshold(env: Env, asset: Address, threshold: i128) {
        write_liquidation_threshold(&env, asset, threshold);
    }
}
