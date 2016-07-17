function DatabaseManager() {

}

/*
 * getStorage("tableName") - return a databaseConnector instance with the structure already set, return null if that database doesnt exists
 * createStorage("tableName", databaseStructure) - return the databaseConnecter on success, otherwise return an error
 * getStructure("tableName") - return the structure of the database, null if invalid database
 * _clearCache
 * _listTable
 * _listTableEntries
 * callback on initial load.
 * commands set their database in the setup part.
 * create a config with important table structure and initialize before commands ???

*/
