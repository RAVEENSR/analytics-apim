/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package org.wso2.analytics.apim.gdpr.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wso2.analytics.apim.gdpr.client.bean.DatabaseInfo;
import org.wso2.analytics.apim.gdpr.client.bean.GDPRClientConfiguration;
import org.wso2.analytics.apim.gdpr.client.bean.TableEntryInfo;
import org.wso2.analytics.apim.gdpr.client.exceptions.GDPRClientException;
import org.wso2.analytics.apim.gdpr.client.internal.dao.ClientDAO;
import org.wso2.carbon.config.ConfigProviderFactory;
import org.wso2.carbon.config.ConfigurationException;
import org.wso2.carbon.config.provider.ConfigProvider;
import org.wso2.carbon.database.query.manager.config.Queries;
import org.wso2.carbon.datasource.core.DataSourceManager;
import org.wso2.carbon.datasource.core.api.DataSourceService;
import org.wso2.carbon.datasource.core.beans.DataSourceMetadata;
import org.wso2.carbon.datasource.core.beans.DataSourcesConfiguration;
import org.wso2.carbon.datasource.core.exception.DataSourceException;
import org.wso2.carbon.datasource.core.impl.DataSourceServiceImpl;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.AT;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.CONF_FOLDER;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.FILE_NAME;
import static org.wso2.analytics.apim.gdpr.client.GDPRClientConstants.SUPER_TENANT_DOMAIN;

/**
 * Main class for APIM GDPR client.
 */
public class Pseudonymizor {

    private static final Logger LOG = LoggerFactory.getLogger(Pseudonymizor.class);


