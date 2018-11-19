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
 *
 */

import React from 'react';
import Widget from '@wso2-dashboards/widget';
import CustomTable from './CustomTable';
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Moment from "moment";
import {Scrollbars} from 'react-custom-scrollbars';
import {defineMessages, IntlProvider, FormattedMessage} from 'react-intl';
import Constants from './Constants';
import localeJSON from './resources/locale.json';
import DateRangePicker from './DateRangePicker';
import AlertsFilter from './AlertsFilter';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark'
    }
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light'
    }
});

/**
 * Language.
 * @type {string}
 */
const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

/**
 * Language without region code.
 */
const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

class APIMAlertsHistory extends Widget {
    constructor(props) {
        super(props);

        this.state = {
            localeMessages: {},
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            options: this.props.configs.options,
            rows: [],
            filteredRows: [],
            filterValues: {},
            alertType: '',
            timeTo: null,
            timeFrom: null,
            openFilterConfig: false,
            filterConfigAnchorEl: null,
            newFilterErrorText: '',
            invalidFilter: false,
            dataProviderConf: null,
            selectedTimeRange: '',
            syncTimeRange: false
        };
        this.alertTableNoDataMessage = 'No alerts history available';
        this.initFilterValues = {};

        this.props.glContainer.on('resize', () =>
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height
            })
        );

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.initAlertsHistoryTable = this.initAlertsHistoryTable.bind(this);
        this.getSeverityLevel = this.getSeverityLevel.bind(this);
        this.getAlertTypeSelector = this.getAlertTypeSelector.bind(this);
        this.capitalizeCaseFirstChar = this.capitalizeCaseFirstChar.bind(this);
        this.filterDataUsingAllFilters = this.filterDataUsingAllFilters.bind(this);
        this.handleRequestSort = this.handleRequestSort.bind(this);
        this.onChangeTime = this.onChangeTime.bind(this);
        this.onClickSelectAll = this.onClickSelectAll.bind(this);
        this.retrieveAlertsHistory = this.retrieveAlertsHistory.bind(this);
        this.retrieveAllAlertsHistory = this.retrieveAllAlertsHistory.bind(this);
        this.getTimeRangeFromQueryParam = this.getTimeRangeFromQueryParam.bind(this);
        this.onChangeSyncTimeRange = this.onChangeSyncTimeRange.bind(this);
        this.onDeleteAllFilters = this.onDeleteAllFilters.bind(this);
        this.onAddOrDeleteFilter = this.onAddOrDeleteFilter.bind(this);
        this.getFilterValuesFromQueryParam = this.getFilterValuesFromQueryParam.bind(this);
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    /**
     * Initialize i18n.
     */
    componentWillMount() {
        const locale = (languageWithoutRegionCode || language || 'en');

        this.setState({localeMessages: defineMessages(localeJSON[locale]) || {}});
        this.initFilterValues = this.getFilterValuesFromQueryParam();
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.setState({
                    dataProviderConf: message.data.configs.providerConfig
                }, () => {
                    this.initAlertsHistoryTable()
                });
            })
            .catch(() => {
                this.setState({
                    faultyProviderConf: true,
                });
            });
    };

    /**
     * onChangeTime handles change in selected time range
     * */
    onChangeTime(selectedTimeRange, timeFrom, timeTo) {
        this.alertTableNoDataMessage = 'Loading alerts history';
        const {syncTimeRange, filteredRows} = this.state;
        this.setState({
            timeFrom,
            timeTo,
            selectedTimeRange,
            //if sync is enabled for lower time periods, emptying filtered rows will cause a flicker when
            // emptying and loading new information, to avoid this empty filtered rows aren't emptied in sync mode
            filteredRows: syncTimeRange ? filteredRows : []
        }, this.retrieveAlertsHistory);
        this.updateQueryParams(null, null, selectedTimeRange, timeFrom, timeTo, syncTimeRange);

    }

    /**
     * onClickSelectAll handles change in selected time range
     * */
    onClickSelectAll() {
        this.alertTableNoDataMessage = 'Loading alerts history';
        const {all} = Constants;

        this.setState({
            selectedTimeRange: all,
            filteredRows: []
        }, this.retrieveAlertsHistory);
        this.updateQueryParams(all, null, null, null, null, null);

    }

    /**
     * initAlertsHistoryTable handle initial load of alerts history after receiving provider config
     * */
    initAlertsHistoryTable() {
        this.alertTableNoDataMessage = 'Loading alerts history';
        const queryParam = this.getQueryParams();

        this.setState({
            alertType: queryParam.alertType,
            filterValues: queryParam.filterValues,
        }, this.retrieveAlertsHistory);
        this.updateQueryParams(queryParam.alertType, queryParam.filterValues, null, null, null, null);
    }

    /**
     * retrieveAlertsHistory retrieve alerts history
     * */
    retrieveAlertsHistory() {
        if (this.state.selectedTimeRange === Constants.all) {
            this.retrieveAllAlertsHistory();
        } else {
            this.retrieveAlertsHistoryForTimeRange();
        }
    }

    /**
     * retrieveAlertsHistory retrieve alerts history for given time range
     * */
    retrieveAlertsHistoryForTimeRange() {
        const {timeFrom, timeTo, dataProviderConf, alertType} = this.state;
        const {queryNames} = Constants;

        if (dataProviderConf) {
            let query = dataProviderConf.configs.config.queryData[queryNames[alertType]];
            query = query
                .replace("{{timeFrom}}", timeFrom)
                .replace("{{timeTo}}", timeTo);
            dataProviderConf.configs.config.queryData.query = query;
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, dataProviderConf);
        }
    }


    /**
     * retrieveAllAlertsHistory handles selection of 'all' option in time range
     * */
    retrieveAllAlertsHistory() {
        const {dataProviderConf, alertType} = this.state;
        const {queryNamesForSelectAll} = Constants;

        if (dataProviderConf) {
            dataProviderConf.configs.config.queryData.query = dataProviderConf.configs
                .config.queryData[queryNamesForSelectAll[alertType]];
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, dataProviderConf);
        }
    }

    /**
     * getQueryParams checks whether query params are available specifying alert type and filters
     * */
    getQueryParams() {
        const {queryParamKey, alertTypes, alertTypeKeys} = Constants;
        const queryParams = super.getGlobalState(queryParamKey);
        let alertType = alertTypeKeys.allAlerts;

        if (queryParams.type) {
            if (alertTypes[queryParams.type]) {
                alertType = alertTypeKeys[queryParams.type];
            }
        }
        return {
            alertType,
            filterValues: this.getFilterValuesFromQueryParam()
        };
    }

    /**
     * getTimeRangeFromQueryParam returns time range information in query params
     * */
    getTimeRangeFromQueryParam() {
        const {queryParamKey, dateRanges, custom, all} = Constants;
        const queryParams = super.getGlobalState(queryParamKey);
        let result = {};

        if (queryParams.range) {
            if (queryParams.range.toLowerCase() === custom && queryParams.from && queryParams.to) {
                result = {range: queryParams.range, from: queryParams.from, to: queryParams.to, sync: false};
            } else if (dateRanges.indexOf(queryParams.range) !== -1 || queryParams.range.toLowerCase() === all) {
                if (queryParams.sync !== undefined) {
                    result = {
                        range: queryParams.range,
                        sync: queryParams.sync
                    };
                } else {
                    result = {range: queryParams.range, sync: false};
                }
            }
        }
        return result;
    }

    /**
     * getFilterValuesFromQueryParam get filter values in  query params
     * */
    getFilterValuesFromQueryParam() {
        const {queryParamKey, alertsHistoryTableColumnNames} = Constants;
        const queryParams = super.getGlobalState(queryParamKey);
        let filterValues = {};

        if (queryParams.filters) {
            let filters = queryParams.filters;
            Object.keys(filters).forEach(column => {
                const columnName = this.capitalizeCaseFirstChar(column);
                if (alertsHistoryTableColumnNames.indexOf(columnName) !== -1) {
                    filterValues[column] = filters[column];
                }
            });
        }
        return filterValues;
    }

    /**
     * onChangeSyncTimeRange handle change in time range auto sync
     * */
    onChangeSyncTimeRange(syncTimeRange) {
        this.setState({syncTimeRange});
        this.updateQueryParams(null, null, this.state.selectedTimeRange, null, null, syncTimeRange);

    }

    /**
     * capitalizeCaseFirstChar capitalise the first character of a given string
     * */
    capitalizeCaseFirstChar(str) {
        let result = '';

        if (str) {
            result = str.charAt(0).toUpperCase() + str.slice(1);
        }
        return result;
    }

    /**
     * handleDataReceived loads data retrieved to alerts history table
     * */
    handleDataReceived(message) {
        const {alertTypeKeys, alertTypes, alertTypeNamesMapping, numberOfSeverityLevels} = Constants;
        const {alertType, filterValues} = this.state;

        if (message.data) {
            const results = [];
            if (alertType === alertTypeKeys.allAlerts) {
                message.data.forEach(dataUnit => {
                    const row = {};
                    row.timestamp = dataUnit[0];
                    row.type = alertTypeNamesMapping[dataUnit[1]];
                    row.message = dataUnit[3];
                    // in alerts table severity 1 = severe and 3 = mild. when sorting in the table, asc order should
                    // be mild-sever. To support this, the severity level indicators are flipped so as to assign
                    // 1 = mild and 3 = severe
                    row.severity = numberOfSeverityLevels - (dataUnit[2] - 1);
                    results.push(row);
                });
            } else {
                message.data.forEach(dataUnit => {
                    const row = {};
                    row.timestamp = dataUnit[0];
                    row.type = alertTypes[alertType];
                    row.message = dataUnit.splice(3);
                    row.messageSummary = dataUnit[2];
                    // in alerts table severity 1 = severe and 3 = mild. when sorting in the table, asc order should
                    // be mild-sever. To support this, the severity level indicators are flipped so as to assign
                    // 1 = mild and 3 = severe
                    row.severity = numberOfSeverityLevels - (dataUnit[1] - 1);
                    results.push(row);
                });
            }
            this.alertTableNoDataMessage = 'No alerts history available';
            this.setState({
                rows: results,
                filteredRows: this.createFilteredAlertHistoryTableData(results, filterValues),
            });
        }
    }

    /**
     * createTableDataForAllAlerts loads data to alerts history table for alert type 'All alerts'
     * */
    createTableDataForAllAlerts(data) {
        let results = [];

        data.forEach(dataUnit => {
            results.push([Moment(dataUnit.timestamp).format('YYYY-MMM-DD hh:mm:ss A'),
                dataUnit.type, dataUnit.message, this.getSeverityLevel(dataUnit.severity)])
        });
        return results;
    }

    /**
     * createTableDataForSpecificAlerts loads data to alerts history table for alert type other than 'All alerts'
     * */
    createTableDataForSpecificAlerts(alertType, data) {
        const {alertMessageFieldsForAlertType} = Constants;
        let results = [];

        data.forEach(dataUnit => {
            const message = this.createAlertMessageElementsForAlerts(this.createAlertMessageKeyValuePairs(
                alertMessageFieldsForAlertType[alertType], dataUnit.message), dataUnit.messageSummary);
            results.push([Moment(dataUnit.timestamp).format('YYYY-MMM-DD hh:mm:ss A'), dataUnit.type,
                message, this.getSeverityLevel(dataUnit.severity)])
        });
        return results;
    }

    /**
     * getSeverityLevel return alert severity
     * */
    getSeverityLevel(severity) {
        let color = '';
        let text = '';

        switch (severity) {
            case 1:
                color = '#777777';
                text = <FormattedMessage id='severity.level.mild' defaultMessage='Mild'/>;
                break;
            case 2:

                color = '#f0ad4e';
                text = <FormattedMessage id='severity.level.moderate' defaultMessage='Moderate'/>;
                break;
            case 3:
                color = '#d9534f';
                text = <FormattedMessage id='severity.level.severe' defaultMessage='Severe'/>;
                break;
            default:
            //        not reached
        }
        return (
            <span style={{
                fontWeight: 'bold',
                backgroundColor: color,
                borderRadius: '5px',
                padding: '5px',
                verticalAlign: 'center'
            }}>
                {text}
            </span>
        )
    }

    /**
     * createAlertMessageKeyValuePairs creates a key value pairs for the alert details message for alerts types other
     * than 'All alerts'
     * */
    createAlertMessageKeyValuePairs(messageFieldNames, messageFieldValues) {
        let result = {};

        messageFieldNames.forEach((data, index) => {
            result[data] = messageFieldValues[index];
        });
        return result;
    }

    /**
     * createAlertMessageElementsForAlerts creates alert details messagefor alerts types other than 'All alerts'
     * */
    createAlertMessageElementsForAlerts(data, message) {
        const {alertMessageFieldNames} = Constants;
        const userId = data['userId'];
        const applicationName = data['applicationName'];
        const applicationOwner = data['applicationOwner'];
        const applicationId = data['applicationId'];
        const apiVersion = data['apiVersion'];
        const ip = data['ip'];
        const api = data['api'];
        const apiPublisher = data['apiPublisher'];
        const resourceTemplate = data['resourceTemplate'];
        const method = data['method'];
        const subscriber = data['subscriber'];
        let result = [];

        if (userId) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.userId, userId));
        }
        if (applicationName) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.applicationName, applicationName));
        }
        if (applicationOwner) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.applicationOwner, applicationOwner));
        }
        if (applicationId) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.applicationId, applicationId));
        }
        if (apiVersion) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.apiVersion, apiVersion));
        }
        if (ip) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.ip, ip));
        }
        if (api) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.api, api));
        }
        if (apiPublisher) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.apiPublisher, apiPublisher));
        }
        if (resourceTemplate) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.resourceTemplate, resourceTemplate));
        }
        if (method) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.method, method));
        }
        if (subscriber) {
            result.push(this.getAlertMessageElement(alertMessageFieldNames.subscriber, subscriber));
        }
        if (message) {
            result.push(message);
        }
        return (
            <div
                style={{
                    textAlign: 'left',
                    paddingTop: 5
                }}>
                {result.map(el => {
                    return el
                })}
            </div>);
    }

    /**
     * getAlertMessageElement creates a single entry in alert message
     * */
    getAlertMessageElement(elementKey, elementValue) {
        return (
            <div>
                <div
                    style={{
                        paddingTop: 5,
                        paddingBottom: 7
                    }}
                >
                    <span style={{
                        fontWeight: 'bold',
                        backgroundColor: this.props.muiTheme.name === 'dark' ? '#44798E' : '#6699CC',
                        borderRadius: 5,
                        padding: 5,
                        verticalAlign: 'center'
                    }}>
                        {elementKey}
                        </span> {elementValue}
                </div>
            </div>);
    }

    /**
     * handleAlertTypeChange handle change in selected alert type
     * */
    handleAlertTypeChange = event => {
        this.alertTableNoDataMessage = 'Loading alerts history';

        this.setState({
            filteredRows: [],
            alertType: event.target.value
        }, this.fetchAlertData);
        this.updateQueryParams(event.target.value, null, null, null, null, null);

    };

    /**
     * fetchAlertData when alert type is changed fetch data for the specific alert type
     * */
    fetchAlertData() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.retrieveAlertsHistory();
    }

    /**
     * getAlertTypeSelector return the select field used to select alert type
     * */
    getAlertTypeSelector() {
        const {alertTypes, alertTypeKeys} = Constants;

        return (
            <FormControl>
                <InputLabel htmlFor='alert-type'>
                    <FormattedMessage id='alert.type.selector' defaultMessage='Alert Type'/>
                </InputLabel>
                <Select
                    value={this.state.alertType}
                    onChange={this.handleAlertTypeChange}
                    inputProps={{id: 'alert-type',}}
                    style={{width: this.state.width * 0.5 * 0.5}}
                >
                    <MenuItem value={alertTypeKeys.allAlerts}>
                        {alertTypes.allAlerts}
                    </MenuItem>
                    <MenuItem
                        value={alertTypeKeys.abnormalBackendTime}>
                        {alertTypes.abnormalBackendTime}
                    </MenuItem>
                    <MenuItem
                        value={alertTypeKeys.abnormalRequestCount}>
                        {alertTypes.abnormalRequestCount}
                    </MenuItem>
                    <MenuItem
                        value={alertTypeKeys.abnormalResourceAccessPattern}>
                        {alertTypes.abnormalResourceAccessPattern}
                    </MenuItem>
                    <MenuItem
                        value={alertTypeKeys.abnormalResponseTime}>
                        {alertTypes.abnormalResponseTime}
                    </MenuItem>
                    <MenuItem
                        value={alertTypeKeys.healthAvailability}>
                        {alertTypes.healthAvailability}
                    </MenuItem>
                    <MenuItem value={alertTypeKeys.tierCrossing}>
                        {alertTypes.tierCrossing}
                    </MenuItem>
                    <MenuItem
                        value={alertTypeKeys.unseenSourceIPAddress}>
                        {alertTypes.unseenSourceIPAddress}
                    </MenuItem>
                </Select>
            </FormControl>
        );
    }

    /**
     * onDeleteAllFilters handle deletion of all filters
     * */
    onDeleteAllFilters() {
        const {rows} = this.state;

        this.setState({
            filterValues: {},
            filteredRows: this.createAlertHistoryTableData(rows),
        });
        this.updateQueryParams(null, {}, null, null, null, null);

    };

    /**
     * onAddOrDeleteFilter handle additions or deletion of a filter
     * */
    onAddOrDeleteFilter(filterValues) {
        const {rows} = this.state;

        this.setState({
            filterValues,
            filteredRows: this.createFilteredAlertHistoryTableData(rows, filterValues)
        });
        this.updateQueryParams(null, filterValues, null, null, null, null);
    }

    /**
     * createFilteredAlertHistoryTableData creates the filtered data for alerts history table
     * */
    createFilteredAlertHistoryTableData(data, filterValues) {
        return this.createAlertHistoryTableData(this.filterDataUsingAllFilters(data, filterValues));
    }

    /**
     * filterDataUsingAllFilters filter data using given filters
     * */
    filterDataUsingAllFilters(data, filterValues) {
        let filteredRows = data;

        Object.keys(filterValues).forEach(column => {
            filterValues[column].forEach(value => {
                filteredRows = this.filterDataUsingSingleFilter(filteredRows, column, value);
            })
        });
        return filteredRows;
    }

    /**
     * filterDataUsingSingleFilter data using a single filter
     * */
    filterDataUsingSingleFilter(data, filterColumn, filterValue) {
        let filterResults = [];
        const {alertsHistoryTableColumnNames, alertTypeKeys, timestamp, severity, message, messageSummary} = Constants;
        const {alertType} = this.state;

        if (alertsHistoryTableColumnNames.indexOf(this.capitalizeCaseFirstChar(filterColumn)) !== -1) {
            data.forEach(dataUnit => {
                if (alertType !== alertTypeKeys.allAlerts && filterColumn === message) {
                    if (dataUnit[filterColumn].some(dataUnit => dataUnit.toString().toLowerCase().includes(
                        filterValue.toString().toLowerCase()))) {
                        filterResults.push(dataUnit);
                    } else if (dataUnit[messageSummary].toString().toLowerCase().includes(
                        filterValue.toString().toLowerCase())) {
                        filterResults.push(dataUnit);
                    }
                } else if (filterColumn === timestamp) {
                    if (Moment(dataUnit[filterColumn]).format('YYYY-MMM-DD hh:mm:ss A').toLowerCase().includes(
                        filterValue.toString().toLowerCase())) {
                        filterResults.push(dataUnit);
                    }
                } else if (filterColumn === severity) {
                    let severity = '';
                    switch (dataUnit[filterColumn]) {
                        case 1:
                            severity = 'mild';
                            break;
                        case 2:
                            severity = 'moderate';
                            break;
                        case 3:
                            severity = 'severe';
                            break;
                    }
                    if (severity.includes(filterValue.toString().toLowerCase())) {
                        filterResults.push(dataUnit);
                    }
                } else {
                    if (dataUnit[filterColumn].toString().toLowerCase().includes(
                        filterValue.toString().toLowerCase())) {
                        filterResults.push(dataUnit);
                    }
                }
            })
        } else {
            filterResults = data;
        }
        return filterResults;
    }

    /**
     * createAlertHistoryTableData creates data for alerts table history
     * */
    createAlertHistoryTableData(data) {
        const {alertType} = this.state;
        const {alertTypeKeys} = Constants;
        let tableRows = [];

        if (alertType === alertTypeKeys.allAlerts) {
            tableRows = this.createTableDataForAllAlerts(data);
        } else {
            tableRows = this.createTableDataForSpecificAlerts(alertType, data);
        }
        return tableRows;
    }

    /**
     * updateQueryParams updates query param values
     * */
    updateQueryParams(alertType, filterValues, timeRange, timeFrom, timeTo, sync) {
        const {queryParamKey, custom} = Constants;
        let queryParams = super.getGlobalState(queryParamKey);

        if (alertType) {
            queryParams.type = alertType;
        }
        if (filterValues) {
            if (Object.keys(filterValues).length > 0) {
                queryParams.filters = filterValues;
            } else {
                delete queryParams.filters;
            }
        }
        if (timeRange) {
            queryParams.range = timeRange;
            if (timeRange === custom) {
                queryParams.from = Moment(timeFrom).format('YYYY-MMM-DD hh:mm:ss A').toLowerCase();
                queryParams.to = Moment(timeTo).format('YYYY-MMM-DD hh:mm:ss A').toLowerCase();
                delete queryParams.sync;
            } else {
                if (sync !== null) {
                    queryParams.sync = sync;
                }
            }
        }
        super.setGlobalState(queryParamKey, queryParams);
    }

    /**
     * handleRequestSort handle on click of sort in alerts table
     * */
    handleRequestSort(orderBy, order) {
        let {rows, filterValues} = this.state;

        rows = this.filterDataUsingAllFilters(rows, filterValues);
        const filteredRows = this.createAlertHistoryTableData(this.sort(rows, orderBy, order));
        this.setState({rows, filteredRows});
    };


    /**
     * sort data in the specified order of specified column
     * */
    sort(data, column, sortOrder) {
        const {sortAscending} = Constants;

        if (sortOrder === sortAscending) {
            return data.sort((a, b) => a[column.toLowerCase()].toString().localeCompare(
                b[column.toLowerCase()].toString(), undefined, {numeric: true, sensitivity: 'base'}));
        } else {
            return data.sort((a, b) => b[column.toLowerCase()].toString().localeCompare(
                a[column.toLowerCase()].toString(), undefined, {numeric: true, sensitivity: 'base'}));
        }
    }

    /**
     * render the alerts history table
     * */
    render() {
        if (this.state.faultyProviderConf) {
            return (
                <div
                    style={{
                        padding: 24,
                    }}
                >
                    <FormattedMessage
                        id='faulty.provider.config.error.message'
                        defaultMessage='Cannot fetch provider configuration for API-M Alerts History widget.'/>
                </div>
            );
        }

        const {
            alertsHistoryTableColumnNames, alertsHistoryTableSortColumns, alertsHistoryHeaderWidthSpec,
            alertsHistoryHeaderMinWidthSpec, alertsTableSelectedRowsPerPageIndex
        } = Constants;
        const {width, options, filteredRows, localeMessages} = this.state;
        const {muiTheme} = this.props;

        return (
            <IntlProvider locale={language} messages={localeMessages}>
                <MuiThemeProvider
                    theme={this.props.muiTheme.name === 'dark' ? darkTheme : lightTheme}>
                    <Scrollbars
                        style={{height: this.state.height}}
                        horizontal={false}>
                        <div
                            style={{
                                paddingTop: 10,
                                paddingBottom: 10,
                                paddingLeft: 5,
                                paddingRight: 5,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    paddingBottom: 20,
                                    paddingLeft: 15,
                                    paddingRight: 15,
                                }}
                            >
                                <div>
                                    {this.getAlertTypeSelector()}
                                </div>
                                <div
                                    style={{
                                        paddingTop: 15,
                                        display: 'flex',
                                        marginLeft: 'auto',
                                        marginRight: 0
                                    }}>
                                    <DateRangePicker
                                        options={options}
                                        onChangeTime={this.onChangeTime}
                                        getTimeRangeInfo={this.getTimeRangeFromQueryParam}
                                        muiTheme={muiTheme}
                                        onChangeSyncTimeRange={this.onChangeSyncTimeRange}
                                        onClickAll={this.onClickSelectAll}/>
                                    <AlertsFilter
                                        muiTheme={muiTheme}
                                        onDeleteAllFilters={this.onDeleteAllFilters}
                                        onAddOrDeleteFilter={this.onAddOrDeleteFilter}
                                        initFilterValues={this.initFilterValues}/>
                                </div>
                            </div>
                            <CustomTable
                                tableColumnNames={alertsHistoryTableColumnNames}
                                data={filteredRows}
                                theme={muiTheme}
                                requirePagination={true}
                                sortColumns={alertsHistoryTableSortColumns}
                                onRequestSort={this.handleRequestSort}
                                widthSpec={alertsHistoryHeaderWidthSpec}
                                minWidthSpec={alertsHistoryHeaderMinWidthSpec}
                                width={width}
                                selectedRowsPerPageIndex={alertsTableSelectedRowsPerPageIndex}
                                noDataMessage={this.alertTableNoDataMessage}
                            />
                        </div>
                    </Scrollbars>
                </MuiThemeProvider>
            </IntlProvider>);
    }
}

global.dashboard.registerWidget('APIMAlertsHistory', APIMAlertsHistory);