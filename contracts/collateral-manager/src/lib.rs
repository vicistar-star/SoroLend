#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod math;
mod events;

use crate::storage::{read_collateral, write_collateral, read_price, write_price, read_liquidation_threshold, write_liquidation_threshold};
use crate::math::{mul_div, fixed_point_one, checked_add, checked_sub};
use crate::events::{emit_collateral_deposit, emit_collateral_withdraw};

#[contract]
pub struct CollateralManager;

#[contractimpl]
impl CollateralManager {
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
        
        // In Day 3, we should check health factor here if there are active borrows
    }

    pub fn get_collateral_value_usd(env: Env, user: Address) -> i128 {
        let collaterals = read_collateral(&env, user);
        let mut total_value = 0;
        for (asset, amount) in collaterals.iter() {
            let price = read_price(&env, asset);
            total_value = checked_add(total_value, mul_div(amount, price, fixed_point_one()));
        }
        total_value
    }

    pub fn get_available_borrow_usd(env: Env, user: Address) -> i128 {
        let collaterals = read_collateral(&env, user);
        let mut available_borrow = 0;
        for (asset, amount) in collaterals.iter() {
            let price = read_price(&env, asset.clone());
            let threshold = read_liquidation_threshold(&env, asset);
            let value = mul_div(amount, price, fixed_point_one());
            available_borrow = checked_add(available_borrow, mul_div(value, threshold, fixed_point_one()));
        }
        available_borrow
    }

    pub fn get_health_factor(env: Env, user: Address, total_borrow_usd: i128) -> i128 {
        if total_borrow_usd == 0 {
            return fixed_point_one() * 100; // Representing infinity
        }
        let available_borrow = Self::get_available_borrow_usd(env.clone(), user);
        mul_div(available_borrow, fixed_point_one(), total_borrow_usd)
    }

    pub fn set_price(env: Env, asset: Address, price: i128) {
        // Mock admin control for Day 2
        write_price(&env, asset, price);
    }

    pub fn set_liquidation_threshold(env: Env, asset: Address, threshold: i128) {
        // Mock admin control for Day 2
        write_liquidation_threshold(&env, asset, threshold);
    }
}
