module.exports = {
    selectFromDB(connection, callback, table, row, query) {
        if (row && query) query = " WHERE " + row + "='" + query + "'";
        else query = "";
        try {
            connection.query("SELECT * FROM " + table + query, function(err, resp, fields) {
                if (err || resp[0] === undefined) {
                    callback(false, "This value doesn't exist");
                    return;
                }
                callback(true, resp);
            });
        } catch (err) {
            callback(false, err);
            return;
        }
    },

    existsInTable(connection, table, row, query, callback) {
        connection.query("SELECT EXISTS(SELECT * FROM " + table + " WHERE " + row + "='" + query + "')", function(err, resp, field) {
            if (err) {
                callback(false, err);
                return;
            }
            if (resp[0][Object.keys(resp[0])[0]] == 0) callback(false);
            else callback(true);
        });
    },


    insertToDB(connection, table, row, value, callback) {
        if (row != "") {
            if (Array.isArray(row)) row = " (" + row.join(", ") + ")";
            else row = " (" + row + ")";
        }

        if (Array.isArray(value)) value = "('" + value.join("', '") + "')";
        else value = "('" + value + "')";

        connection.query("INSERT INTO " + table + row + " VALUES " + value + ";");
        callback();
    },


    updateRow(connection, table, row, value, anchor, callback) {

        connection.query("UPDATE " + table + " SET " + row + "=" + value + " WHERE " + anchor[0] + "=" + anchor[1] + ";");

        callback();
    }
};