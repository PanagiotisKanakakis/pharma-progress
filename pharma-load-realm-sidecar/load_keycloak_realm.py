#!/usr/bin/env python3

import argparse
import logging
import requests
from requests.structures import CaseInsensitiveDict
import data

logger = logging.getLogger(__name__)

ACCESS_TOKEN_LIFESPAN = 24 * 60 * 60  # seconds

REALM_ROLES = ["admin", "kepadmin", "kepmanager", "kepuser"]

class Loader:
    def __init__(
        self,
        keycloak_url,
        admin_username,
        admin_password,
        realm_name,
        backend_client_id,
    ):
        self.keycloak_url = keycloak_url
        self.admin_username = admin_username
        self.admin_password = admin_password
        self.realm_name = realm_name
        self.backend_client_id = backend_client_id

    def login(self):
        self._acquire_access_token()

    def create_realm(self):
        realm = self._find_realm_by_name(self.realm_name)
        if realm is not None:
            logger.info("Realm {} found, skipping..".format(self.realm_name))
            return

        logger.info("Realm {} not found, creating".format(self.realm_name))
        r = requests.post(
            "{}/admin/realms/".format(self.keycloak_url),
            json={
                "realm": args.realm_name, 
                "enabled": True,
                "loginTheme": "govgr",
                "accountTheme": "govgr",
                "adminTheme": "govgr",
                "emailTheme": "govgr",
                "internationalizationEnabled": True,
                "supportedLocales": [ "en", "el" ],
                "defaultLocale": "el",
            },
            headers=self.headers,
        )
        r.raise_for_status()

        for realm_role in REALM_ROLES:
            logger.info("Creating realm role: {}".format(realm_role))
            r = requests.post(
                "{}/admin/realms/{}/roles".format(self.keycloak_url, args.realm_name),
                json={
                    "name": realm_role,
                },
                headers=self.headers,
            )
            if r.ok:
                logger.info("Realm role {} created".format(realm_role))

    def create_backend_client(self):
        client = self._find_client_by_client_id(self.backend_client_id)
        if client is not None:
            self.backend_client_uuid = client["id"]
            logger.info("Found client {}, skipping".format(self.backend_client_id))
            return

        payload = {
            "clientId": self.backend_client_id,
            "enabled": True,
            "description": "Pharma client",
            "redirectUris": ["http://pharma.test/*"],
            "serviceAccountsEnabled": True,
            "authorizationServicesEnabled": True,
            "fullScopeAllowed": True,
            "attributes": {
                "access.token.lifespan": "{}".format(ACCESS_TOKEN_LIFESPAN),
            },
            "protocolMappers": [
                {
                    "name": "Group Mapper",
                    "protocol": "openid-connect",
                    "protocolMapper": "oidc-group-membership-mapper",
                    "consentRequired": False,
                    "config": {
                        "full.path": "true",
                        "id.token.claim": "true",
                        "access.token.claim": "true",
                        "claim.name": "group",
                        "userinfo.token.claim": "true",
                    },
                },
                {
                    "name": "Audience Mapper",
                    "protocol": "openid-connect",
                    "protocolMapper": "oidc-audience-mapper",
                    "consentRequired": False,
                    "config": {
                        "included.client.audience": self.backend_client_id,
                        "id.token.claim": "false",
                        "access.token.claim": "true",
                        "included.custom.audience": self.backend_client_id,
                    },
                },
                {
                    "name": "Afm Mapper",
                    "protocol": "openid-connect",
                    "protocolMapper": "oidc-usermodel-attribute-mapper",
                    "consentRequired": False,
                    "config": {
                        "userinfo.token.claim": "true",
                        "user.attribute": "afm",
                        "id.token.claim": "true",
                        "access.token.claim": "true",
                        "claim.name": "afm",
                        "jsonType.label": "String",
                    },
                },
                {
                    "name": "Pharma Acl Mapper",
                    "protocol": "openid-connect",
                    "protocolMapper": "oidc-usermodel-attribute-mapper",
                    "consentRequired": False,
                    "config": {
                        "userinfo.token.claim": "true",
                        "user.attribute": "pharmaacl",
                        "id.token.claim": "true",
                        "access.token.claim": "true",
                        "claim.name": "pharmaacl",
                        "jsonType.label": "String",
                    },
                },
            ],
        }
        r = requests.post(
            "{}/admin/realms/{}/clients".format(self.keycloak_url, self.realm_name),
            json=payload,
            headers=self.headers,
        )
        r.raise_for_status()

        client = self._find_client_by_client_id(self.backend_client_id)
        self.backend_client_uuid = client["id"]
        secrets = self._generate_client_secrets(client["id"])

        logger.info("Fixing permissions for client service account")
        sa_user = self._get_client_service_account_user(client["id"])
        logger.info("Service account user id {}".format(sa_user["id"]))

        logger.info("Adding realm role admin to service account")
        self._assign_realm_role_by_name(sa_user["id"], "admin")

        logger.info("Adding all realm-management roles to service account")
        realm_management_client = self._find_client_by_client_id("realm-management")
        realm_management_client_roles = self._get_client_roles(
            realm_management_client["id"]
        )
        self._assign_client_roles(
            sa_user["id"], realm_management_client["id"], realm_management_client_roles
        )

        logger.info("Disabling console clients")
        account_client = self._find_client_by_client_id("account")
        self._disable_client(account_client["id"])

        account_console_client = self._find_client_by_client_id("account-console")
        self._disable_client(account_console_client["id"])

        logger.info("")
        logger.info("*************************************")
        logger.info(" Backend Client ID: {}".format(args.backend_client_id))
        logger.info(" Backend Client Secret: {}".format(secrets["value"]))
        logger.info("*************************************")
        logger.info("")

    def create_system_groups(self):
        logger.info("Creating system groups")
        for group in data.SYSTEM_GROUPS:
            self._create_group_with_parents(group["path"])

    def create_system_users(self):
        logger.info("Creating system users")
        for user in data.SYSTEM_USERS:
            logger.info("Creating user {}".format(user))
            username = user["username"]
            keycloak_user = self._create_user(username=username, afm=user["afm"])
            user["keycloak_id"] = keycloak_user["id"]

            # assign realm roles to user
            for realm_role in user["realm_roles"]:
                self._assign_realm_role_by_name(user["keycloak_id"], realm_role)

            for group_name in user["groups"]:
                group = self._find_group_by_name(group_name)
                self._add_user_to_group(user["keycloak_id"], group["id"])

    def create_policies(self):
        logger.info("Creating policies")
        for realm_role in data.REALM_ROLES:
            policy = self._create_realm_role_policy(realm_role["name"])
            realm_role["id"] = policy["id"]

        self._create_ekepacl_policy()
        self._create_ekepacl_permissions()

    def create_admin_permission_on_kep_offices(self):
        logger.info("Creating admin permission on kep resource")
        resource_type = "urn:{}:resources:kep".format(self.backend_client_id)

        logger.info(
            "Creating admin permissions for resource type: {}".format(resource_type)
        )
        self._create_realm_role_on_resource_type_permission(
            data.ADMIN_REALM_ROLE, resource_type
        )

    def delete_default_resources_and_policies(self):
        logger.info("Deleting default resources")
        self._delete_resource_by_name("Default Resource")
        self._delete_policy_by_name("Default Policy")

    def create_authz_scopes(self):
        logger.info("Creating authz scopes")
        for scope in data.SCOPES:
            s = self._create_authz_scope(scope["name"])
            scope["id"] = s["id"]
            logger.debug("Scope {} with id {}".format(s["name"], s["id"]))

    def setup_affirmative_decision_strategy(self):
        r = requests.get(
            "{}/admin/realms/{}/clients/{}/authz/resource-server".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid
            ),
            headers=self.headers,
        )
        resource_server = r.json()
        logger.info("Current resource server: {}".format(resource_server))

        resource_server["decisionStrategy"] = "AFFIRMATIVE"
        r = requests.put(
            "{}/admin/realms/{}/clients/{}/authz/resource-server".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid
            ),
            json=resource_server,
            headers=self.headers,
        )

    def _find_permission_by_name(self, name):
        r = requests.get(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/permission".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid
            ),
            params={
                "search": name,
            },
            headers=self.headers,
        )
        response = r.json()
        return next((x for x in response if x["name"] == name), None)


    def _create_realm_role_on_resource_type_permission(self, realm_role, resource_type):
        name = "Realm Role {} Allow Type {}".format(realm_role, resource_type)
        permission = self._find_permission_by_name(name)
        if permission == None:
            policy_repr = self._create_realm_role_policy(realm_role)
            r = requests.post(
                "{}/admin/realms/{}/clients/{}/authz/resource-server/permission/resource".format(
                    self.keycloak_url, self.realm_name, self.backend_client_uuid
                ),
                json={
                    "type": "resource",
                    "logic": "POSITIVE",
                    "decisionStrategy": "UNANIMOUS",
                    "name": name,
                    "resourceType": resource_type,
                    "policies": [policy_repr["id"]],
                },
                headers=self.headers,
            )
            permission = r.json()
        return permission


    def _find_authz_scope_by_name(self, name):
        r = requests.get(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/scope".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid
            ),
            params={
                "deep": False,
                "first": 0,
                "max": 100,
            },
            headers=self.headers,
        )
        return next((x for x in r.json() if x["name"] == name), None)

    def _create_authz_scope(self, name):
        scope = self._find_authz_scope_by_name(name)
        if scope is None:
            r = requests.post(
                "{}/admin/realms/{}/clients/{}/authz/resource-server/scope".format(
                    self.keycloak_url, self.realm_name, self.backend_client_uuid
                ),
                json={"name": name},
                headers=self.headers,
            )
            r.raise_for_status()
            scope = r.json()
        return scope

    def _create_realm_role_policy(self, realm_role):
        policy_name = "Realm Role {}".format(realm_role)
        policy_repr = self._find_policy_by_name(policy_name)
        if policy_repr is not None:
            return policy_repr

        role_repr = self._get_realm_role(realm_role)
        if role_repr is None:
            return
        r = requests.post(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/policy/role".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid
            ),
            json={
                "type": "role",
                "logic": "POSITIVE",
                "decisionStrategy": "UNANIMOUS",
                "name": policy_name,
                "roles": [{"id": role_repr["id"], "required": True}],
            },
            headers=self.headers,
        )
        return r.json()

    def _delete_policy_by_name(self, name):
        item = self._find_policy_by_name(name)
        if item is None:
            return
        r = requests.delete(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/policy/{}".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid, item["id"]
            ),
            headers=self.headers,
        )

    def _find_policy_by_name(self, name):
        r = requests.get(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/policy".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid
            ),
            params={"name": name},
            headers=self.headers,
        )
        return next((x for x in r.json() if x["name"] == name), None)


    def _delete_resource_by_name(self, name):
        resource = self._find_resource_by_name(name)
        if resource is None:
            return
        r = requests.delete(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/resource/{}".format(
                self.keycloak_url,
                self.realm_name,
                self.backend_client_uuid,
                resource["_id"],
            ),
            headers=self.headers,
        )

    def _find_resource_by_name(self, name):
        r = requests.get(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/resource".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid
            ),
            params={"name": name},
            headers=self.headers,
        )
        return next((x for x in r.json() if x["name"] == name), None)

    def _create_resource(self, name, uri, type):
        resource = self._find_resource_by_name(name)
        if resource is None:
            r = requests.post(
                "{}/admin/realms/{}/clients/{}/authz/resource-server/resource".format(
                    self.keycloak_url, self.realm_name, self.backend_client_uuid
                ),
                json={"name": name, "uris": [uri], "type": type, "scopes": data.SCOPES},
                headers=self.headers,
            )
            resource = r.json()
        return resource

    def _create_group_with_parents(self, path):
        created_groups = {}
        if path.startswith("/"):
            path = path[1:]
        parts = path.split("/")
        parent = None
        for part in parts:
            if parent is None:
                created_groups[part] = self._create_group(part)
            else:
                logger.debug("Creating group: {} with parent: {}".format(part, parent))
                if parent not in created_groups:
                    raise ValueError("Bug. Something is wrong with the group creation.")
                created_groups[part] = self._create_child_group(
                    created_groups[parent]["id"], part
                )
            parent = part

    def _create_ekepacl_policy(self):
        logger.info("Creating ekepacl policy")
        r = requests.post(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/policy/{}".format(
                self.keycloak_url,
                self.realm_name,
                self.backend_client_uuid,
                "script-pharma-acl-policy.js",
            ),
            json={
                "name": "EkepAclPolicy",
                "type": "script-pharma-acl-policy.js",
            },
            headers=self.headers,
        )
        if r.ok:
            logger.info("Created: {}".format(r.json()))
        else:
            logger.warning("{}".format(r.text))

    def _create_ekepacl_permissions(self):
        logger.info("Creating ekepacl permissions for resource types")

        policy = self._find_policy_by_name("EkepAclPolicy")

        r = requests.post(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/permission/resource".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid
            ),
            json={
                "name": "KepOffices-EkepAclPolicy",
                "resourceType": "urn:pharma-app:resources:kep",
                "type": "resource",
                "logic": "POSITIVE",
                "decisionStrategy": "UNANIMOUS",
                "policies": [policy["id"]],
            },
            headers=self.headers,
        )
        if r.ok:
            logger.info("Created: {}".format(r.json()))
        else:
            logger.warning("{}".format(r.text))

    def _create_child_group(self, parent_group_id, group_name):
        group = self._find_group_by_name(group_name)
        if group is None:
            logger.info("Child group {} not found, creating.".format(group_name))
            r = requests.post(
                "{}/admin/realms/{}/groups/{}/children".format(
                    self.keycloak_url, self.realm_name, parent_group_id
                ),
                json={
                    "name": group_name,
                },
                headers=self.headers,
            )
            if r.ok:
                group = self._find_group_by_name(group_name)
            else:
                print(r.text)
        return group

    def _find_policy_by_name(self, name):
        r = requests.get(
            "{}/admin/realms/{}/clients/{}/authz/resource-server/policy".format(
                self.keycloak_url, self.realm_name, self.backend_client_uuid
            ),
            params={"name": name},
            headers=self.headers,
        )
        return next((x for x in r.json() if x["name"] == name), None)

    def _find_user_by_username(self, username):
        r = requests.get(
            "{}/admin/realms/{}/users".format(self.keycloak_url, self.realm_name),
            params={
                "search": username,
            },
            headers=self.headers,
        )
        response = r.json()
        return next((x for x in response if x["username"] == username), None)

    def _create_user(self, username, afm):
        user = self._find_user_by_username(username)
        if user is None:
            logger.info("User {} not found, creating".format(username))
            r = requests.post(
                "{}/admin/realms/{}/users".format(self.keycloak_url, self.realm_name),
                json={
                    "username": username,
                    "enabled": True,
                    "email": username + "@pharma.test",
                    "emailVerified": True,
                    "credentials": [
                        {
                            "value": username,
                            "type": "password",
                        }
                    ],
                    "attributes": {"afm": afm},
                },
                headers=self.headers,
            )
            if r.ok:
                user = self._find_user_by_username(username)
        return user

    def _add_user_to_group(self, user_id, group_id):
        r = requests.put(
            "{}/admin/realms/{}/users/{}/groups/{}".format(
                self.keycloak_url, self.realm_name, user_id, group_id
            ),
            json={},
            headers=self.headers,
        )
        r.raise_for_status()

    def _create_group(self, group_name):
        group = self._find_group_by_name(group_name)
        if group is None:
            logger.info("Top level group {} not found, creating".format(group_name))
            r = requests.post(
                "{}/admin/realms/{}/groups".format(self.keycloak_url, self.realm_name),
                json={
                    "name": group_name,
                },
                headers=self.headers,
            )
            if r.ok:
                group = self._find_group_by_name(group_name)
        return group

    def _find_group_by_name(self, group_name):
        r = requests.get(
            "{}/admin/realms/{}/groups".format(self.keycloak_url, self.realm_name),
            headers=self.headers,
        )
        response = r.json()
        return Loader._find_group_recursively(response, group_name)

    @staticmethod
    def _find_group_recursively(groups, group_name):
        if len(groups) == 0:
            return
        for g in groups:
            if g["name"] == group_name:
                return g
            in_subgroup = Loader._find_group_recursively(g["subGroups"], group_name)
            if in_subgroup is not None:
                return in_subgroup
        return None

    def _generate_client_secrets(self, client_id):
        r = requests.post(
            "{}/admin/realms/{}/clients/{}/client-secret".format(
                self.keycloak_url, self.realm_name, client_id
            ),
            json={},
            headers=self.headers,
        )
        r.raise_for_status()
        return r.json()

    def _disable_client(self, client_id):
        r = requests.put(
            "{}/admin/realms/{}/clients/{}".format(
                self.keycloak_url, self.realm_name, client_id
            ),
            json={
                "enabled": False,
            },
            headers=self.headers,
        )
        r.raise_for_status()

    def _assign_realm_role_by_name(self, user_id, realm_role_name):
        realm_role = self._get_realm_role(realm_role_name)
        r = requests.post(
            "{}/admin/realms/{}/users/{}/role-mappings/realm".format(
                self.keycloak_url, self.realm_name, user_id
            ),
            json=[realm_role],
            headers=self.headers,
        )
        r.raise_for_status()

    def _assign_client_roles(self, user_id, client_id, roles):
        r = requests.post(
            "{}/admin/realms/{}/users/{}/role-mappings/clients/{}".format(
                self.keycloak_url, self.realm_name, user_id, client_id
            ),
            json=roles,
            headers=self.headers,
        )
        r.raise_for_status()

    def _get_client_service_account_user(self, id):
        r = requests.get(
            "{}/admin/realms/{}/clients/{}/service-account-user".format(
                self.keycloak_url, self.realm_name, id
            ),
            headers=self.headers,
        )
        if r.ok:
            return r.json()
        else:
            return None

    def _get_realm_role(self, name):
        r = requests.get(
            "{}/admin/realms/{}/roles/{}".format(
                self.keycloak_url, self.realm_name, name
            ),
            headers=self.headers,
        )
        if r.ok:
            return r.json()
        return None

    def _get_client_roles(self, id):
        r = requests.get(
            "{}/admin/realms/{}/clients/{}/roles".format(
                self.keycloak_url, self.realm_name, id
            ),
            headers=self.headers,
        )
        if r.ok:
            return r.json()
        return None

    def _get_client_role_by_name(self, id, name):
        r = requests.get(
            "{}/admin/realms/{}/clients/{}/roles".format(
                self.keycloak_url, self.realm_name, id
            ),
            headers=self.headers,
        )
        return next((x for x in r.json() if x["name"] == name), None)

    def _find_realm_by_name(self, name):
        r = requests.get(
            "{}/admin/realms/{}".format(self.keycloak_url, name),
            headers=self.headers,
        )
        if r.ok:
            return r.json()
        else:
            return None

    def _find_client_by_client_id(self, client_id):
        r = requests.get(
            "{}/admin/realms/{}/clients".format(self.keycloak_url, self.realm_name),
            headers=self.headers,
        )
        return next((x for x in r.json() if x["clientId"] == client_id), None)

    def _acquire_access_token(self):
        logger.info("Acquiring token")
        token_url = "{}/realms/master/protocol/openid-connect/token".format(
            self.keycloak_url
        )
        logger.info("Token url {}".format(token_url))
        r = requests.post(
            token_url,
            data={
                "grant_type": "password",
                "client_id": "admin-cli",
                "username": self.admin_username,
                "password": self.admin_password,
                "realm": "master",
                "scope": "openid",
            },
        )
        r.raise_for_status()
        access_token = r.json()["access_token"]
        logger.info("Acquired access token: {}".format(access_token))
        self.access_token = access_token
        self.headers = CaseInsensitiveDict()
        self.headers["Content-Type"] = "application/json"
        self.headers["Authorization"] = "Bearer {}".format(access_token)


