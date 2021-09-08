const Discord = require("discord.js");
const config = require("./config.json");
const utils = require("./utils.js");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
var mysql = require('mysql');


dbOptions = {};

if (process.env.CLEARDB_DATABASE_URL != undefined) {
    dbOptions = {
        host: process.env.CLEARDB_DATABASE_URL.split(/\/|@/g)[3],
        user: process.env.CLEARDB_DATABASE_URL.split(/\/|@/g)[2].split(":")[0],
        password: process.env.CLEARDB_DATABASE_URL.split(/\/|@/g)[2].split(":")[1],
        database: process.env.CLEARDB_DATABASE_URL.split(/\/|@/g)[4].split("?")[0],
        flags: "-FOUND_ROWS"
    };
} else {
    dbOptions = {
        host: config.dbUrl,
        user: config.dbUser,
        password: config.dbPass,
        database: config.dbName,
        flags: "-FOUND_ROWS"
    };
}

var connection = mysql.createPool(dbOptions);

const TOKEN = config.token;
const goodBoyCoin = "<:goodboycoin:625181771335729173>";

const commands = [{
        name: 'grant',
        description: 'Grants Good Boy coins',
        options: [{
                name: "username",
                description: "The username of the user you want to grant coins to",
                type: 6,
                required: true
            },
            {
                name: "amount",
                description: "The amount of coins you want to grant",
                type: 3,
                required: true
            }
        ]
    },
    {
        name: 'setcoins',
        description: "Sets someone's Good Boy coin tally",
        options: [{
                name: "username",
                description: "The username of the user you want to set the tally of",
                type: 6,
                required: true
            },
            {
                name: "amount",
                description: "The amount of coins you want to set",
                type: 3,
                required: true
            }
        ]
    }, {
        name: 'tally',
        description: 'Grants Good Boy coins',
        options: [{
            name: "username",
            description: "The username of the user you want to get the tally from",
            type: 6
        }]
    }
];

const rest = new REST({ version: '9' }).setToken(TOKEN);

(async() => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands("884981485692669993", "274342839041916928"), { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

var client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.on("ready", () => {
    console.info("Ready");
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.user.id === "195265775664103424" || interaction.user.id === "375485987893149696") {
        switch (interaction.commandName.toLowerCase()) {
            case "grant":
                utils.selectFromDB(connection, function(success, resp) {
                    if (success) {
                        utils.updateRow(connection, "users", "coins", (parseInt(interaction.options.get("amount").value) + resp[0].coins), ["userID", interaction.options.get("username").user.id], function() {
                            interaction.reply("<@" + interaction.user.id + "> has granted <@" + interaction.options.get("username").user.id + "> " + interaction.options.get("amount").value + " Good Boy coins " + goodBoyCoin);
                        });
                    } else {
                        utils.insertToDB(connection, "users", "", [interaction.options.get("username").user.id, interaction.options.get("username").user.tag, interaction.options.get("amount").value], function() {
                            interaction.reply("<@" + interaction.user.id + "> has granted <@" + interaction.options.get("username").user.id + "> " + interaction.options.get("amount").value + " Good Boy coins " + goodBoyCoin);
                        });
                    }
                }, "users", "userID", interaction.options.get("username").user.id);
                break;
            case "setcoins":
                utils.existsInTable(connection, "users", "userID", interaction.options.get("username").user.id, function(exists) {
                    if (exists) {
                        utils.updateRow(connection, "users", "coins", interaction.options.get("amount").value, ["userID", interaction.options.get("username").user.id], function() {
                            interaction.reply("<@" + interaction.user.id + "> has set <@" + interaction.options.get("username").user.id + ">'s Good Boy coin tally to " + interaction.options.get("amount").value + " " + goodBoyCoin);
                        });
                    } else {
                        utils.insertToDB(connection, "users", "", [interaction.options.get("username").user.id, interaction.options.get("username").user.tag, interaction.options.get("amount").value], function() {
                            interaction.reply("<@" + interaction.user.id + "> has set <@" + interaction.options.get("username").user.id + ">'s Good Boy coin tally to " + interaction.options.get("amount").value + " " + goodBoyCoin);
                        });
                    }
                });
                break;
            case "tally":
                var user;
                if (interaction.options.get("username") != undefined) user = interaction.options.get("username").user.id;
                else user = interaction.user.id;
                utils.selectFromDB(connection, function(success, resp) {
                    if (success) {
                        interaction.reply("<@" + user + "> has " + resp[0].coins + " Good Boy coins " + goodBoyCoin);
                    } else {
                        interaction.reply("Couldn't find user <@" + user + "> in the tally!");
                    }
                }, "users", "userID", user);
                break;
            default:
                break;
        }
    }
});

client.login(TOKEN);