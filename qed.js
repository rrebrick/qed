let fighterMap = new Map();
fighterMap.set("1,0", "1");
fighterMap.set("1,1", "2");
fighterMap.set("1,2", "3");
fighterMap.set("2,0", "4");
fighterMap.set("2,1", "5");
fighterMap.set("2,2", "6");

function fetchApi() {
    var apikey = document.getElementById("apikey").value;
    var request = new XMLHttpRequest();
    request.open('GET', 'https://queslar.com/api/player/full/' + apikey);
    request.onload = function () {
        var data = JSON.parse(this.response);
        window.data = data;
        console.log("data", data);
        for (var i = 1; i < 7; i++) {
            document.getElementById("fighterHealth" + i).value = 0;
            document.getElementById("fighterDefense" + i).value = 0;
            document.getElementById("fighterDamage" + i).value = 0;
            document.getElementById("fighterCrit" + i).value = 0;
            document.getElementById("fighterHit" + i).value = 0;
            document.getElementById("fighterDodge" + i).value = 0;
        }
        fighterMap.forEach(function (value, key) {
            var fighterId = "fighterClass" + value;
            document.getElementById(fighterId).value = "none";

        });
        data.fighters.forEach((fighter) => {
            console.log("fighter", fighter);
            var fighterN = fighterMap.get(fighter.column_placement.toString() + "," + fighter.row_placement.toString());
            var fighterId = "fighterClass" + fighterN;
            document.getElementById("fighterHealth" + fighterN).value = fighter.health;
            document.getElementById("fighterDefense" + fighterN).value = fighter.defense;
            document.getElementById("fighterDamage" + fighterN).value = fighter.damage;
            document.getElementById("fighterCrit" + fighterN).value = fighter.crit_damage;
            document.getElementById("fighterHit" + fighterN).value = fighter.hit;
            document.getElementById("fighterDodge" + fighterN).value = fighter.dodge;
            document.getElementById(fighterId).value = fighter.class;
        });
        updateGold();
    }
    request.send();
}

function dungeon(level) {
    let monster = [];
    while (monster.length < 6 && monster.length * 50 <= level) {
        let monsterLevel = level - 25 * monster.length;
        monster[monster.length] = {
            monster: true,
            health: 0,
            healthMax: Math.floor(100 + 400 * monsterLevel),
            defense: Math.floor(20 + 10 * monsterLevel),
            damage: Math.floor(60 + 40 * monsterLevel),
            critMultiplier: 1 + 0.0025 * monsterLevel,
            hit: Math.floor(50 + 30 * monsterLevel),
            dodge: Math.floor(50 + 30 * monsterLevel),
        };
    }
    return monster;
}

function readInput() {
    let classes = {};
    let fighter = [];
    let classBonus = 1;
    for (let index = 1; index <= 6; ++index) {
        let newClass = document.getElementById("fighterClass" + index).value;
        if (newClass != "none") {
            if (!classes[newClass]) {
                classBonus += 0.25;
                classes[newClass] = true;
            }
        }
    }
    for (let index = 1; index <= 6; ++index) {
        if (document.getElementById("fighterClass" + index).value != "none") {
            fighter[fighter.length] = {
                className: document.getElementById("fighterClass" + index).value,
                health: 0,
                healthMax: Math.floor((500 + 100 * parseInt(document.getElementById("fighterHealth" + index).value)) * classBonus),
                defense: Math.floor((25 + 10 * parseInt(document.getElementById("fighterDefense" + index).value)) * classBonus),
                damage: Math.floor((100 + 25 * parseInt(document.getElementById("fighterDamage" + index).value)) * classBonus),
                critMultiplier: 1 + 0.0025 * parseInt(document.getElementById("fighterCrit" + index).value) * classBonus,
                hit: Math.floor((50 + 50 * parseInt(document.getElementById("fighterHit" + index).value)) * classBonus) * (document.getElementById("fighterClass" + index).value == "cavalry" ? 2 : 1),
                dodge: Math.floor((50 + 50 * parseInt(document.getElementById("fighterDodge" + index).value)) * classBonus),
            };
        }
    }
    return fighter;
}

