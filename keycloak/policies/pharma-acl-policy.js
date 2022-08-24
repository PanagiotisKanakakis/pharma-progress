var context = $evaluation.getContext();
var shouldDeny = false;

// find whether user has any access at all
var identity = context.getIdentity();
var identityAttributes = identity.getAttributes();
if (identityAttributes.exists("PHARMAacl")) { 
    var PHARMAAcl = JSON.parse(identityAttributes.getValue("PHARMAacl").asString(0));
    //print("PHARMAacl = " + JSON.stringify(PHARMAAcl));    

    // check that user has access to this particular resource
    var permission = $evaluation.getPermission();
    var resourceName = permission.getResource().getName();
    if (resourceName in PHARMAAcl) { 
        // check that user has at least one of the requested scopes (OR)
        var userScopes = PHARMAAcl[resourceName].split(',');
        //print('User scopes = ' + userScopes);
        
        var hasAnyScope = false;
        var scopes = permission.getScopes().toArray();
        for (i = 0; i < scopes.length; i++) {
            var scopeName = scopes[i].getName();
            //print("Checking for scope = " + scopeName);
            if (userScopes.indexOf(scopeName) >= 0) { 
                //print("Scope " + scopeName + " found! Accepting..");
                hasAnyScope = true;
                break;
            }
        }
        
        if (hasAnyScope) { 
            $evaluation.grant();
        } else {
            $evaluation.deny();
        }
    } else { 
        //print("Resource not found in attributes, denying");
        $evaluation.deny();        
    }
    
} else { 
    $evaluation.deny();        
}

