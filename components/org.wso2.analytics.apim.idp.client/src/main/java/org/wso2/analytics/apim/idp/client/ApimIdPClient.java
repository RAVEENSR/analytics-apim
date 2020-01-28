/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.idp.client;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.google.gson.Gson;
import feign.Response;
import feign.gson.GsonDecoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.idp.client.dao.OAuthAppDAO;
import org.wso2.analytics.apim.idp.client.dto.DCRClientInfo;
import org.wso2.analytics.apim.idp.client.token.TokenData;
import org.wso2.analytics.apim.idp.client.token.TokenDataHolder;
import org.wso2.carbon.analytics.idp.client.core.exception.AuthenticationException;
import org.wso2.carbon.analytics.idp.client.core.exception.IdPClientException;
import org.wso2.carbon.analytics.idp.client.core.models.Role;
import org.wso2.carbon.analytics.idp.client.core.models.User;
import org.wso2.carbon.analytics.idp.client.core.utils.IdPClientConstants;
import org.wso2.carbon.analytics.idp.client.external.ExternalIdPClient;
import org.wso2.carbon.analytics.idp.client.external.dto.DCRError;
import org.wso2.carbon.analytics.idp.client.external.dto.OAuth2IntrospectionResponse;
import org.wso2.carbon.analytics.idp.client.external.dto.OAuth2TokenInfo;
import org.wso2.carbon.analytics.idp.client.external.impl.DCRMServiceStub;
import org.wso2.carbon.analytics.idp.client.external.impl.OAuth2ServiceStubs;
import org.wso2.carbon.analytics.idp.client.external.models.ExternalSession;
import org.wso2.carbon.analytics.idp.client.external.models.OAuthApplicationInfo;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.ANY_TENANT_DOMAIN_SCOPE_POSTFIX;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.API_VIEW_SCOPE;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.AT;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.FORWARD_SLASH;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.OAUTHAPP_TABLE;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.OPEN_ID_SCOPE;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.POST_LOGOUT_REDIRECT_URI_PHRASE;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.SPACE;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.SUBSCRIBE_SCOPE;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.SUPER_TENANT_DOMAIN;
import static org.wso2.analytics.apim.idp.client.ApimIdPClientConstants.UNDERSCORE;

/**
 * Implementation class for Apim IdP based on OAuth2.
 */
public class ApimIdPClient extends ExternalIdPClient {

    private static final Logger LOG = LoggerFactory.getLogger(ApimIdPClient.class);
    private static final Object OAuthAppCreationLock = new Object();

    private DCRMServiceStub dcrmServiceStub;
    private OAuth2ServiceStubs oAuth2ServiceStubs;
    private String kmUserName;
    private String authorizeEndpoint;
    private String grantType;
    private String adminServiceUsername;
    private String baseUrl;
    private String adminScopeName;
    private String allScopes;
    private OAuthAppDAO oAuthAppDAO;
    private Cache<String, ExternalSession> tokenCache;
    private boolean isSSOEnabled;
    private String ssoLogoutURL;
    private boolean isHostnameVerifierEnabled;

    // Here the user given context are mapped to the OAuthApp Info.
    private Map<String, OAuthApplicationInfo> oAuthAppInfoMap;

    public ApimIdPClient(String adminServiceUsername, String baseUrl, OAuthAppDAO oAuthAppDAO, String authorizeEndpoint,
                         String grantType, String adminScopeName, String allScopes,
                         Map<String, OAuthApplicationInfo> oAuthAppInfoMap, int cacheTimeout, String kmUserName,
                         DCRMServiceStub dcrmServiceStub, OAuth2ServiceStubs oAuth2ServiceStubs,
                         boolean isSSOEnabled, String ssoLogoutURL, boolean isHostnameVerifierEnabled) {
        super(baseUrl, authorizeEndpoint, grantType, null, adminScopeName, oAuthAppInfoMap,
                cacheTimeout, null, dcrmServiceStub, oAuth2ServiceStubs, null, null, isSSOEnabled, ssoLogoutURL);
        this.adminServiceUsername = adminServiceUsername;
        this.baseUrl = baseUrl;
        this.authorizeEndpoint = authorizeEndpoint;
        this.grantType = grantType;
        this.oAuthAppInfoMap = oAuthAppInfoMap;
        this.adminScopeName = adminScopeName;
        this.allScopes = allScopes;
        this.kmUserName = kmUserName;
        this.oAuthAppDAO = oAuthAppDAO;
        this.dcrmServiceStub = dcrmServiceStub;
        this.oAuth2ServiceStubs = oAuth2ServiceStubs;
        this.tokenCache = CacheBuilder.newBuilder()
                .expireAfterWrite(cacheTimeout, TimeUnit.SECONDS)
                .build();
        this.isSSOEnabled = isSSOEnabled;
        this.ssoLogoutURL = ssoLogoutURL;
        this.isHostnameVerifierEnabled = isHostnameVerifierEnabled;
    }

