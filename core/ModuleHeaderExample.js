var example = {
  "MODULE_HEADER":{ // module header
    moduleName: "Fun commands", // name of the module, can include spaces (will be abreviated internally)
    version: "1.2.0", // module version
    author: "Zephy", // author
    description: "random commands.", / module description
  },
  "dance": { // command "dance"
    permission: "dance", // custom permission, leave this undefined for self generated one
    helpMessage: "dance :D", // message which will be apended to the end of the automatically generated help
    category: "Entertainment", // category of the current commad
    handler: doDance, // var x = function(e,args);
    params: [{ // ze params
        id: "user",
        type: "mention",
        required: false
    },
    {
        id: "slapobject",
        type: "string",
        required: false
    }],
    child: [{
            name: "view",
            handler: groupView,
            helpMessage: "List group members and permissions",
            params: [{
                id: "group",
                type: "string",
                required: true
            }, {
                id: "where",
                type: "choice",
                options: {
                    list: ["here"]
                },
                required: false
            }]
        }]
  }
}