    public static void main(String[] args) {
        Path deploymentConfigPath = Paths.get(CONF_FOLDER, FILE_NAME);

        try {
            ConfigProvider configProvider = ConfigProviderFactory.getConfigProvider(deploymentConfigPath);
            GDPRClientConfiguration gdprClientConfiguration = configProvider
                    .getConfigurationObject(GDPRClientConfiguration.class);
            // TODO: Add null and empty checks for required fields read as command line arguments
            String username = gdprClientConfiguration.getUsername();
            String pseudonym = gdprClientConfiguration.getPseudonym();
            String tenantDomain = gdprClientConfiguration.getTenantDomain();
            String userEmail = gdprClientConfiguration.getUserEmail();
            String userIP = gdprClientConfiguration.getUserIP(); //TODO: this is a mandatory field
            boolean isUserInSuperTenantDomain = tenantDomain.equalsIgnoreCase(SUPER_TENANT_DOMAIN);
            String usernameWithTenantDomain = username.concat(AT).concat(tenantDomain);
            String pseudonymWithTenantDomain = pseudonym.concat(AT).concat(tenantDomain);
            DataSourcesConfiguration dataSourcesConfiguration
                    = configProvider.getConfigurationObject(DataSourcesConfiguration.class);
            List<DataSourceMetadata> dataSources = dataSourcesConfiguration.getDataSources();

            DataSourceManager dataSourceManager = DataSourceManager.getInstance();
            DataSourceService dataSourceService = new DataSourceServiceImpl();

            // load and initialize the data sources defined in configuration file
            dataSourceManager.initDataSources(configProvider);

            List<Queries> deploymentQueries = gdprClientConfiguration.getQueries();
            List<DatabaseInfo> databaseInfo = gdprClientConfiguration.getDatabases();

            for (DataSourceMetadata dataSource : dataSources) {
                String databaseName = dataSource.getName();
                ClientDAO clientDAO = new ClientDAO(dataSourceService, databaseName, deploymentQueries);
                clientDAO.init();

                for (DatabaseInfo databaseEntry: databaseInfo) {
                    if (databaseEntry.getDatabaseName().equalsIgnoreCase(databaseName)) {
                        List<TableEntryInfo> tableEntryInfo = databaseEntry.getTableEntries();
                        for (TableEntryInfo tableEntry : tableEntryInfo) {
                            String tableName = tableEntry.getTableName();
                            boolean isTableExists = clientDAO.checkTableExists(tableName);
                            if (!isTableExists) {
                                LOG.warn("Table {} does not exists in the database {}.", tableName, databaseName);
                                continue;
                            }
                            // TODO: check for null or empty for the required fields
                            String columnName = tableEntry.getColumnName();
//                            boolean isEmailColumn = tableEntry.isEmailColumn();
//                            boolean isIPColumn = tableEntry.isIPColumn();
                            boolean isEmailColumn = false;
                            boolean isIPColumn = false;
                            boolean isTextReplace = tableEntry.isTextReplace();
                            GDPRClientConstants.ColumnTypes columnType = tableEntry.getColumnType();

                            if (columnType == GDPRClientConstants.ColumnTypes.EMAIL) {
                                isEmailColumn = true;
                            } else if (columnType == GDPRClientConstants.ColumnTypes.IP) {
                                isIPColumn = true;
                            }

                            if (!isEmailColumn && !isIPColumn) {
                                boolean isSuperTenantUsernameHasTenantDomain
                                        = tableEntry.isSuperTenantUsernameHasTenantDomain();
                                boolean isOtherTenantUsernameHasTenantDomain
                                        = tableEntry.isOtherTenantUsernameHasTenantDomain();

                                if (!isTextReplace) {
                                    /*
                                     * Scenario 1:
                                     * User is in the super tenant space. Super tenant's username is saved with the
                                     * tenant domain.
                                     * ex: admin@carbon.super, usera@carbon.super
                                     * */
                                    if (isUserInSuperTenantDomain && isSuperTenantUsernameHasTenantDomain) {
                                        clientDAO.updateTableEntry(tableName, columnName, usernameWithTenantDomain,
                                                pseudonymWithTenantDomain);
                                        continue;
                                    }

                                    /*
                                     * Scenario 2:
                                     * User is in the super tenant space. Super tenant's username is saved without the
                                     * tenant domain.
                                     * ex: admin, usera
                                     *
                                     * if clause => isUserInSuperTenantDomain && !isSuperTenantUsernameHasTenantDomain
                                     * TODO: Include full if clause with each if scenario
                                     * */
                                    if (isUserInSuperTenantDomain) {
                                        clientDAO.updateTableEntry(tableName, columnName, username, pseudonym);
                                        continue;
                                    }

                                    /*
                                     * Scenario 3:
                                     * User is not in the super tenant space(is in some other tenant). Other tenant's
                                     * username is saved with the tenant domain.
                                     * ex: admin@abc.com, usera@abc.com
                                     *
                                     * if clause => !isUserInSuperTenantDomain && isOtherTenantUsernameHasTenantDomain
                                     * */
                                    if (isOtherTenantUsernameHasTenantDomain) {
                                        clientDAO.updateTableEntry(tableName, columnName, usernameWithTenantDomain,
                                                pseudonymWithTenantDomain);
                                        continue;
                                    }

                                    throw new GDPRClientException("Could not find a relevant update query for table " +
                                            "entry: [" + tableEntry.toString() + "] in database: " + databaseName
                                            + ".");
                                }

                                String preReplaceText = tableEntry.getPreReplaceText();
                                String postReplaceText = tableEntry.getPostReplaceText();

                                /*
                                 * Scenario 4:
                                 * User is in the super tenant space. Super tenant's username is saved with the
                                 * tenant domain(ex: admin@carbon.super, usera@carbon.super) with other text in the same
                                 * field.
                                 * ex: In APIMALLALERT table username is saved like this in the message field ->
                                 * "User admin@carbon.super frequently crosses the limit set."
                                 * */
                                if (isUserInSuperTenantDomain && isSuperTenantUsernameHasTenantDomain) {
                                    clientDAO.performStringReplaceAndUpdateTableEntry(tableName, columnName,
                                            usernameWithTenantDomain, pseudonymWithTenantDomain, preReplaceText,
                                            postReplaceText);
                                    continue;
                                }

                                /*
                                 * Scenario 5:
                                 * User is in the super tenant space. Super tenant's username is saved without the
                                 * tenant domain. TODO: Do we need this?
                                 * ex: admin, usera
                                 *
                                 * if clause => isUserInSuperTenantDomain && !isSuperTenantUsernameHasTenantDomain
                                 * */
                                if (isUserInSuperTenantDomain) {
                                    clientDAO.performStringReplaceAndUpdateTableEntry(
                                            tableName, columnName, username, pseudonym, preReplaceText,
                                            postReplaceText);
                                    continue;
                                }

                                /*
                                 * Scenario 6:
                                 * User is not in the super tenant space(is in some other tenant). Other tenant's
                                 * username is saved with the tenant domain.
                                 * ex: admin@abc.com, usera@abc.com //TODO 4 and 6 can be combined?
                                 *
                                 * if clause => !isUserInSuperTenantDomain && isOtherTenantUsernameHasTenantDomain
                                 * */
                                if (isOtherTenantUsernameHasTenantDomain) {
                                    clientDAO.performStringReplaceAndUpdateTableEntry(
                                            tableName, columnName, usernameWithTenantDomain, pseudonymWithTenantDomain,
                                            preReplaceText, postReplaceText);
                                    continue;
                                }

                                throw new GDPRClientException("Could not find a relevant update query for table " +
                                        "entry: [" + tableEntry.toString() + "] in database: " + databaseName + ".");
                            }

                            if (!isIPColumn) {
                                /*
                                 * Scenario 7:
                                 * Replace the email stored in the emails field.
                                 * ex: In APIMALERTSTAKEHOLDERINFO table emails are stored like this ->
                                 * "user1@abc.com, user2@abc.com, user3@abc.com". In here we need to do perform a
                                 * string replace to replace the email value with the pseudonym value.
                                 * */
                                if (isTextReplace) {
                                    // skip update query for email entries if user email is not provided
                                    if (userEmail == null || userEmail.isEmpty()) {
                                        continue;
                                    }
                                    String preReplaceText = tableEntry.getPreReplaceText();
                                    String postReplaceText = tableEntry.getPostReplaceText();
                                    // perform string replace to replace user email value
                                    clientDAO.performStringReplaceAndUpdateTableEntry(
                                            tableName, columnName, userEmail, pseudonym, preReplaceText,
                                            postReplaceText);
                                    continue;
                                }

                                /*
                                 * Scenario 8:
                                 * Replace the email stored in the email field. In this scenario only one email entry is
                                 * stored.(unlike multiple emails in the same field in scenario 7)
                                 *
                                 * if clause => isEmailColumn && !isTextReplace
                                 * */
                                // TODO: is this useful. Is this ever used?
                                // skip update query for email entries if user email is not provided
                                if (userEmail == null || userEmail.isEmpty()) {
                                    continue;
                                }
                                clientDAO.updateTableEntry(tableName, columnName, userEmail, pseudonym);
                            }

                            /*
                             * Scenario 9:
                             * Replace the ip address stored in a message field.
                             * ex: In APIMALLALERT table, ip address is stored like this ->
                             * "A request from a old IP (127.0.0.1) detected by user:john@abc.com using
                             * application:DefaultApplication owned by john@abc.com.". In here we need to do perform a
                             * string replace to replace the ip address with the pseudonym value.
                             * */
                            if (isTextReplace) {
                                String preReplaceText = tableEntry.getPreReplaceText();
                                String postReplaceText = tableEntry.getPostReplaceText();
                                // perform string replace to replace user ip address
                                clientDAO.performStringReplaceAndUpdateTableEntry(
                                        tableName, columnName, userIP, pseudonym, preReplaceText, postReplaceText);
                                continue;
                            }

                            /*
                             * Scenario 10:
                             * Replace the ip address stored in a ip address field. In this scenario only one ip address
                             * entry is stored.(unlike within a message with other texts in scenario 9) In this scenario
                             * username associated to the IP also replaced with the pseudonym value.
                             *
                             * if clause => !isTextReplace
                             * */
                            // TODO: Do I need to replace ip address with pseudonym or with generated UUID
                            String ipUsernameColumnName = tableEntry.getIpUsernameColumnName();
                            clientDAO.updateIPAndUsernameInTableEntry(tableName, columnName, ipUsernameColumnName,
                                    userIP, usernameWithTenantDomain, pseudonym, pseudonymWithTenantDomain);
                        }
                        break;
                    }
                }
            }
        } catch (ConfigurationException e) {
            LOG.error("Error in getting configuration", e);
        } catch (DataSourceException e) {
            LOG.error("Error occurred while initialising data sources.", e);
        } catch (GDPRClientException e) {
            LOG.error("Error occurred while updating the table entries.", e);
        }
    }
}