    @Override
    public void init(String kmUserName) throws IdPClientException {
        if (!isHostnameVerifierEnabled) {
            System.setProperty("httpclient.hostnameVerifier", "AllowAll");
        }
        this.oAuthAppDAO.init();
        if (!this.oAuthAppDAO.tableExists()) {
            String error
                    = OAUTHAPP_TABLE + " does not exists in the " + this.oAuthAppDAO.getDatabaseName() + " database.";
            LOG.error(error);
            throw new IdPClientException(error);
        }

        for (Map.Entry<String, OAuthApplicationInfo> entry : this.oAuthAppInfoMap.entrySet()) {
            String appContext = entry.getKey();
            OAuthApplicationInfo oAuthApp = entry.getValue();
            String clientName = oAuthApp.getClientName();
            OAuthApplicationInfo persistedOAuthApp = this.oAuthAppDAO.getOAuthApp(clientName);
            if (persistedOAuthApp == null) {
                synchronized (OAuthAppCreationLock) {
                    persistedOAuthApp = this.oAuthAppDAO.getOAuthApp(clientName);
                    if (persistedOAuthApp == null) {
                        registerApplication(appContext, clientName, kmUserName);
                    }
                }
            } else {
                this.oAuthAppInfoMap.replace(appContext, persistedOAuthApp);
            }
        }
    }

    /*
    * NOTE: For this apim idp client we have treated scopes as roles. So, whenever roles are requested, instead of roles
    *  we provide corresponding scopes. These scopes are read from the tenant-conf.json file in api manager product.
    * https://github.com/wso2/carbon-apimgt/blob/master/components/apimgt/org.wso2.carbon.apimgt.impl/src/main/
    * resources/tenant/tenant-conf.json
    * This move taken due to roadblocks occurred when getting user roles in multi-tenancy scenario.
    * */
    @Override
    public List<Role> getAllRolesOfTenant(String username) throws IdPClientException {
        String tenantDomain = extractTenantDomainFromUserName(username);
        String[] scopeList = this.allScopes.split(SPACE);
        ArrayList<String> newScopes = new ArrayList<>();
        for (String scope: scopeList) {
            if (!scope.equalsIgnoreCase(OPEN_ID_SCOPE) && !scope.equalsIgnoreCase(API_VIEW_SCOPE)
                    && !scope.equalsIgnoreCase(SUBSCRIBE_SCOPE)) {
                newScopes.add(scope + ANY_TENANT_DOMAIN_SCOPE_POSTFIX);
                newScopes.add(scope + UNDERSCORE + tenantDomain);
            }
        }
        return getRolesFromArray(newScopes.toArray(new String[0]));
    }

    @Override
    public List<Role> getAllRoles() throws IdPClientException {
        /*
        * This method will be only called via the updateDashboardRoles method in carbon-dashboard repo's
        * DashboardImporter class. This updateDashboardRoles is executed only when a dashboard is imported in the
        * dashboard startup. As in the startup level, there will be no user logged in, a tenant specific roles cannot be
        * retrieved. So that, super tenant specific scopes are returned.
        * */
        return getAllRolesOfTenant(this.adminServiceUsername + AT + SUPER_TENANT_DOMAIN);
    }

