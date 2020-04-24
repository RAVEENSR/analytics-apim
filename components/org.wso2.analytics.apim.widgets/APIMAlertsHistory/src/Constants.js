/*
 *  Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

const Constants = {
    alertTypeKeys: {
        allAlerts: 'allAlerts',
        unseenSourceIPAddress: 'unseenSourceIPAddress',
        abnormalRequestCount: 'abnormalRequestCount',
        abnormalResponseTime: 'abnormalResponseTime',
        tierCrossing: 'tierCrossing',
        abnormalBackendTime: 'abnormalBackendTime',
        healthAvailability: 'healthAvailability',
        abnormalResourceAccessPattern: 'abnormalResourceAccessPattern',
    },
    alertTypes: {
        allAlerts: 'All Alerts',
        unseenSourceIPAddress: 'Unseen Source IP Address',
        abnormalRequestCount: 'Abnormal Request Count',
        abnormalResponseTime: 'Abnormal Response Time',
        tierCrossing: 'Tier Crossing',
        abnormalBackendTime: 'Abnormal Backend Time',
        healthAvailability: 'Health Availability',
        abnormalResourceAccessPattern: 'Abnormal Resource Access Pattern',
    },
    alertTypeNamesMapping: {
        UnusualIPAccess: 'Unseen Source IP Address',
        AbnormalRequestsPerMin: 'Abnormal Request Count',
        AbnormalResponseTime: 'Abnormal Response Time',
        FrequentTierLimitHitting: 'Tier Crossing',
        AbnormalBackendTime: 'Abnormal Backend Time',
        ApiHealthMonitor: 'Health Availability',
        AbnormalRequestPattern: 'Abnormal Resource Access Pattern',
    },
    queryNames: {
        allAlerts: 'queryApimAllAlert',
        unseenSourceIPAddress: 'queryApimIPAccessAbnormalityAlert',
        abnormalRequestCount: 'queryApimAbnormalReqAlert',
        abnormalResponseTime: 'queryApimAbnormalResponseTimeAlert',
        tierCrossing: 'queryApimTierLimitHittingAlert',
        abnormalBackendTime: 'queryApimAbnormalBackendTimeAlert',
        healthAvailability: 'queryApimApiHealthMonitorAlert',
        abnormalResourceAccessPattern: 'queryApimRequestPatternChangedAlert',
    },
    queryNamesForSelectAll: {
        allAlerts: 'queryApimAllAlertAll',
        unseenSourceIPAddress: 'queryApimIPAccessAbnormalityAlertAll',
        abnormalRequestCount: 'queryApimAbnormalReqAlertAll',
        abnormalResponseTime: 'queryApimAbnormalResponseTimeAlertAll',
        tierCrossing: 'queryApimTierLimitHittingAlertAll',
        abnormalBackendTime: 'queryApimAbnormalBackendTimeAlertAll',
        healthAvailability: 'queryApimApiHealthMonitorAlertAll',
        abnormalResourceAccessPattern: 'queryApimRequestPatternChangedAlertAll',
    },
    alertMessageFieldsForAlertType: {
        unseenSourceIPAddress: ['ip', 'applicationName', 'applicationOwner', 'userId'],
        abnormalRequestCount: ['applicationName', 'applicationOwner', 'api', 'apiVersion'],
        abnormalResponseTime: ['api', 'apiVersion', 'apiPublisher', 'resourceTemplate', 'method'],
        tierCrossing: ['subscriber', 'apiPublisher', 'api', 'applicationId', 'applicationName'],
        abnormalBackendTime: ['api', 'apiVersion', 'apiPublisher', 'resourceTemplate', 'method'],
        healthAvailability: ['api', 'apiVersion', 'apiPublisher'],
        abnormalResourceAccessPattern: ['userId', 'applicationName', 'applicationOwner'],
    },
    alertMessageFieldNames: {
        userId: 'User ID',
        applicationName: 'Application Name',
        applicationOwner: 'Application Owner',
        applicationId: 'Application ID',
        apiVersion: 'API Version',
        ip: 'IP',
        api: 'API',
        apiPublisher: 'API Publisher',
        resourceTemplate: 'Resource Template',
        method: 'Method',
        backendTime: 'Backend Time',
        requestPerMin: 'Request Per Min',
        reason: 'Reason',
        scope: 'Scope',
        consumerKey: 'Consumer Key',
        subscriber: 'Subscribe',
    },
    alertsHistoryTableColumnNames: ['Timestamp', 'Type', 'Message', 'Severity'],
    alertsHistoryTableSortColumns: ['Timestamp', 'Type', 'Severity'],
    filterTableColumnNames: ['Filter column', 'Filter By', ''],
    queryParamKey: 'apim-alerts',
    timestamp: 'timestamp',
    type: 'type',
    severity: 'severity',
    message: 'message',
    messageSummary: 'messageSummary',
    alertTypeCandidates: ['abnormal backend time', 'abnormal request count', 'abnormal resource access pattern', 'abnormal response time', 'health availability', 'tier crossing', 'unseen source ip address'],
    alertSeverityCandidates: ['mild', 'moderate', 'severe'],
    sortAscending: 'asc',
    sortDescending: 'desc',
    alertsHistoryHeaderWidthSpec: {Timestamp: 155, Type: 210},
    alertsHistoryHeaderMinWidthSpec: {Timestamp: 0.15, Type: 0.15},
    alertsTableSelectedRowsPerPageIndex: 1,
    tooltipForAddFilter: {
        timestamp: 'tooltip.filter.timestamp',
        type: 'tooltip.filter.type',
        message: 'tooltip.filter.message',
        severity: 'tooltip.filter.severity',
    },
    defaultTooltipForAddFilter: {
        timestamp: 'Filter by alert timestamp. Timestamp is provided in the format \'Year-Month-Date Time\'. The month is in MLA style (ex: Jan,Feb,..Dec), date is in 2 digit format (ex: 02, 23) and time is in 12 hour format in 2 digits (ex: 03:52:49 PM). For example: 2018-Nov-05 03:52:49 PM.',
        type: 'Filter by alert type using either one of the following values; Abnormal Backend Time, Abnormal Request Count, Abnormal Resource Access Pattern, Abnormal Response Time, Health Availability, Tier Crossing or Unseen Source IP Address.',
        message: 'Filter by alert message content.',
        severity: 'Filter by alert severity using either one of the following values; Mild, Moderate or Severe.',
    },
    tablePaginationRowsPerPageOptions: [5, 10, 25, 50, 100],
    numberOfSeverityLevels: 3,
    custom: 'custom',
    all:'all',
    dateRanges: ['1mn', '15mn', '1h', '1d', '1w', '2w', '1mo', '3mo', '6mo', '1y'],
    lowGranularityOptions: ['1mn', '15mn', '1h', '1d', '1w', '2w'],
    highGranularityOptions: ['2w', '1mo', '3mo', '6mo', '1y']
};

export default Constants;