def main(args):
    logging.basicConfig(level=logging.INFO)

    loader = Loader(
        args.keycloak_url,
        args.admin_username,
        args.admin_password,
        args.realm_name,
        args.backend_client_id,
    )

    loader.login()
    loader.create_realm()
    loader.create_backend_client()
    # loader.create_system_groups()
    # loader.create_system_users()
    # loader.delete_default_resources_and_policies()
    # loader.setup_affirmative_decision_strategy()
    # loader.create_policies()
    # loader.create_admin_permission_on_kep_offices()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Load initial data")
    parser.add_argument(
        "--keycloakurl",
        metavar="URL",
        type=str,
        action="store",
        dest="keycloak_url",
        default="http://auth.pharma.test",
        help="Keycloak url",
    )
    parser.add_argument(
        "--adminuser",
        metavar="USERNAME",
        type=str,
        action="store",
        dest="admin_username",
        default="admin",
        help="Keycloak admin username",
    )
    parser.add_argument(
        "--adminpassword",
        metavar="PASSWORD",
        type=str,
        action="store",
        dest="admin_password",
        default="admin",
        help="Keycloak admin password",
    )
    parser.add_argument(
        "--realmname",
        metavar="NAME",
        type=str,
        action="store",
        dest="realm_name",
        default="pharma",
        help="Realm name to create",
    )
    parser.add_argument(
        "--backend-clientid",
        metavar="CLIENTID",
        type=str,
        action="store",
        dest="backend_client_id",
        default="pharma-app",
        help="Client id",
    )
    args = parser.parse_args()

    main(args)