    @Override
    public Role getAdminRole() throws IdPClientException {
        if (this.adminScopeName == null) {
            String error = "Error occurred while getting the admin scope name.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        return new Role(this.adminScopeName, this.adminScopeName);
    }

    @Override
    public User getUser(String name) throws IdPClientException {
        String tenantDomain = extractTenantDomainFromUserName(name);
        TokenData tokenData = TokenDataHolder.getInstance().getTokenMap().get(name);
        ArrayList<Role> roles;
        if (tokenData == null) {
            LOG.debug("Cannot find the token data for the user: " + name + " in the token data map. Hence, cannot " +
                    "retrieve user scopes. Empty array returned for roles.");
            roles = new ArrayList<>();
        } else {
            String scopes = tokenData.getScopes();
            String[] scopeList = scopes.split(SPACE);
            ArrayList<String> newScopes = new ArrayList<>();
            for (String scope: scopeList) {
                if (!scope.equalsIgnoreCase(OPEN_ID_SCOPE) && !scope.equalsIgnoreCase(API_VIEW_SCOPE)
                        && !scope.equalsIgnoreCase(SUBSCRIBE_SCOPE)) {
                    newScopes.add(scope + ANY_TENANT_DOMAIN_SCOPE_POSTFIX);
                    newScopes.add(scope + UNDERSCORE + tenantDomain);
                }
            }
            roles = getRolesFromArray(newScopes.toArray(new String[0]));
        }
        Map<String, String> properties = new HashMap<>();
        return new User(name, properties, roles);
    }

    /**
     * This method returns a tenant domain of the user. For example if the username is "admin@carbon.super" tenant
     * domain will be returned as "carbon.super".
     * @param username String array which contains scope names
     * @return Tenant domain of the user
     * @throws IdPClientException thrown when the username is empty or when an error occurred when retrieve the tenant
     * domain.
     */
    private String extractTenantDomainFromUserName(String username) throws IdPClientException {
        if (username == null || username.isEmpty()) {
            String error = "Username cannot be empty.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        String[] usernameSections = username.split(AT);
        String tenantDomain = usernameSections[usernameSections.length - 1];
        if (tenantDomain == null) {
            String error = "Cannot get the tenant domain from the given username: " + username;
            LOG.error(error);
            throw new IdPClientException(error);
        }
        return tenantDomain;
    }

    /**
     * This method returns a list of Roles from a given String array which contains scopes. Please note that we consider
     * scopes as roles in this idp client.
     * @param scopes String array which contains scope names
     * @return Array List of scopes as roles
     * @throws IdPClientException thrown when the node list is empty.
     */
    private ArrayList<Role> getRolesFromArray(String[] scopes) throws IdPClientException {
        if (scopes.length == 0) {
            String error = "Cannot get roles from the list as the scope list is empty.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        ArrayList<Role> roles = new ArrayList<>();
        Role newRole;
        for (String scope : scopes) {
            newRole = new Role(scope, scope);
            roles.add(newRole);
        }
        return roles;
    }

    @Override
    public Map<String, String> login(Map<String, String> properties) throws IdPClientException {
        Map<String, String> returnProperties = new HashMap<>();
        String grantType = properties.getOrDefault(IdPClientConstants.GRANT_TYPE, this.grantType);
        if (!IdPClientConstants.REFRESH_GRANT_TYPE.equals(grantType)) {
            this.init(this.kmUserName);
        }

        Response response;
        String oAuthAppContext = properties.get(IdPClientConstants.APP_NAME);

        //Checking if these are the frontend-if not use sp
        if (!this.oAuthAppInfoMap.containsKey(oAuthAppContext)) {
            oAuthAppContext = ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT;
        }

        String username = properties.get(IdPClientConstants.USERNAME);
        if (IdPClientConstants.AUTHORIZATION_CODE_GRANT_TYPE.equals(grantType)) {
            String callbackUrl = properties.get(IdPClientConstants.CALLBACK_URL);
            returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_REDIRECTION);
            returnProperties.put(IdPClientConstants.CLIENT_ID, this.oAuthAppInfoMap.get(oAuthAppContext).getClientId());
            returnProperties.put(IdPClientConstants.REDIRECTION_URL, this.authorizeEndpoint);
            returnProperties.put(IdPClientConstants.CALLBACK_URL, this.baseUrl +
                    ApimIdPClientConstants.CALLBACK_URL + callbackUrl + ApimIdPClientConstants.CALLBACK_URL_SUFFIX);
            returnProperties.put(IdPClientConstants.SCOPE, this.allScopes);
            return returnProperties;
        } else if (IdPClientConstants.PASSWORD_GRANT_TYPE.equals(grantType)) {
            response = oAuth2ServiceStubs.getTokenServiceStub().generatePasswordGrantAccessToken(
                    username, properties.get(IdPClientConstants.PASSWORD),
                    properties.get(IdPClientConstants.APP_ID), this.oAuthAppInfoMap.get(oAuthAppContext).getClientId(),
                    this.oAuthAppInfoMap.get(oAuthAppContext).getClientSecret());
        } else {
            response = oAuth2ServiceStubs.getTokenServiceStub().generateRefreshGrantAccessToken(
                    properties.get(IdPClientConstants.REFRESH_TOKEN), null,
                    this.oAuthAppInfoMap.get(oAuthAppContext).getClientId(),
                    this.oAuthAppInfoMap.get(oAuthAppContext).getClientSecret());
        }

        if (response == null) {
            String error = "Error occurred while generating an access token for grant type '" +
                    removeCRLFCharacters(grantType) + "'. Response is null.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        if (response.status() == 200) {   //200 - Success
            if (LOG.isDebugEnabled()) {
                LOG.debug("A new access token is successfully generated.");
            }
            try {
                OAuth2TokenInfo oAuth2TokenInfo = (OAuth2TokenInfo) new GsonDecoder().decode(response,
                        OAuth2TokenInfo.class);
                long currentTimeInSeconds = System.currentTimeMillis() / 1000;
                long tokenValidityPeriod = currentTimeInSeconds + oAuth2TokenInfo.getExpiresIn();
                returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_SUCCESS);
                returnProperties.put(IdPClientConstants.ACCESS_TOKEN, oAuth2TokenInfo.getAccessToken());
                returnProperties.put(IdPClientConstants.REFRESH_TOKEN, oAuth2TokenInfo.getRefreshToken());
                returnProperties.put(IdPClientConstants.VALIDITY_PERIOD,
                        Long.toString(oAuth2TokenInfo.getExpiresIn()));
                if (IdPClientConstants.REFRESH_GRANT_TYPE.equals(grantType)) {
                    returnProperties.put(IdPClientConstants.ID_TOKEN_KEY, oAuth2TokenInfo.getIdToken());
                    /*
                    * To add the access token(got through the refresh grant flow) to the TokenDataMap, we need to know
                    * the username. Since the username is not included in the response we get in the refresh token flow,
                    * an introspection is performed to get the username.
                    * */
                    Response introspectTokenResponse = oAuth2ServiceStubs.getIntrospectionServiceStub()
                            .introspectAccessToken(oAuth2TokenInfo.getAccessToken());
                    if (introspectTokenResponse.status() == 200) {   //200 - Success
                        OAuth2IntrospectionResponse introspectResponse = (OAuth2IntrospectionResponse) new GsonDecoder()
                                .decode(introspectTokenResponse, OAuth2IntrospectionResponse.class);
                        username = introspectResponse.getUsername();
                    } else {
                        if (LOG.isDebugEnabled()) {
                            LOG.debug("Unable to get the username from introspection of the token '" +
                                    oAuth2TokenInfo.getAccessToken() + "'. Response : '" +
                                    introspectTokenResponse.toString());
                        }
                    }
                }
                returnProperties.put(IdPClientConstants.USERNAME, username);
                TokenData tokenData = new TokenData(
                        oAuth2TokenInfo.getAccessToken(),
                        oAuth2TokenInfo.getScope(),
                        tokenValidityPeriod
                );
                TokenDataHolder.getInstance().addTokenDataToMap(username, tokenData);
                tokenCache.put(oAuth2TokenInfo.getAccessToken(),
                        new ExternalSession(username, oAuth2TokenInfo.getAccessToken()));
                return returnProperties;
            } catch (IOException e) {
                String error = "Error occurred while parsing token response for user. Response: '" +
                        response.body().toString() + "'.";
                LOG.error(error, e);
                throw new IdPClientException(error, e);
            }
        } else if (response.status() == 401) {
            String invalidResponse = "Unable to get access token for the request with grant type : '" + grantType +
                    "', for the user '" + username + "'.";
            LOG.error(invalidResponse);
            returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_FAILURE);
            returnProperties.put(IdPClientConstants.ERROR, IdPClientConstants.Error.INVALID_CREDENTIALS);
            returnProperties.put(IdPClientConstants.ERROR_DESCRIPTION, invalidResponse);
            return returnProperties;
        } else {  //Error case
            String errorMessage = "Token generation request failed. HTTP error code: '" + response.status() +
                    "'. Error Response: '" + response.body().toString() + "'.";
            LOG.error(errorMessage);
            throw new IdPClientException(errorMessage);
        }
    }

