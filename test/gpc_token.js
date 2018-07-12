
var GpcToken = artifacts.require('GpcToken');
var GpcTokenSale = artifacts.require('GpcTokenSale');

contract('GpcToken', function(accounts) {
	var admin_addr = accounts[1];
	var presale_purchaser = accounts[5];
	var precirculation_allowed_addr = accounts[6];
	var precirculation_disallowed_addr = accounts[7];
	var transfer_operator = accounts[8];
	var attacker = accounts[9];

    var Gpc_token;
    var Gpc_token_sale;

    console.log("Imported node Accounts: \n", accounts);

    it ("GpcToken: deploy", function() {
    	console.log('');
        console.log('-------- GpcToken: deploy --------');
        console.log('');
        return GpcToken.deployed()
            .then(function(tt) {
                Gpc_token = tt;
                console.log('GpcToken Address: ' + Gpc_token.address);
                return GpcTokenSale.deployed();
            })
            .then(function(tts) {
                Gpc_token_sale = tts;
                console.log('GpcTokenSale Address: ' + Gpc_token_sale.address);
            })
    });

    it ("GpcToken: change unlock time", function() {
        console.log('');
        console.log('-------- GpcToken: change unlock time --------');
        console.log('');       
        var new_unlock_time_1 = 999999999987;
        var new_unlock_time_2 = 8723439;
        var new_unlock_time_3 = 123776589;
        return Gpc_token_sale.changeUnlockTime(new_unlock_time_1, {from: admin_addr, gas: 4700000})
        	.then(function() {
        		return Gpc_token.getUnlockTime();
        	})
            .then(function(res) {
                console.log('New unlock time: ' + res.toString());
                assert.equal(res, new_unlock_time_1, 'incorrect unlock time!');
            })
            .then(function() {
            	return Gpc_token_sale.changeUnlockTime(new_unlock_time_2, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
            	return Gpc_token.getUnlockTime();
            })
            .then(function(res) {
                console.log('New unlock time: ' + res.toString());
                assert.equal(res, new_unlock_time_2, 'incorrect unlock time!');
            })
            .then(function() {
            	return Gpc_token_sale.changeUnlockTime(new_unlock_time_3, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
            	return Gpc_token.getUnlockTime();
            })
            .then(function(res) {
                console.log('New unlock time: ' + res.toString());
                assert.equal(res, new_unlock_time_3, 'incorrect unlock time!');
            })
    });

    it ("GpcToken: mint tokens through presale", function() {
    	console.log('');
        console.log('-------- GpcToken: mint tokens through presale --------');
        console.log('');
        presale_amount = new web3.BigNumber(8888888800000000);
        supply_increase = (presale_amount / 40) * 100;
        return Gpc_token.totalSupply()
            .then(function(total_supply) {
                previous_total_supply = total_supply;
                console.log('Previous total token supply: ' + previous_total_supply);
            })
            .then(function() {
                return Gpc_token_sale.allocatePresaleTokens(presale_purchaser, presale_amount, {from: admin_addr, gas: 4700000});
            })
            .then(function() {
                return Gpc_token.totalSupply();
            })
            .then(function(total_supply) {
                current_total_supply = total_supply;
                console.log('Current total token supply: ' + current_total_supply);
                assert.equal(current_total_supply - previous_total_supply, supply_increase, 'total supply should increase by the expected amount!');
            });
    });

    it ("GpcToken: precirculation check", function() {
      	console.log('');  	
    	console.log('-------- GpcToken: precirculation check --------');
    	console.log('');
    	addr_to_check = precirculation_allowed_addr;
    	return Gpc_token_sale.disallowPrecirculation(addr_to_check, {from: admin_addr, gas: 4700000})
    		.then(function() {
    			return Gpc_token.isPrecirculationAllowed(addr_to_check);
    		})
    		.then(function(res) {
    			console.log('precirculation allowed for ' + addr_to_check + ': ' + res.toString());
    			assert.equal(res, false);
    		})
    		.then(function() {
    			return Gpc_token_sale.allowPrecirculation(addr_to_check, {from: admin_addr, gas: 4700000});
    		})
    		.then(function() {
    			return Gpc_token.isPrecirculationAllowed(addr_to_check);
    		})
    		.then(function(res) {
    			console.log('precirculation allowed for ' + addr_to_check + ': ' + res.toString());
    			assert.equal(res, true);
    		})
    		.then(function() {
    			return Gpc_token_sale.disallowPrecirculation(addr_to_check, {from: admin_addr, gas: 4700000});
    		})
    		.then(function() {
    			return Gpc_token_sale.isPrecirculationAllowed(addr_to_check);
    		})
    		.then(function(res) {
    			console.log('precirculation allowed for ' + addr_to_check + ': ' + res.toString());
    			assert.equal(res, false);
    		});
    });

    it ("GpcToken: token transfer() before unlockTime", function() {
        console.log('');
        console.log('-------- GpcToken: token transfer() before unlockTime --------');
        console.log('');
        far_future_unlock_time = 99999999999999999;
        transfer_amount_1 = new web3.BigNumber(1234);
        return Gpc_token_sale.changeUnlockTime(far_future_unlock_time, {from: admin_addr, gas: 4700000})
        	.then(function() {
        		return Gpc_token_sale.allowPrecirculation(presale_purchaser, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_init_balance = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_init_balance = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
        		console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens ...')
        		return Gpc_token.transfer(precirculation_allowed_addr, transfer_amount_1, {from: presale_purchaser, gas: 4700000})
        	})
        	.then(function() {
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_first_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_first_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
        		assert.equal(presale_purchaser_init_balance.minus(presale_purchaser_after_first_transfer).equals(transfer_amount_1), 'should decrease by the transfer amount!');
        		assert.equal(precirculation_allowed_addr_balance_after_first_transfer.minus(precirculation_allowed_addr_init_balance).equals(transfer_amount_1), 'should increase by the transfer amount!');
        	})
        	.then(function() {
        		// transferring more amount than the balance, should fail
        		transfer_amount_2 = parseInt(precirculation_allowed_addr_balance_after_first_transfer) + 3537;
        		console.log('');
        		console.log('>>> transferring ' + transfer_amount_2.toString() + ' tokens back to presale purchaser...')
        		return Gpc_token.transfer(presale_purchaser, transfer_amount_2, {from: precirculation_allowed_addr, gas: 4700000});
        	})
        	.catch(function() {
        		console.log('>>> transfer did not succeed since the amount is higher than the blance, expected');
        	})
        	.then(function() {
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_second_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_second_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
        		assert.equal(presale_purchaser_after_second_transfer.equals(presale_purchaser_after_first_transfer), true, 'should not change!');
        		assert.equal(precirculation_allowed_addr_balance_after_second_transfer.equals(precirculation_allowed_addr_balance_after_first_transfer), true, 'should not change!');
        	})
        	.then(function() {
        		console.log('');
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_third_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_disallowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_disallowed_addr_init_balance = balance;
        		console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
        		console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens to precirculation disallowed address...')
        		return Gpc_token.transfer(precirculation_disallowed_addr, transfer_amount_1, {from: presale_purchaser, gas: 4700000})
        	})
        	.catch(function() {
        		console.log('>>> transfer did not succeed since the target address is disallowed from precirculation, expected');
        	})
        	.then(function() {
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_third_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_disallowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_disallowed_addr_balance_after_third_transfer = balance;
        		console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
        		assert.equal(presale_purchaser_after_third_transfer.equals(presale_purchaser_after_second_transfer), true, 'should not change!');
        		assert.equal(precirculation_disallowed_addr_balance_after_third_transfer.equals(precirculation_disallowed_addr_init_balance), true, 'should not change!');
        	})
    });

    it ("GpcToken: token transfer() after unlockTime", function() {
        console.log('');
        console.log('-------- GpcToken: token transfer() after unlockTime --------');
        console.log('');
        past_unlock_time = 0;
        transfer_amount_1 = 1234;
        return Gpc_token_sale.changeUnlockTime(past_unlock_time, {from: admin_addr, gas: 4700000})
        	.then(function() {
        		return Gpc_token_sale.allowPrecirculation(presale_purchaser, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_init_balance = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_init_balance = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
        		console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens ...')
        		return Gpc_token.transfer(precirculation_allowed_addr, transfer_amount_1, {from: presale_purchaser, gas: 4700000})
        	})
        	.then(function() {
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_first_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_first_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
        		assert.equal(presale_purchaser_init_balance.minus(presale_purchaser_after_first_transfer).equals(transfer_amount_1), true, 'should decrease by the transfer amount!');
        		assert.equal(precirculation_allowed_addr_balance_after_first_transfer.minus(precirculation_allowed_addr_init_balance).equals(transfer_amount_1), true, 'should increase by the transfer amount!');
        	})
        	.then(function() {
        		// transferring more amount than the balance, should fail
        		transfer_amount_2 = parseInt(precirculation_allowed_addr_balance_after_first_transfer) + 3537;
        		console.log('');
        		console.log('>>> transferring ' + transfer_amount_2.toString() + ' tokens back to presale purchaser...')
        		return Gpc_token.transfer(presale_purchaser, transfer_amount_2, {from: precirculation_allowed_addr, gas: 4700000});
        	})
        	.catch(function() {
        		console.log('>>> transfer did not succeed since the amount is higher than the blance, expected');
        	})
        	.then(function() {
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_second_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_second_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
        		assert.equal(presale_purchaser_after_second_transfer.equals(presale_purchaser_after_first_transfer), true, 'should not change!');
        		assert.equal(precirculation_allowed_addr_balance_after_second_transfer.equals(precirculation_allowed_addr_balance_after_first_transfer), true, 'should not change!');
        	})
        	.then(function() {
        		console.log('');
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_third_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_disallowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_disallowed_addr_init_balance = balance;
        		console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
        		console.log('>>> transferring ' + transfer_amount_1.toString() + ' tokens to precirculation disallowed address...')
        		return Gpc_token.transfer(precirculation_disallowed_addr, transfer_amount_1, {from: presale_purchaser, gas: 4700000})
        	})
        	.then(function() {
        		console.log('>>> transfer succeeded since unlockTime is already passed, expected');
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_third_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_disallowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_disallowed_addr_balance_after_third_transfer = balance;
        		console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
        		assert.equal(presale_purchaser_after_second_transfer.minus(presale_purchaser_after_third_transfer).equals(transfer_amount_1), true, 'should decrease by the transfer amount!');
        		assert.equal(precirculation_disallowed_addr_balance_after_third_transfer.minus(precirculation_disallowed_addr_init_balance).equals(transfer_amount_1), true, 'should increase by the transfer amount!');
        	})
    });

    it ("GpcToken: token transferFrom() before unlockTime", function() {
    	console.log('');
        console.log('-------- GpcToken: token transferFrom() before unlockTime --------');
        console.log('');
        far_future_unlock_time = 99999999999999999;
        transfer_amount_1 = new web3.BigNumber(1234);
        transfer_amount_2 = new web3.BigNumber(355);
        transfer_amount_3 = new web3.BigNumber(100);        
        allowance_amount = new web3.BigNumber(1000);
        return Gpc_token_sale.changeUnlockTime(far_future_unlock_time, {from: admin_addr, gas: 4700000})
        	.then(function() {
        		return Gpc_token_sale.allowPrecirculation(presale_purchaser, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		console.log('approving allowance: ' + allowance_amount.toString());
        		return Gpc_token.approve(transfer_operator, allowance_amount, {from: presale_purchaser, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('');
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_init_balance = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_init_balance = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
        		console.log('>>> using transferFrom() to transfer ' + transfer_amount_1.toString() + ' tokens...');
        		return Gpc_token.transferFrom(presale_purchaser, precirculation_allowed_addr, transfer_amount_1, 
        			{from: transfer_operator, gas: 4700000});
        	})
        	.catch(function() {
        		console.log('>>> transferFrom() did not succeed since the amount is higher than the blance, expected');
        	})
        	.then(function() {
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_first_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_first_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
        	    assert.equal(presale_purchaser_after_first_transfer.equals(presale_purchaser_init_balance), true, 'should not change!');
        		assert.equal(precirculation_allowed_addr_balance_after_first_transfer.equals(precirculation_allowed_addr_init_balance), true, 'should not change!');
        	})
        	.then(function() {
        		console.log('');
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_first_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_first_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
        		console.log('>>> using transferFrom() to transfer ' + transfer_amount_2.toString() + ' tokens...');
        		return Gpc_token.transferFrom(presale_purchaser, precirculation_allowed_addr, transfer_amount_2, 
        			{from: transfer_operator, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_second_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_second_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_second_transfer.toString());
                assert.equal(allowance_amount.minus(allowance_remaining).equals(transfer_amount_2), true, 'should decrease by transfer amount!');
        	    assert.equal(presale_purchaser_after_first_transfer.minus(presale_purchaser_after_second_transfer).equals(transfer_amount_2), true, 'should decrease by transfer amount!');
        		assert.equal(precirculation_allowed_addr_balance_after_second_transfer.minus(precirculation_allowed_addr_balance_after_first_transfer).equals(transfer_amount_2), true, 'should increase by transfer amount!');
        	})
        	.then(function() {
        		console.log('');
        		return Gpc_token_sale.allowPrecirculation(transfer_operator, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_second_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_disallowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_disallowed_addr_init_balance = balance;
        		console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
        		console.log('>>> using transferFrom() to transfer ' + transfer_amount_3.toString() + ' tokens...');
        		return Gpc_token.transferFrom(presale_purchaser, precirculation_disallowed_addr, transfer_amount_3, 
        			{from: transfer_operator, gas: 4700000});
        	})
        	.catch(function() {
        		console.log('>>> transferFrom() did not succeed since the target address is not allowed for precirculation, expected');
        	})
        	.then(function() {
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_third_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_disallowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_disallowed_addr_balance_after_third_transfer = balance;
        		console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
        	    assert.equal(allowance_amount.minus(allowance_remaining).equals(transfer_amount_2), true, 'should decrease by transfer amount!');
        	    assert.equal(presale_purchaser_after_third_transfer.equals(presale_purchaser_after_second_transfer), true, 'should not change!');
        		assert.equal(precirculation_disallowed_addr_balance_after_third_transfer.equals(precirculation_disallowed_addr_init_balance), true, 'should not change!');
        	})
    });

    it ("GpcToken: token transferFrom() after unlockTime", function() {
    	console.log('');
        console.log('-------- GpcToken: token transferFrom() after unlockTime --------');
        console.log('');
        past_unlock_time = 0;
        transfer_amount_1 = new web3.BigNumber(1234);
        transfer_amount_2 = new web3.BigNumber(355);
        transfer_amount_3 = new web3.BigNumber(100);
        attacker_transfer_amount = new web3.BigNumber(10);
        allowance_amount = new web3.BigNumber(1000);
        return Gpc_token_sale.changeUnlockTime(past_unlock_time, {from: admin_addr, gas: 4700000})
        	.then(function() {
        		return Gpc_token_sale.allowPrecirculation(presale_purchaser, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token_sale.allowPrecirculation(precirculation_allowed_addr, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.approve(transfer_operator, 0, {from: presale_purchaser, gas: 4700000});
        	})
        	.then(function() {
        		console.log('approving allowance: ' + allowance_amount.toString());
        		return Gpc_token.approve(transfer_operator, allowance_amount, {from: presale_purchaser, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('');
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_init_balance = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_init_balance.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_init_balance = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_init_balance.toString());
        		console.log('>>> using transferFrom() to transfer ' + transfer_amount_1.toString() + ' tokens...');
        		return Gpc_token.transferFrom(presale_purchaser, precirculation_allowed_addr, transfer_amount_1, 
        			{from: transfer_operator, gas: 4700000});
        	})
        	.catch(function() {
        		console.log('>>> transferFrom() did not succeed since the amount is higher than the blance, expected');
        	})
        	.then(function() {
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_first_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_first_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
        	    assert.equal(presale_purchaser_after_first_transfer.minus(presale_purchaser_init_balance), 0, 'should not change!');
        		assert.equal(precirculation_allowed_addr_balance_after_first_transfer.minus(precirculation_allowed_addr_init_balance), 0, 'should not change!');
        	})
        	.then(function() {
        		console.log('');
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_first_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_first_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_first_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_first_transfer.toString());
        		console.log('>>> using transferFrom() to transfer ' + transfer_amount_2.toString() + ' tokens...');
        		return Gpc_token.transferFrom(presale_purchaser, precirculation_allowed_addr, transfer_amount_2, 
        			{from: transfer_operator, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_second_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_allowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_allowed_addr_balance_after_second_transfer = balance;
        		console.log('precirculation allowed address balance: ' + precirculation_allowed_addr_balance_after_second_transfer.toString());
        	    assert.equal(allowance_amount.minus(allowance_remaining).equals(transfer_amount_2), true, 'should decrease by transfer amount!');
        	    assert.equal(presale_purchaser_after_first_transfer.minus(presale_purchaser_after_second_transfer).equals(transfer_amount_2), true,'should decrease by transfer amount!');
        		assert.equal(precirculation_allowed_addr_balance_after_second_transfer.minus(precirculation_allowed_addr_balance_after_first_transfer).equals(transfer_amount_2), true, 'should increase by transfer amount!');
        	})
        	.then(function() {
        		console.log('');
        		return Gpc_token_sale.allowPrecirculation(transfer_operator, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_second_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_second_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_disallowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_disallowed_addr_init_balance = balance;
        		console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_init_balance.toString());
        		console.log('>>> using transferFrom() to transfer ' + transfer_amount_3.toString() + ' tokens...');
        		return Gpc_token.transferFrom(presale_purchaser, precirculation_disallowed_addr, transfer_amount_3, 
        			{from: transfer_operator, gas: 4700000});
        	})
        	.then(function() {
        		console.log('>>> transfer succeeded since unlockTime is already passed, expected');
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_third_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
        		return Gpc_token.balanceOf(precirculation_disallowed_addr);
        	})
        	.then(function(balance) {
        		precirculation_disallowed_addr_balance_after_third_transfer = balance;
        		console.log('precirculation disallowed address balance: ' + precirculation_disallowed_addr_balance_after_third_transfer.toString());
        	    assert.equal(allowance_amount.minus(allowance_remaining).equals(transfer_amount_2.plus(transfer_amount_3)), true, 'should decrease by the total transfer amount!');
        	    assert.equal(presale_purchaser_after_second_transfer.minus(presale_purchaser_after_third_transfer).equals(transfer_amount_3), true, 'should decrease by transfer amount!');
        		assert.equal(precirculation_disallowed_addr_balance_after_third_transfer.minus(precirculation_disallowed_addr_init_balance).equals(transfer_amount_3), true, 'should decrease by transfer amount!');
        	})
        	.then(function() {
        		console.log('');
        		return Gpc_token_sale.allowPrecirculation(transfer_operator, {from: admin_addr, gas: 4700000});
        	})
        	.then(function() {
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_third_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_third_transfer.toString());
        		return Gpc_token.balanceOf(attacker);
        	})
        	.then(function(balance) {
        		attacker_init_balance = balance;
        		console.log('attacker address balance: ' + attacker_init_balance.toString());
        		console.log('>>> the attacker attempt to use transferFrom() to transfer ' + attacker_transfer_amount.toString() + ' tokens...');
        		return Gpc_token.transferFrom(presale_purchaser, attacker, attacker_transfer_amount, 
        			{from: attacker, gas: 4700000});
        	})
        	.catch(function() {
        		console.log('>>> transferFrom() did not succeed since the attacker is not approved to tranfer the tokens, expected');
        	})
        	.then(function() {
        		return Gpc_token.allowance(presale_purchaser, transfer_operator);
        	})
        	.then(function(allowance) {
        		allowance_remaining = allowance;
        		console.log('remaining allowance: ' + allowance_remaining.toString());
        		return Gpc_token.balanceOf(presale_purchaser);
        	})
        	.then(function(balance) {
        		presale_purchaser_after_fourth_transfer = balance;
        		console.log('presale purchase balance: ' + presale_purchaser_after_fourth_transfer.toString());
        		return Gpc_token.balanceOf(attacker);
        	})
        	.then(function(balance) {
        		attacker_balance_after_fourth_transfer = balance;
        		console.log('attacker balance: ' + attacker_balance_after_fourth_transfer.toString());
        	    assert.equal(allowance_amount.minus(allowance_remaining).equals(transfer_amount_2.plus(transfer_amount_3)), true, 'should decrease by the total transfer amount!');
        	    assert.equal(presale_purchaser_after_fourth_transfer.equals(presale_purchaser_after_third_transfer), true, 'should not change!');
        		assert.equal(attacker_balance_after_fourth_transfer.equals(attacker_init_balance), true, 'should not change!');
        	})
    });

});



