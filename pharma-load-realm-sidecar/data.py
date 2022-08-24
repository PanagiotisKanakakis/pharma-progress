"""
Basic data for loading during development.
"""

ADMIN_REALM_ROLE = "admin"
KEPUSER_REALM_ROLE = "kepuser"
CAMUNDA_ADMIN_GROUP = "camunda-admin"

REALM_ROLES = [
    {"name": ADMIN_REALM_ROLE},
    {"name": KEPUSER_REALM_ROLE},
    {"name": "kepmanager"},
    {"name": "kepadmin"},
]

KEP_GROUP = "kep"
USERS_GROUP = "users"

SYSTEM_GROUPS = [
    {"name": KEP_GROUP, "path": "/{}".format(KEP_GROUP)},
    {"name": USERS_GROUP, "path": "/{}".format(USERS_GROUP)},
]

SYSTEM_USERS = [
    {
        "username": "admin",
        "afm": "111111111",
        "realm_roles": [KEPUSER_REALM_ROLE, "kepmanager", "kepadmin", ADMIN_REALM_ROLE],
        "groups": [CAMUNDA_ADMIN_GROUP, "kep", "users"],
    },
    {
        "username": "kepadmin",
        "afm": "111111112",
        "realm_roles": [KEPUSER_REALM_ROLE, "kepmanager", "kepadmin"],
        "groups": [CAMUNDA_ADMIN_GROUP, "kep", "users"],
    },
    {
        "username": "kepmanager",
        "afm": "111111113",
        "realm_roles": [KEPUSER_REALM_ROLE, "kepmanager"],
        "groups": [CAMUNDA_ADMIN_GROUP, "kep", "users"],
    },
]

SCOPES = [
    {"name": "head"},
    {"name": "clerk"},
]