    @Override
    public Map<String, String> logout(Map<String, String> properties) throws IdPClientException {
        String token = properties.get(IdPClientConstants.ACCESS_TOKEN);
        String oAuthAppContext = properties.getOrDefault(IdPClientConstants.APP_NAME,
                ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT);
        if (!this.oAuthAppInfoMap.containsKey(oAuthAppContext)) {
            oAuthAppContext = ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT;
        }
        ExternalSession session = tokenCache.getIfPresent(token);
        String username;
        if (session == null) {
            try {
                OAuth2IntrospectionResponse introspectResponse = getIntrospectResponse(token);
                username = introspectResponse.getUsername();
            } catch (AuthenticationException e) {
                String error = "Error occurred while introspecting the token '" + token + "'. " + e.getMessage();
                LOG.error(error, e);
                throw new IdPClientException(error, e);
            }
        } else {
            username = session.getUserName();
        }
        TokenDataHolder.getInstance().removeTokenDataFromMap(username);
        tokenCache.invalidate(token);
        oAuth2ServiceStubs.getRevokeServiceStub().revokeAccessToken(
                token,
                this.oAuthAppInfoMap.get(oAuthAppContext).getClientId(),
                this.oAuthAppInfoMap.get(oAuthAppContext).getClientSecret());

        Map<String, String> returnProperties = new HashMap<>();
        String idToken = properties.getOrDefault(IdPClientConstants.ID_TOKEN_KEY, null);
        if (!isSSOEnabled || idToken == null) {
            returnProperties.put(IdPClientConstants.RETURN_LOGOUT_PROPERTIES, "false");
        } else {
            String postLogoutRedirectUrl = this.baseUrl + FORWARD_SLASH + oAuthAppContext;

            returnProperties.put(IdPClientConstants.RETURN_LOGOUT_PROPERTIES, "true");
            String targetURIForRedirection = ssoLogoutURL
                    .concat(ApimIdPClientConstants.SSO_LOGING_ID_TOKEN_TAIL)
                    .concat(idToken)
                    .concat(POST_LOGOUT_REDIRECT_URI_PHRASE)
                    .concat(postLogoutRedirectUrl);
            returnProperties.put(ApimIdPClientConstants.EXTERNAL_SSO_LOGOUT_URL, targetURIForRedirection);
        }
        return returnProperties;
    }

