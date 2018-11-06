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
    alertTypeKeys : {
        allAlerts:'allAlerts',
        unseenSourceIPAddress: 'unseenSourceIPAddress',
        abnormalRequestCount: 'abnormalRequestCount',
        abnormalResponseTime:'abnormalResponseTime',
        tierCrossing: 'tierCrossing',
        abnormalBackendTime: 'abnormalBackendTime',
        healthAvailability:'healthAvailability',
        abnormalResourceAccessPattern: 'abnormalResourceAccessPattern'
    },
    alertTypes : {
        allAlerts:'All Alerts',
        unseenSourceIPAddress: 'Unseen Source IP Address',
        abnormalRequestCount: 'Abnormal Request Count',
        abnormalResponseTime:'Abnormal Response Time',
        tierCrossing: 'Tier Crossing',
        abnormalBackendTime: 'Abnormal Backend Time',
        healthAvailability:'Health Availability',
        abnormalResourceAccessPattern: 'Abnormal Resource Access Pattern'
    },
    alertTypeNamesMapping : {
        UnusualIPAccess: 'Unseen Source IP Address',
        AbnormalRequestsPerMin: 'Abnormal Request Count',
        AbnormalResponseTime:'Abnormal Response Time',
        FrequentTierLimitHitting: 'Tier Crossing',
        AbnormalBackendTime: 'Abnormal Backend Time',
        ApiHealthMonitor:'Health Availability',
        AbnormalRequestPattern: 'Abnormal Resource Access Pattern'
    },
    queryNames : {
        allAlerts:'queryApimAllAlert',
        unseenSourceIPAddress: 'queryApimIPAccessAbnormalityAlert',
        abnormalRequestCount: 'queryApimAbnormalReqAlert',
        abnormalResponseTime:'queryApimAbnormalResponseTimeAlert',
        tierCrossing: 'queryApimTierLimitHittingAlert',
        abnormalBackendTime: 'queryApimAbnormalBackendTimeAlert',
        healthAvailability:'queryApimApiHealthMonitorAlert',
        abnormalResourceAccessPattern: 'queryApimRequestPatternChangedAlert'
    },
    tableColumnIndices : {
        allAlerts: [4,0,2,3],
        unseenSourceIPAddress: 'queryApimIPAccessAbnormalityAlert',
        abnormalRequestCount: 'queryApimAbnormalReqAlert',
        abnormalResponseTime:'queryApimAbnormalResponseTimeAlert',
        tierCrossing: 'queryApimTierLimitHittingAlert',
        abnormalBackendTime: 'queryApimAbnormalBackendTimeAlert',
        healthAvailability:'queryApimApiHealthMonitorAlert',
        abnormalResourceAccessPattern: 'queryApimRequestPatternChangedAlert'
    },
    alertMessageFieldsForAlertType: {
        unseenSourceIPAddress: ['ip', 'applicationName', 'applicationOwner', 'userId'],
        abnormalRequestCount: ['applicationName', 'applicationOwner', 'api', 'apiVersion'],
        abnormalResponseTime:['api', 'apiVersion', 'apiPublisher', 'resourceTemplate', 'method'],
        tierCrossing: ['subscriber', 'apiPublisher', 'api', 'applicationId', 'applicationName'],
        abnormalBackendTime: ['api', 'apiVersion', 'apiPublisher', 'resourceTemplate', 'method'],
        healthAvailability:['api', 'apiVersion', 'apiPublisher'],
        abnormalResourceAccessPattern: ['userId', 'applicationName', 'applicationOwner']
    },
    alertMessageFieldNames: {
        userId: 'User ID',
        applicationName: 'Application Name',
        applicationOwner:'Application Owner',
        applicationId: 'Application ID',
        apiVersion: 'API Version',
        ip:'IP',
        api: 'API',
        apiPublisher: 'API Publisher',
        resourceTemplate: 'Resource Template',
        method:'Method',
        backendTime: 'Backend Time',
        requestPerMin: 'Request Per Min',
        reason:'Reason',
        scope: 'Scope',
        consumerKey: 'Consumer Key',
        subscriber: 'Subscribe'
    },
    alertsHistoryTableColumnNames: ['Timestamp', 'Type', 'Message', 'Severity'],
    filterTableColumnNames: ['Filter column', 'Filter By',''],
    queryParamKey: 'alerts',
    message:'message',
    severity: 'severity'
};

export default Constants;