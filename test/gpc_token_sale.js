var GpcToken = artifacts.require('GpcToken');
var GpcTokenSale = artifacts.require('GpcTokenSale');
contract('GpcTokenSale', function(accounts) {
    var GpcToken;
    var GpcTokenSale;
    var wallet;

    var precirculationAccount;
    console.log("Imported node Accounts: \n", accounts);

    it ("GpcTokenSale: deploy", function() {
        console.log('----------------');
        return GpcToken.deployed()
            .then(function(tt) {
                GpcToken = tt;
                console.log('GpcToken Address: ' + GpcToken.address);
                return GpcTokenSale.deployed();
                //return GpcToken.getController();
            })
            .then(function(tts) {
                GpcTokenSale = tts;
                console.log('GpcTokenSale Address: ' + GpcTokenSale.address);
                return GpcTokenSale.token.call();
            })
            .then(function(token_reference_in_token_sale) {
                console.log('GpcTokenSale.token is ' + token_reference_in_token_sale);
                assert.equal(GpcToken.address, token_reference_in_token_sale, 'GpcTokenSale\'s token is not GpcToken');
                return GpcToken.controller.call();
            })
            .then(function(tt_controller) {
                console.log('GpcToken.controller is: ' + tt_controller);
                assert.equal(GpcTokenSale.address, tt_controller, 'GpcToken\'s controller is not GpcTokenSale');
            });
    });

    it ("GpcTokenSale: activate sale", function() {
        console.log('----------------');
        console.log('Activating sale..');
        return GpcTokenSale.activated.call()
            .then(function(res) {
                console.log('Sale activation status: ' + res.toString());
                assert.equal(res, false, 'sale activation to be false at the beginning');
            })
            .then(function() {
                console.log('Calling activate sale..');
                return GpcTokenSale.activateSale({from: accounts[1], gas: 4700000}); 
            })
            .then(function() {
                return GpcTokenSale.activated.call();
            })
            .then(function(res) {
                console.log('Sale activation status: ' + res.toString());
                assert.equal(res, true, 'sale should have been activated');
            })
            .then(function() {
                console.log('Calling deactivate sale..');
                return GpcTokenSale.deactivateSale({from: accounts[1], gas: 4700000}); 
            })
            .then(function() {
                return GpcTokenSale.activated.call();
            })
            .then(function(res) {
                console.log('Sale activation status: ' + res.toString());
                assert.equal(res, false, 'sale should have been deactivated');
            });
    });
    
    it("GpcTokenSale: modify precirculation", function() {
        console.log('----------------');
        precirculationAccount = accounts[9];
        console.log('Add address ' + precirculationAccount + ' to precirculation:');
        return GpcTokenSale.allowPrecirculation(precirculationAccount, {from: accounts[1], gas: 4700000})
            .then(function() {
                console.log('Check if address is added into precirculation..');
                return GpcTokenSale.isPrecirculationAllowed(precirculationAccount, {from: accounts[1], gas: 4700000});
            })
            .then(function(rest) {
                console.log('Result from isPrecirculationAllowed(): ' + rest.valueOf());
                assert.equal(rest.valueOf(), true, "isPrecirculationAllowed should return True");
            })
            .then(function() {
                console.log('Remove  ' + precirculationAccount + ' from precirculation:');
                return GpcTokenSale.disallowPrecirculation(precirculationAccount, {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                console.log('Check if address is removed from precirculation..');
                return GpcTokenSale.isPrecirculationAllowed(precirculationAccount, {from: accounts[1], gas: 4700000});
            })
            .then(function(rest) {
                console.log('Result from isPrecirculationAllowed(): ' + rest.valueOf());
                assert.equal(rest.valueOf(), false, 'isPrecirculationAllowed should return False');
            });
    });

    it ("GpcTokenSale: allocate presale tokens", function() {
        console.log('----------------');
        presale_receiver = accounts[6];
        presale_amount = new web3.BigNumber(543210);
        Gpc_reserve_amount = presale_amount.times(60).div(40);
        return GpcTokenSale.getGpcLabsReserve()
            .then(function(res) {
                Gpc_reserve_address = res;
                console.log('Gpc reserve address : ' + Gpc_reserve_address);
                return GpcToken.balanceOf(Gpc_reserve_address);
            })
            .then(function(balance) {
                Gpc_reserve_previous_balance = balance;
                console.log('Gpc reserve previous balance : ' + Gpc_reserve_previous_balance.toString(10));
                console.log('Presale receiver address : ' + presale_receiver);
                return GpcToken.balanceOf(presale_receiver);
            })
            .then(function(balance) {
                presale_receiver_previous_balance = balance;
                console.log('Presale receiver previous balance : ' + presale_receiver_previous_balance.toString(10));
                return GpcTokenSale.allocatePresaleTokens(presale_receiver, presale_amount, {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return GpcToken.balanceOf(Gpc_reserve_address);
            })
            .then(function(balance) {
                Gpc_reserve_current_balance = balance;
                console.log('Gpc reserve current balance : ' + Gpc_reserve_current_balance.toString(10));
                return GpcToken.balanceOf(presale_receiver);
            })
            .then(function(balance) {
                presale_receiver_current_balance = balance;
                console.log('Presale receiver current balance : ' + presale_receiver_current_balance);
                assert.equal(Gpc_reserve_current_balance.minus(Gpc_reserve_previous_balance).equals(Gpc_reserve_amount), true, 'Gpc reserver balance should increase by the expected amount');
                assert.equal(presale_receiver_current_balance.minus(presale_receiver_previous_balance).equals(presale_amount), true, 'presale receiver balance should increase by pre-sale amount');
            });
    });

    it ("GpcTokenSale: change hard caps", function() {
        console.log('----------------');
        return GpcTokenSale.tokenSaleHardCap.call()
            .then(function(token_sale_hard_cap) {
                console.log('Current token sale hard cap: ' + token_sale_hard_cap.toString());
                new_token_sale_hard_cap = 31 * Math.pow(10, 6) * Math.pow(10, 18);
                return GpcTokenSale.changeTokenSaleHardCap(new_token_sale_hard_cap, {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.tokenSaleHardCap.call();
            })
            .then(function(token_sale_hard_cap) {
                console.log('Updated token sale hard cap: ' + token_sale_hard_cap.toString());
                assert.equal(token_sale_hard_cap, new_token_sale_hard_cap, 'token sale hard cap should have changed!');
            })
            .then(function() {
                return GpcTokenSale.fundCollectedHardCap.call();
            })
            .then(function(fund_collected_hard_cap) {
                console.log('Current fund collected hard cap: ' + fund_collected_hard_cap.toString());
                new_fund_collected_hard_cap = 26000 * Math.pow(10, 18);
                return GpcTokenSale.changeFundCollectedHardCap(new_fund_collected_hard_cap, {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.fundCollectedHardCap.call();
            })
            .then(function(fund_collected_hard_cap) {
                console.log('Updated fund collected hard cap: ' + fund_collected_hard_cap.toString());
                assert.equal(fund_collected_hard_cap, new_fund_collected_hard_cap, 'fund collected hard cap should have changed!')
            });
    })

    it ("GpcTokenSale: modify whitelist controller", function() {
        console.log('----------------');
        return GpcTokenSale.getWhitelistController()
            .then(function(res) {
                old_whitelist_controller = res;
                console.log('Old whitelist controller: ' + old_whitelist_controller);
            })
            .then(function() {
                console.log('Changing whitelist controller to : ' + accounts[8]);
                return GpcTokenSale.changeWhitelistController(accounts[8], {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.getWhitelistController({from: accounts[1], gas: 4700000});
            })
            .then(function(res) {
                new_whitelist_controller = res;
                console.log('New whitelist controller: ' + new_whitelist_controller);
                assert.equal(new_whitelist_controller == old_whitelist_controller, false, 'new whitelist controller should be different from old whitelist controller');
                assert.equal(new_whitelist_controller == accounts[8], true, 'new whitelist controller should be updated');
            });
    });

    it ("GpcTokenSale: modify exchangeRateController controller", function() {
        console.log('----------------');
        return GpcTokenSale.getExchangeRateController()
            .then(function(res) {
                old_exchange_rate_controller = res;
                console.log('Old exchange rate controller: ' + old_exchange_rate_controller);
            })
            .then(function() {
                console.log('Changing exchange rate controller to : ' + accounts[7]);
                return GpcTokenSale.changeExchangeRateController(accounts[7], {from: accounts[1], gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.getExchangeRateController();
            })
            .then(function(res) {
                new_exchange_rate_controller = res;
                console.log('New exchange rate controller: ' + new_exchange_rate_controller);
                assert.equal(new_exchange_rate_controller == old_exchange_rate_controller, false, 'new exchange rate controller should be different from old exchange rate controller');
                assert.equal(new_exchange_rate_controller == accounts[7], true, 'new exchange rate controller should be updated');
            });
    });

    it ("GpcTokenSale: use whitelist controller", function() {
        console.log('----------------');
        return GpcTokenSale.getWhitelistController()
            .then(function(res) {
                whitelist_controller = res;
                console.log('Current whitelist controller: ' + whitelist_controller);
                console.log('Adding these accounts to whitelist: ' + accounts[6] + ' ' + accounts[7]);
                return GpcTokenSale.addAccountsToWhitelist([accounts[6], accounts[7]], {from: whitelist_controller, gas:4700000});
            })
            .then(function() {
                return GpcTokenSale.isWhitelisted(accounts[6]);
            })
            .then(function(res) {
                console.log('is ' + accounts[6] + ' whitelisted? ' + res);
                assert.equal(res, true, 'Account should have been whitelisted');
                return GpcTokenSale.isWhitelisted(accounts[7]);
            })
            .then(function(res) {
                console.log('is ' + accounts[7] + ' whitelisted?' + res);
                assert.equal(res, true, 'Account should have been whitelisted');
                console.log('Removing account from whitelist:' + accounts[6] + ' ' + accounts[7]);
                return GpcTokenSale.deleteAccountsFromWhitelist([accounts[6], accounts[7]], {from: whitelist_controller, gas:4700000});
            })
           .then(function() {
                return GpcTokenSale.isWhitelisted(accounts[6]);
            })
            .then(function(res) {
                console.log('is ' + accounts[6] + ' whitelisted? ' + res);
                assert.equal(res, false, 'Account should have been dewhitelisted');
                return GpcTokenSale.isWhitelisted(accounts[7]);
            })
            .then(function(res) {
                console.log('is ' + accounts[7] + ' whitelisted? ' + res);
                assert.equal(res, false, 'Account should have been dewhitelisted');
                return GpcTokenSale.isWhitelisted(accounts[7]);
            })
            ;
    });

    it ("GpcTokenSale: use exchange rate controller", function() {
        console.log('----------------');
        return GpcTokenSale.exchangeRate.call()
            .then(function(res) {
                console.log('Exisitng exchange rate: ' + res);
                return GpcTokenSale.getExchangeRateController();
            })
            .then(function(res) {
                exchange_rate_controller = res;
                console.log('Existing exchange rate controller: ' + res);
                new_exchange_rate = 12345;
                console.log('Changing exchange rate to ' + new_exchange_rate.toString());
                return GpcTokenSale.setExchangeRate(new_exchange_rate, {from: exchange_rate_controller, gas:4700000});
            })
            .then(function() {
                return GpcTokenSale.exchangeRate.call();
            })
            .then(function(res) {
                console.log('New exchange rate: ' + res);
                assert.equal(res, new_exchange_rate, 'Excahnge rate should have been changed');
            })
            ;
    });

    it ("GpcTokenSale: activate sell, emergency stop, restart sale", function() {
        console.log('----------------');
        return GpcTokenSale.getAdmin()
            .then(function(res) {
                admin = res;
                console.log('Current admin: ' + admin);
                return GpcTokenSale.activated.call();
            })
            .then(function(res) {
                console.log('Sale activation status: ' + res);
                assert.equal(res, false, 'Sale should be deactivated at first');
                return GpcTokenSale.saleStopped.call();
            })
            .then(function(res) {
                console.log('Sale stop status: ' + res);
                assert.equal(res, false, 'Sale stop should be false at first');
                console.log('Activating sale..');
                return GpcTokenSale.activateSale({from: admin, gas: 4700000});
            })
            .then(function(res) {
                return GpcTokenSale.activated.call();
            })
            .then(function(res) {
                console.log('Sale activation status: ' + res);
                assert.equal(res, true, 'Sale should be activated after calling activate sale');
                console.log('Calling emergency stop..')
                return GpcTokenSale.emergencyStopSale({from: admin, gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.saleStopped.call();
            })
            .then(function(res) {
                console.log('Sale stop status: ' + res);
                assert.equal(res, true, 'Sale stop should be true after calling emergency stop');
                console.log('Calling restart sale..')
                return GpcTokenSale.restartSale({from: admin, gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.saleStopped.call();
            })
            .then(function(res) {
                console.log('Sale stop status: ' + res);
                assert.equal(res, false, 'Sale stop should be false after restarting sale');
            })
            ;
    });

    it ("GpcTokenSale: transfer fund deposit address", function() {
        console.log('----------------');
        return GpcTokenSale.getAdmin()
            .then(function(res) {
                existing_admin = res;
                console.log('Existing admin: ' + existing_admin);
                return GpcTokenSale.getFundDeposit({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                existing_fund_deposit = res;
                console.log('Existing fund deposit: ' + existing_fund_deposit);
                new_fund_deposit_candidate = accounts[0];
                return GpcTokenSale.changeFundDeposit(new_fund_deposit_candidate, {from: existing_admin, gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.getFundDeposit({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                new_fund_deposit = res;
                console.log('New fund deposit: ' + new_fund_deposit);
                assert.equal(new_fund_deposit, new_fund_deposit_candidate, 'Fund deposit should have been changed');
            })
            ;
    });

    it ("GpcTokenSale: transfer GpcLab reserve address", function() {
        console.log('----------------');
        return GpcTokenSale.getAdmin()
            .then(function(res) {
                existing_admin = res;
                console.log('Existing admin: ' + existing_admin);
                return GpcTokenSale.getGpcLabsReserve({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                existing_Gpclab_reserve = res;
                console.log('Existing GpcLab reserver address: ' + existing_Gpclab_reserve);
                new_Gpclab_reserve_candidate = accounts[0];
                return GpcTokenSale.changeGpcLabsReserve(new_Gpclab_reserve_candidate, {from: existing_admin, gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.getGpcLabsReserve({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                new_Gpclab_reserve = res;
                console.log('New GpcLab reserve address: ' + new_Gpclab_reserve);
                assert.equal(new_Gpclab_reserve, new_Gpclab_reserve_candidate, 'GpcLab reserve should have been changed');
            })
            ;
    });

    it ("GpcTokenSale: transfer root", function() {
        console.log('----------------');
        return GpcTokenSale.getAdmin()
            .then(function(res) {
                existing_admin = res;
                console.log('Existing admin: ' + existing_admin);
                return GpcTokenSale.getRoot({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                existing_root = res;
                console.log('Existing root: ' + existing_root);
                new_root_candidate = accounts[6];
                return GpcTokenSale.changeRoot(new_root_candidate, {from: existing_root, gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.getRoot({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                new_root = res;
                console.log('New root: ' + new_root);
                assert.equal(new_root, new_root_candidate, 'Root should have changed');
            })
            ;
    });

    it ("GpcTokenSale: transfer admin with new root", function() {
        console.log('----------------');
        return GpcTokenSale.getAdmin()
            .then(function(res) {
                existing_admin = res;
                console.log('Existing admin: ' + existing_admin);
                return GpcTokenSale.getRoot({from: existing_admin, gas: 4700000});
            })
            .then(function(res) {
                existing_root = res;
                console.log('Existing root: ' + existing_root);
                new_admin_candidate = accounts[9];
                return GpcTokenSale.changeAdmin(new_admin_candidate, {from: existing_root, gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.getAdmin({from: new_admin_candidate, gas: 4700000});
            })
            .then(function(res) {
                new_admin = res;
                console.log('New admin: ' + new_admin);
                assert.equal(new_admin, new_admin_candidate, 'Admin should have been changed');
            })
            ;
    });

    it ("GpcTokenSale: test new admin", function() {
        console.log('----------------');
        console.log('Use new admin to change fund deposit..');
        new_admin = accounts[9];
        return GpcTokenSale.changeFundDeposit(accounts[4], {from: new_admin, gas: 4700000})
            .then(function() {
                return GpcTokenSale.getFundDeposit({from: new_admin, gas: 4700000});
            })
            .then(function(res) {
                new_fund_deposit = res;
                console.log('New fund deposit: ' + new_fund_deposit);
                assert.equal(new_fund_deposit, accounts[4], 'Fund deposit should have been changed');

                console.log('Use new admin to change whitelistController..');
                return GpcTokenSale.changeWhitelistController(accounts[2], {from: new_admin, gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.getWhitelistController({from: new_admin, gas: 4700000});
            })
            .then(function(res) {
                new_whitelist_controller = res;
                console.log('New whitelist controller: ' + new_whitelist_controller);
                assert.equal(new_whitelist_controller == accounts[2], true, 'new whitelist controller should be updated');

                console.log('Use new admin to change exchangeRateController..');
                return GpcTokenSale.changeExchangeRateController(accounts[2], {from: new_admin, gas: 4700000});
            })
            .then(function() {
                return GpcTokenSale.getExchangeRateController({from: new_admin, gas: 4700000});
            })
            .then(function(res) {
                new_exchange_rate_controller = res;
                console.log('New exchange rate controller: ' + new_exchange_rate_controller);
                assert.equal(new_exchange_rate_controller == accounts[2], true, 'new exchange rate controller should be updated');
            })
            ;
    });

    it ("GpcTokenSale: test new whitelist controller", function() {
        console.log('----------------');
        console.log('Use new whitelistController to whitelist');
        console.log('Adding these accounts to whitelist: ' + accounts[8] + ' ' + accounts[9]);
        new_whitelist_controller = accounts[2];
        return GpcTokenSale.addAccountsToWhitelist([accounts[8], accounts[9]], {from: accounts[2], gas:4700000})
            .then(function() {
                return GpcTokenSale.isWhitelisted(accounts[8]);
            })
            .then(function(res) {
                console.log('is ' + accounts[8] + ' whitelisted? ' + res);
                assert.equal(res, true, 'Account should have been whitelisted');
                return GpcTokenSale.isWhitelisted(accounts[9]);
            })
            .then(function(res) {
                console.log('is ' + accounts[9] + ' whitelisted? ' + res);
                assert.equal(res, true, 'Account should have been whitelisted');
            })
            ;
    });

    it ("GpcTokenSale: test exchange rate with new controller", function() {
        console.log('----------------');
        console.log('Use new exchange rate to set exchange rate');
        return GpcTokenSale.exchangeRate.call()
            .then(function(res) {
                console.log('Exisitng exchange rate: ' + res);
                new_exchange_rate_controller = accounts[2];
                new_exchange_rate = 54321;
                console.log('Changing exchange rate to ' + new_exchange_rate.toString());
                return GpcTokenSale.setExchangeRate(new_exchange_rate, {from: new_exchange_rate_controller, gas:4700000});
            })
            .then(function() {
                return GpcTokenSale.exchangeRate.call();
            })
            .then(function(res) {
                console.log('New exchange rate: ' + res);
                assert.equal(res, new_exchange_rate, 'Excahnge rate should have been changed');
            })
            ;
    });


});