    @Override
    public Map<String, String> authCodeLogin(String appContext, String code) throws IdPClientException {
        Map<String, String> returnProperties = new HashMap<>();
        String oAuthAppContext = appContext.split("/\\|?")[0];
        if (!this.oAuthAppInfoMap.containsKey(oAuthAppContext)) {
            oAuthAppContext = ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT;
        }
        OAuthApplicationInfo oAuthApplicationInfo = this.oAuthAppInfoMap.get(oAuthAppContext);
        Response response = oAuth2ServiceStubs.getTokenServiceStub().generateAuthCodeGrantAccessToken(code,
                this.baseUrl + ApimIdPClientConstants.CALLBACK_URL + oAuthAppContext +
                        ApimIdPClientConstants.CALLBACK_URL_SUFFIX, null,
                oAuthApplicationInfo.getClientId(), oAuthApplicationInfo.getClientSecret());
        if (response == null) {
            String error = "Error occurred while generating an access token from code '" + code + "'. " +
                    "Response is null.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        if (response.status() == 200) {   //200 - Success
            if (LOG.isDebugEnabled()) {
                LOG.debug("A new access token from code is successfully generated for the code '" + code + "'.");
            }
            try {
                OAuth2TokenInfo oAuth2TokenInfo = (OAuth2TokenInfo) new GsonDecoder().decode(response,
                        OAuth2TokenInfo.class);
                long currentTimeInSeconds = System.currentTimeMillis() / 1000;
                long tokenValidityPeriod = currentTimeInSeconds + oAuth2TokenInfo.getExpiresIn();
                returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_SUCCESS);
                returnProperties.put(IdPClientConstants.ACCESS_TOKEN, oAuth2TokenInfo.getAccessToken());
                returnProperties.put(IdPClientConstants.REFRESH_TOKEN, oAuth2TokenInfo.getRefreshToken());
                returnProperties.put(IdPClientConstants.ID_TOKEN_KEY, oAuth2TokenInfo.getIdToken());
                returnProperties.put(IdPClientConstants.VALIDITY_PERIOD,
                        Long.toString(oAuth2TokenInfo.getExpiresIn()));
                returnProperties.put(ApimIdPClientConstants.REDIRECT_URL,
                        this.baseUrl + (this.baseUrl.endsWith("/") ? appContext : "/" + appContext));
                Response introspectTokenResponse = oAuth2ServiceStubs.getIntrospectionServiceStub()
                        .introspectAccessToken(oAuth2TokenInfo.getAccessToken());
                String authUser = null;
                if (introspectTokenResponse.status() == 200) {   //200 - Success
                    OAuth2IntrospectionResponse introspectResponse = (OAuth2IntrospectionResponse) new GsonDecoder()
                            .decode(introspectTokenResponse, OAuth2IntrospectionResponse.class);
                    authUser = introspectResponse.getUsername();
                    returnProperties.put(IdPClientConstants.USERNAME, authUser);
                } else {
                    if (LOG.isDebugEnabled()) {
                        LOG.debug("Unable to get the username from introspection of the token '" +
                                oAuth2TokenInfo.getAccessToken() + "'. Response : '" +
                                introspectTokenResponse.toString());
                    }
                }
                if (authUser != null) {
                    tokenCache.put(oAuth2TokenInfo.getAccessToken(),
                            new ExternalSession(authUser, oAuth2TokenInfo.getAccessToken()));
                    TokenData tokenData = new TokenData(
                            oAuth2TokenInfo.getAccessToken(),
                            oAuth2TokenInfo.getScope(),
                            tokenValidityPeriod
                    );
                    TokenDataHolder.getInstance().addTokenDataToMap(authUser, tokenData);
                }
                return returnProperties;
            } catch (IOException e) {
                String error = "Error occurred while parsing token response. Response : '" +
                        response.body().toString() + "'";
                LOG.error(error, e);
                throw new IdPClientException(error, e);
            }
        } else if (response.status() == 401) {
            String invalidResponse = "Unauthorized user for accessing token form code '" + code + "'. for the app " +
                    "context, '" + appContext + "'";
            returnProperties.put(IdPClientConstants.LOGIN_STATUS, IdPClientConstants.LoginStatus.LOGIN_FAILURE);
            returnProperties.put(IdPClientConstants.ERROR, IdPClientConstants.Error.INVALID_CREDENTIALS);
            returnProperties.put(IdPClientConstants.ERROR_DESCRIPTION, invalidResponse);
            return returnProperties;
        } else {  //Error case
            String error = "Token generation request failed. HTTP error code: '" + response.status() +
                    "'. Error Response Body: '" + response.body().toString() + "'.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
    }