function simulationCrunch(monster, fighter, maxCounter) {
    let attacker;
    let critChance = 0.1;
    let damage;
    let defender;
    let defenderIndex;
    let dummyHealTarget = {
        health: 1,
        healthMax: 1,
    };
    let index;
    let over = false;
    let lowestPercentHealth;
    let queue = [];
    let result = {
        battles: maxCounter,
        loss150: 0,
        lossAverageRound: 0,
        wins: 0,
        winAverageRound: 0,
    };
    let round;
    for (index in fighter) {
        queue[queue.length] = fighter[index];
    }
    for (index in monster) {
        queue[queue.length] = monster[index];
    }
    for (index = 0; index < queue.length - 1; ++index) {
        defender = queue[index];
        defenderIndex = index;
        for (attacker = index + 1; attacker < queue.length; ++attacker) {
            if (queue[attacker].hit > defender.hit) {
                defender = queue[attacker];
                defenderIndex = attacker;
            }
        }
        attacker = queue[index];
        queue[index] = defender;
        queue[defenderIndex] = attacker;
    }
    for (let counter = maxCounter; counter > 0; --counter) {
        for (index in fighter) {
            fighter.tanky = 0;
        }
        for (index in monster) {
            monster[index].stunned = 0;
        }
        for (index in queue) {
            queue[index].health = queue[index].healthMax;
        }
        over = false;
        for (round = 1; !over && round < 150; ++round) {
            for (index in fighter) {
                if (fighter[index].health <= 0 && fighter[index].className == "priest" && Math.random() < 0.1) {
                    fighter[index].health = fighter[index].healthMax;
                } else if (fighter[index].tanky > 0) {
                    --fighter[index].tanky;
                }
            }
            for (index in queue) {
                attacker = queue[index];
                if (attacker.health > 0) {
                    if (attacker.monster) {
                        if (attacker.stunned) {
                            --attacker.stunned;
                        } else {
                            defender = fighter[0];
                            defenderIndex = 0;
                            while (defender.health <= 0) {
                                ++defenderIndex;
                                defender = fighter[defenderIndex];
                            }
                            if ((defender.className != "knight" || Math.random() >= 0.4)
                                && Math.random() < attacker.hit / (attacker.hit + defender.dodge)) {
                                if (defender.className == "tank" && Math.random() < 0.15) {
                                    defender.tanky = 3;
                                }
                                damage = attacker.damage;
                                if (Math.random() < critChance) {
                                    damage *= attacker.critMultiplier;
                                }
                                defender.health -= Math.max(0, Math.round((Math.round(damage) - defender.defense) * (defender.tanky > 0 ? 0.5 : 1)));
                                if (defender.health <= 0 && defenderIndex == fighter.length - 1) {
                                    result.lossAverageRound += round;
                                    over = true;
                                    break;
                                }
                            }
                        }
                    } else if (attacker.className != "knight") {
                        if (attacker.className == "healer") {
                            damage = Math.floor(attacker.damage * 0.75);
                            if (Math.random() < critChance) {
                                damage *= attacker.critMultiplier;
                            }
                            defender = dummyHealTarget;
                            lowestPercentHealth = 1;
                            for (defenderIndex = 0; defenderIndex < fighter.length; ++defenderIndex) {
                                if (fighter[defenderIndex].health > 0 && fighter[defenderIndex].health / fighter[defenderIndex].healthMax < lowestPercentHealth) {
                                    defender = fighter[defenderIndex];
                                    lowestPercentHealth = defender.health / defender.healthMax;
                                }
                            }
                            defender.health += Math.floor(damage);
                            if (defender.health > defender.healthMax) {
                                defender.health = defender.healthMax;
                            }
                        } else {
                            if (attacker.className == "assassin" && monster.length > 3) {
                                defender = monster[3];
                                defenderIndex = 3;
                                while (defender.health <= 0) {
                                    ++defenderIndex;
                                    if (defenderIndex >= monster.length) {
                                        defenderIndex = 0;
                                    }
                                    defender = monster[defenderIndex];
                                }
                            } else {
                                defender = monster[0];
                                defenderIndex = 0;
                                while (defender.health <= 0) {
                                    ++defenderIndex;
                                    defender = monster[defenderIndex];
                                }
                            }
                            if (Math.random() < attacker.hit / (attacker.hit + defender.dodge)) {
                                damage = attacker.damage;
                                if (Math.random() < critChance) {
                                    damage *= attacker.critMultiplier;
                                }
                                if (attacker.className == "hunter") {
                                    damage *= 0.6;
                                } else if (attacker.className == "mage") {
                                    damage *= 0.4;
                                }
                                defender.health -= Math.max(0, Math.round(damage) - defender.defense);
                                if (defender.health <= 0) {
                                    over = true;
                                    for (defenderIndex = 0; over && defenderIndex < monster.length; ++defenderIndex) {
                                        if (monster[defenderIndex].health > 0) {
                                            over = false;
                                        }
                                    }
                                    if (over) {
                                        ++result.wins;
                                        result.winAverageRound += round;
                                    }
                                    break;
                                } else if (attacker.className == "warrior" && Math.random < 0.1) {
                                    defender.stunned = 2;
                                }
                            }
                            if (attacker.className == "brawler" && Math.random < 0.15) {
                                if (defender.health <= 0) {
                                    ++defenderIndex;
                                    defender = monster[defenderIndex];
                                }
                                if (Math.random() < attacker.hit / (attacker.hit + defender.dodge)) {
                                    damage = attacker.damage;
                                    if (Math.random() < critChance) {
                                        damage *= attacker.critMultiplier;
                                    }
                                    defender.health -= Math.max(0, Math.round(damage) - defender.defense);
                                    if (defender.health <= 0) {
                                        over = true;
                                        for (defenderIndex = 0; over && defenderIndex < monster.length; ++defenderIndex) {
                                            if (monster[defenderIndex].health > 0) {
                                                over = false;
                                            }
                                        }
                                        if (over) {
                                            ++result.wins;
                                            result.winAverageRound += round;
                                        }
                                        break;
                                    }
                                }
                            } else if (attacker.className == "hunter" && defenderIndex + 3 < monster.length) {
                                defenderIndex += 3;
                                defender = monster[defenderIndex];
                                if (defender.health > 0 && Math.random() < attacker.hit / (attacker.hit + defender.dodge)) {
                                    damage = attacker.damage * 0.6;
                                    if (Math.random() < critChance) {
                                        damage *= attacker.critMultiplier;
                                    }
                                    defender.health -= Math.max(0, Math.round(damage) - defender.defense);
                                    if (defender.health <= 0) {
                                        over = true;
                                        for (defenderIndex = 0; over && defenderIndex < monster.length; ++defenderIndex) {
                                            if (monster[defenderIndex].health > 0) {
                                                over = false;
                                            }
                                        }
                                        if (over) {
                                            ++result.wins;
                                            result.winAverageRound += round;
                                        }
                                        break;
                                    }
                                }
                            } else if (attacker.className == "mage") {
                                if (defenderIndex % 3 < 2 && monster.length > defenderIndex + 1) {
                                    defender = monster[defenderIndex + 1];
                                    if (defender.health > 0 && Math.random() < attacker.hit / (attacker.hit + defender.dodge)) {
                                        damage = attacker.damage * 0.4;
                                        if (Math.random() < critChance) {
                                            damage *= attacker.critMultiplier;
                                        }
                                        defender.health -= Math.max(0, Math.round(damage) - defender.defense);
                                    }
                                }
                                if (defenderIndex % 3 == 0 && monster.length > defenderIndex + 2) {
                                    defender = monster[defenderIndex + 2];
                                    if (defender.health > 0 && Math.random() < attacker.hit / (attacker.hit + defender.dodge)) {
                                        damage = attacker.damage * 0.4;
                                        if (Math.random() < critChance) {
                                            damage *= attacker.critMultiplier;
                                        }
                                        defender.health -= Math.max(0, Math.round(damage) - defender.defense);
                                    }
                                }
                                over = true;
                                for (defenderIndex = 0; over && defenderIndex < monster.length; ++defenderIndex) {
                                    if (monster[defenderIndex].health > 0) {
                                        over = false;
                                    }
                                }
                                if (over) {
                                    ++result.wins;
                                    result.winAverageRound += round;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        if (!over) {
            ++result.loss150;
            result.lossAverageRound += 150;
        }
    }
    if (result.lossAverageRound > 0) {
        result.lossAverageRound /= result.battles - result.wins;
    }
    if (result.winAverageRound > 0) {
        result.winAverageRound /= result.wins;
    }
    return result;
}

function simulationLoop() {
    let chunkSize = simulation.battles - simulation.result.battles;
    if (chunkSize > simulation.step) {
        chunkSize = simulation.step;
    }
    let chunk = simulationCrunch(simulation.dungeon, simulation.fighters, chunkSize);
    simulation.result.loss150 += chunk.loss150;
    simulation.result.lossAverageRound = simulation.result.lossAverageRound * (simulation.result.battles - simulation.result.wins) + chunk.lossAverageRound * (chunk.battles - chunk.wins);
    simulation.result.winAverageRound = simulation.result.winAverageRound * simulation.result.wins + chunk.winAverageRound * chunk.wins;
    simulation.result.battles += chunk.battles;
    simulation.result.wins += chunk.wins;
    if (simulation.result.lossAverageRound > 0) {
        simulation.result.lossAverageRound /= simulation.result.battles - simulation.result.wins;
    }
    if (simulation.result.winAverageRound > 0) {
        simulation.result.winAverageRound /= simulation.result.wins;
    }
    document.getElementById("simulationResult").innerHTML =
        simulation.result.battles + "/" + simulation.battles + "<br />"
        + "Win rate: " + parseFloat(100 * simulation.result.wins / simulation.result.battles).toFixed(2) + "%<br />"
        + "Average win round: " + parseFloat(simulation.result.winAverageRound).toFixed(1) + "<br />"
        + "Average loss round: " + parseFloat(simulation.result.lossAverageRound).toFixed(1) + "<br />"
        + "Round 150 auto losses: " + simulation.result.loss150;
    if (simulation.active) {
        if (simulation.result.battles < simulation.battles) {
            setTimeout(simulationLoop);
        } else {
            simulationToggle(true);
        }
    }
}

function simulationToggle(off) {
    if (simulation.active || off) {
        simulation.active = false;
        document.getElementById("simulationButton").innerHTML = '<button type="button">Start</button>';
    } else {
        document.getElementById("simulationButton").innerHTML = '<button type="button">Stop</button>';
        simulation.active = true;
        simulation.battles = parseInt(document.getElementById("simulationBattles").value);
        simulation.dungeon = dungeon(parseInt(document.getElementById("simulationDungeon").value));
        simulation.fighters = readInput();
        simulation.result = {
            battles: 0,
            loss150: 0,
            lossAverageRound: 0,
            wins: 0,
            winAverageRound: 0,
        };
        setTimeout(simulationLoop);
    }
}

function updateGold() {
    let fightersBought = 0;
    let totalGold = 0;
    for (let index = 1, partialIds = ["Health", "Defense", "Damage", "Crit", "Hit", "Dodge"]; index <= 6; ++index) {
        let gold = 0;
        if (document.getElementById("fighterClass" + index).value != "none") {
            ++fightersBought;
            for (let partial of partialIds) {
                let level = parseInt(document.getElementById("fighter" + partial + index).value);
                gold += level * (level + 1) * 5000;
            }
        }
        document.getElementById("gold" + index).innerHTML = gold.toLocaleString();
        totalGold += gold;
    }
    document.getElementById("goldLevels").innerHTML = "Levels: " + totalGold.toLocaleString();
    let fightersGold = 0;
    for (let cost = 100000; fightersBought > 1; --fightersBought) {
        fightersGold += cost;
        cost *= 10;
    }
    document.getElementById("goldFighters").innerHTML = "Fighters: " + fightersGold.toLocaleString();
    var totalTotalGold = totalGold + fightersGold;
    document.getElementById("goldTotal").innerHTML = "Total: " + totalTotalGold.toLocaleString();
}

let simulation = {
    active: false,
    step: 100,
};
for (let index = 1, partialIds = ["Class", "Health", "Defense", "Damage", "Crit", "Hit", "Dodge"]; index <= 6; ++index) {
    for (let partial of partialIds) {
        document.getElementById("fighter" + partial + index).onchange = updateGold;
    }
}
updateGold();
document.getElementById("bugfix").innerHTML = "Latest bugfix: low damage hits no longer heal monsters";