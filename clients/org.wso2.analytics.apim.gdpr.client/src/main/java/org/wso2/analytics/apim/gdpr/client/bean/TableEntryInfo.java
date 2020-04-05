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
package org.wso2.analytics.apim.gdpr.client.bean;

import org.wso2.analytics.apim.gdpr.client.GDPRClientConstants;
import org.wso2.carbon.config.annotation.Element;

/**
 * Table entry configurations.
 */
public class TableEntryInfo {

    @Element(description = "Table name", required = true)
    private String tableName;

    @Element(description = "Column name which includes either the username or the email", required = true)
    private String columnName;

    @Element(description = "Is the super tenant's username includes the tenant domain", required = true)
    private boolean isSuperTenantUsernameHasTenantDomain = false;

    @Element(description = "Is the other tenant's username includes the tenant domain", required = true)
    private boolean isOtherTenantUsernameHasTenantDomain = true;

    @Element(description = "Type of the column", required = true)
    private GDPRClientConstants.ColumnTypes columnType = GDPRClientConstants.ColumnTypes.TEXT;

    @Element(description = "Column name which includes the username associated to IP address")
    private String ipUsernameColumnName;

    @Element(description = "Is the column needs a text replace")
    private boolean isTextReplace = false;

    @Element(description = "Text which needs to be append before the replacing text in sql LIKE clause")
    private String preReplaceText;

    @Element(description = "Text which needs to be append after the replacing text in sql LIKE clause")
    private String postReplaceText;

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public String getColumnName() {
        return columnName;
    }

    public void setColumnName(String columnName) {
        this.columnName = columnName;
    }

    public boolean isSuperTenantUsernameHasTenantDomain() {
        return isSuperTenantUsernameHasTenantDomain;
    }

    public void setSuperTenantUsernameHasTenantDomain(boolean superTenantUsernameHasTenantDomain) {
        isSuperTenantUsernameHasTenantDomain = superTenantUsernameHasTenantDomain;
    }

    public boolean isOtherTenantUsernameHasTenantDomain() {
        return isOtherTenantUsernameHasTenantDomain;
    }

    public void setOtherTenantUsernameHasTenantDomain(boolean otherTenantUsernameHasTenantDomain) {
        this.isOtherTenantUsernameHasTenantDomain = otherTenantUsernameHasTenantDomain;
    }

    public GDPRClientConstants.ColumnTypes getColumnType() {
        return columnType;
    }

    public void setColumnType(GDPRClientConstants.ColumnTypes columnType) {
        this.columnType = columnType;
    }

    public String getIpUsernameColumnName() {
        return ipUsernameColumnName;
    }

    public void setIpUsernameColumnName(String ipUsernameColumnName) {
        this.ipUsernameColumnName = ipUsernameColumnName;
    }

    public boolean isTextReplace() {
        return isTextReplace;
    }

    public void setTextReplace(boolean textReplace) {
        isTextReplace = textReplace;
    }

    public String getPreReplaceText() {
        return preReplaceText;
    }

    public void setPreReplaceText(String preReplaceText) {
        this.preReplaceText = preReplaceText;
    }

    public String getPostReplaceText() {
        return postReplaceText;
    }

    public void setPostReplaceText(String postReplaceText) {
        this.postReplaceText = postReplaceText;
    }

    @Override
    public String toString() {
        return "TableEntryInfo{" +
                "tableName='" + tableName + '\'' +
                ", columnName='" + columnName + '\'' +
                ", isSuperTenantUsernameHasTenantDomain=" + isSuperTenantUsernameHasTenantDomain +
                ", isOtherTenantUsernameHasTenantDomain=" + isOtherTenantUsernameHasTenantDomain +
                ", columnType=" + columnType +
                ", ipUsernameColumnName='" + ipUsernameColumnName + '\'' +
                ", isTextReplace=" + isTextReplace +
                ", preReplaceText='" + preReplaceText + '\'' +
                ", postReplaceText='" + postReplaceText + '\'' +
                '}';
    }
}