    @Override
    public String authenticate(String token) throws AuthenticationException, IdPClientException {
        ExternalSession session = tokenCache.getIfPresent(token);
        if (session != null) {
            return session.getUserName();
        }
        OAuth2IntrospectionResponse introspectResponse = getIntrospectResponse(token);
        String username = introspectResponse.getUsername();
        tokenCache.put(token, new ExternalSession(username, token));
        TokenData tokenData = new TokenData(token, introspectResponse.getScope(), introspectResponse.getExp());
        TokenDataHolder.getInstance().addTokenDataToMap(username, tokenData);
        return username;
    }

    /**
     * This method returns response got from the introspection if the introspection is active.
     * @param token  token which needs to be introspected
     * @throws IdPClientException thrown when an error occurred when performing introspect
     * @throws AuthenticationException thrown when the token is not active
     * @return the introspect response
     */
    private OAuth2IntrospectionResponse getIntrospectResponse(String token) throws IdPClientException,
            AuthenticationException {
        Response response = oAuth2ServiceStubs.getIntrospectionServiceStub().introspectAccessToken(token);

        if (response == null) {
            String error = "Error occurred while authenticating token '" + token + "'. Response is null.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        try {
            if (response.status() == 200) {  //200 - OK
                OAuth2IntrospectionResponse introspectResponse = (OAuth2IntrospectionResponse) new GsonDecoder()
                        .decode(response, OAuth2IntrospectionResponse.class);
                if (introspectResponse.isActive()) {
                    return introspectResponse;
                } else {
                    String error = "The token is not active.";
                    if (LOG.isDebugEnabled()) {
                        LOG.debug(error + " Response: " + introspectResponse.toString());
                    }
                    throw new AuthenticationException(error);
                }
            } else if (response.status() == 400) {  //400 - Known Error
                try {
                    DCRError error = (DCRError) new GsonDecoder().decode(response, DCRError.class);
                    String errorString = "Error occurred while introspecting the token. Error: " +
                            error.getError() + ". Error Description: " + error.getErrorDescription() +
                            ". Status Code: " + response.status();
                    LOG.error(errorString);
                    throw new IdPClientException(errorString);
                } catch (IOException e) {
                    String error = "Error occurred while parsing the Introspection error message.";
                    LOG.error(error, e);
                    throw new IdPClientException(error, e);
                }
            } else {  //Unknown Error
                String error = "Error occurred while authenticating. Error: '" + response.body().toString()
                        + "'. Status Code: '" + response.status() + "'.";
                LOG.error(error);
                throw new IdPClientException(error);
            }
        } catch (IOException e) {
            String error = "Error occurred while parsing the authentication response.";
            LOG.error(error, e);
            throw new IdPClientException(error, e);
        }
    }

    /**
     * This method registers an application using a DCR call if the OAuth application does not exists. If is exists it
     * retrieves the application data and saved in oAuthAppInfoMap.
     * @param appContext  context of the application
     * @param clientName name of the client
     * @param kmUserName username of the key manager
     * @throws IdPClientException thrown when an error occurred when sending the DCR call or retrieving application
     * data using OAuthAdminService service
     */
    private void registerApplication(String appContext, String clientName, String kmUserName)
            throws IdPClientException {

        String loginCallBackUrl;
        String postLogoutRedirectUrl = this.baseUrl + FORWARD_SLASH + appContext;
        if (clientName.equals(ApimIdPClientConstants.DEFAULT_SP_APP_CONTEXT)) {
            loginCallBackUrl = this.baseUrl + ApimIdPClientConstants.CALLBACK_URL;
        } else {
            loginCallBackUrl = this.baseUrl + ApimIdPClientConstants.CALLBACK_URL + appContext +
                    ApimIdPClientConstants.CALLBACK_URL_SUFFIX;
        }

        if (LOG.isDebugEnabled()) {
            LOG.debug("Creating OAuth2 application of name '" + clientName + "'.");
        }
        DCRClientInfo dcrClientInfo = new DCRClientInfo();
        dcrClientInfo.setClientName(clientName);
        dcrClientInfo.addGrantType(IdPClientConstants.PASSWORD_GRANT_TYPE);
        dcrClientInfo.addGrantType(IdPClientConstants.AUTHORIZATION_CODE_GRANT_TYPE);
        dcrClientInfo.addGrantType(IdPClientConstants.REFRESH_GRANT_TYPE);
        dcrClientInfo.addCallbackUrl(loginCallBackUrl);
        dcrClientInfo.addCallbackUrl(postLogoutRedirectUrl);
        dcrClientInfo.setExtSaasApp(true);
        dcrClientInfo.setExtSkipConsent(true);
        dcrClientInfo.setExtSkipLogoutConsent(true);
//        dcrClientInfo.setOwner(kmUserName);

        Response response = dcrmServiceStub.registerApplication(new Gson().toJson(dcrClientInfo));
        if (response == null) {
            String error = "Error occurred while DCR application '" + dcrClientInfo + "' creation. " +
                    "Response is null.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
        if (response.status() == 200) {  //200 - OK
            try {
                DCRClientInfo dcrClientInfoResponse = (DCRClientInfo) new GsonDecoder()
                        .decode(response, DCRClientInfo.class);
                OAuthApplicationInfo oAuthApplicationInfo = new OAuthApplicationInfo(
                        clientName, dcrClientInfoResponse.getClientId(), dcrClientInfoResponse.getClientSecret()
                );
                this.oAuthAppInfoMap.replace(appContext, oAuthApplicationInfo);
                if (LOG.isDebugEnabled()) {
                    LOG.debug("OAuth2 application created: " + oAuthApplicationInfo.toString());
                }
            } catch (IOException e) {
                String error = "Error occurred while parsing the DCR application creation response " +
                        "message. Response: '" + response.body().toString() + "'.";
                LOG.error(error, e);
                throw new IdPClientException(error, e);
            }
        } else {  //Unknown Error
            String error = "Error occurred while DCR application creation. Error: '" +
                    response.body().toString() + "'. Status Code: '" + response.status() + "'.";
            LOG.error(error);
            throw new IdPClientException(error);
        }
    }

    private static String removeCRLFCharacters(String str) {
        if (str != null) {
            str = str.replace('\n', '_').replace('\r', '_');
        }
        return str;
    }
}
