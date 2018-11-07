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
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Popover from '@material-ui/core/Popover';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Search from '@material-ui/icons/Search';
import ClearAll from '@material-ui/icons/ClearAll';
import Add from '@material-ui/icons/Add';
import Delete from '@material-ui/icons/Delete';
import Moment from "moment";
import {Scrollbars} from 'react-custom-scrollbars';
import Constants from './Constants';

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

class APIMAlertsHistory extends Widget {

    constructor(props) {
        super(props);

        this.state = {
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            rows: [],
            filteredRows: [],
            filterValues: {},
            alertType: '',
            timeTo: null,
            timeFrom: null,
            openFilterConfig: false,
            filterConfigAnchorEl: null,
            newFilterColumn: Constants.alertsHistoryTableColumnNames[2].toLowerCase(),
            newFilterValue: '',
            invalidFilter: false
        };

        this.props.glContainer.on('resize', () =>
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height
            })
        );

        this.handleDataReceived = this.handleDataReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.handleTableUpdate = this.handleTableUpdate.bind(this);
        this.getSeverityLevel = this.getSeverityLevel.bind(this);
        this.getAlertTypeSelector = this.getAlertTypeSelector.bind(this);
        this.getAlertFilter = this.getAlertFilter.bind(this);
        this.handleFilterClick = this.handleFilterClick.bind(this);
        this.handleRequestClose = this.handleRequestClose.bind(this);
        this.validateNewFilter = this.validateNewFilter.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.capitalizeCaseFirstChar = this.capitalizeCaseFirstChar.bind(this);
        this.filterDataUsingAllFilters = this.filterDataUsingAllFilters.bind(this);
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    componentWillMount() {
        super.subscribe(this.handlePublisherParameters);
    }

    /**
     * handlePublisherParameters handles data published from apim date range picker
     **/
    handlePublisherParameters(message) {
        this.setState({
            timeFrom: message.from,
            timeTo: message.to
        }, this.handleTableUpdate);
    }

    /**
     * handleTableUpdate retrieves data from alert tables
     * */
    handleTableUpdate() {
        this.checkAvailabilityOFQueryParams();
        const {alertType, timeFrom, timeTo} = this.state;
        const {queryNames} = Constants;
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                let query = message.data.configs.providerConfig.configs.config
                    .queryData[queryNames[alertType]];
                query = query
                    .replace("{{timeFrom}}", timeFrom)
                    .replace("{{timeTo}}", timeTo);
                message.data.configs.providerConfig.configs.config.queryData.query = query;
                super.getWidgetChannelManager().subscribeWidget(
                    this.props.id, this.handleDataReceived, message.data.configs.providerConfig);
            })
            .catch((error) => {
                console.error("Error occurred when loading widget \'" + this.props.widgetID + "\'. " + error);
                this.setState({
                    faultyProviderConf: true
                });
            });
    }

    /**
     * checkAvailabilityOFQueryParams checks whether query params are available specifying alert type and filters
     * */
    checkAvailabilityOFQueryParams() {
        const {queryParamKey, alertTypes, alertTypeKeys, alertsHistoryTableColumnNames} = Constants;
        const queryParams = super.getGlobalState(queryParamKey);
        let alertType = alertTypeKeys.allAlerts;
        let filterValues = {};
        if (queryParams.type) {
            if (alertTypes[queryParams.type]) {
                alertType = alertTypeKeys[queryParams.type];
            }
        }
        if (queryParams.filters) {
            let filters = queryParams.filters;
            Object.keys(filters).forEach(column => {
                const columnName = this.capitalizeCaseFirstChar(column);
                if (alertsHistoryTableColumnNames.indexOf(columnName) !== -1) {
                    filterValues[column] = filters[column];
                }
            });
        }
        this.state.alertType = alertType;
        this.state.filterValues = filterValues;
        this.setQueryParam();
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
        if (message.data) {
            let results = [];
            const {alertType} = this.state;
            const {alertTypeKeys} = Constants;
            if (alertType === alertTypeKeys.allAlerts) {
                results = this.createTableDataForAllAlerts(message.data);
            } else {
                results = this.createTableDataForSpecificAlerts(alertType, message.data);
            }
            this.setState({
                rows: results,
                filteredRows: this.filterDataUsingAllFilters(results)
            });
        }
    }

    /**
     * createTableDataForAllAlerts loads data to alerts history table for alert type 'All alerts'
     * */
    createTableDataForAllAlerts(data) {
        const {alertTypeNamesMapping} = Constants;
        let results = [];
        data.forEach(dataUnit => {
            results.push([Moment(dataUnit[0]).format('YYYY-MMM-DD hh:mm:ss A'),
                alertTypeNamesMapping[dataUnit[1]], dataUnit[3], this.getSeverityLevel(dataUnit[2])])
        });
        return results;
    }

    /**
     * createTableDataForSpecificAlerts loads data to alerts history table for alert type other than 'All alerts'
     * */
    createTableDataForSpecificAlerts(alertType, data) {
        const {alertTypes, alertMessageFieldsForAlertType} = Constants;
        let results = [];
        data.forEach(dataUnit => {
            const message = this.createAlertMessageElementsForAlerts(this.createAlertMessageKeyValuePairs(
                alertMessageFieldsForAlertType[alertType], dataUnit.slice(3)), dataUnit[2]);
            results.push([Moment(dataUnit[0]).format('YYYY-MMM-DD hh:mm:ss A'), alertTypes[alertType],
                message, this.getSeverityLevel(dataUnit[1])])
        });
        return results;
    }

    /**
     * getSeverityLevel return alert severity
     * */
    getSeverityLevel(severity) {
        let severityLevel = '';
        switch (severity) {
            case 1:
                severityLevel =
                    <span style={{
                        fontWeight: 'bold',
                        backgroundColor: '#d9534f',
                        borderRadius: '5px',
                        padding: '5px',
                        verticalAlign: 'center'
                    }}>
                Severe
                </span>;
                break;
            case 2:
                severityLevel =
                    <span
                        style={{
                            fontWeight: 'bold',
                            backgroundColor: '#f0ad4e',
                            borderRadius: '5px',
                            padding: '5px',
                            verticalAlign: 'center'
                        }}>
                Moderate
                </span>;
                break;
            case 3:
                severityLevel =
                    <span style={{
                        fontWeight: 'bold',
                        backgroundColor: '#777777',
                        borderRadius: '5px',
                        padding: '5px',
                        verticalAlign: 'center'
                    }}>
                Mild
                </span>;
                break;
            default:
            //        not reached
        }
        return severityLevel;
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
        const backendTime = data['backendTime'];
        const requestPerMin = data['requestPerMin'];
        const reason = data['reason'];
        const scope = data['scope'];
        const consumerKey = data['consumerKey'];
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
        this.state.alertType = event.target.value;
        this.setState({
            filteredRows: []
        }, this.fetchAlertData);
        this.setQueryParam();
    };

    /**
     * fetchAlertData when alert type is changed fetch data for the specific alert type
     * */
    fetchAlertData() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
        this.handleTableUpdate();
    }

    /**
     * getAlertTypeSelector return the select field used to select alert type
     * */
    getAlertTypeSelector() {
        const {alertTypes, alertTypeKeys} = Constants;
        return (
            <FormControl>
                <InputLabel htmlFor="alert-type">Alert Type</InputLabel>
                <Select
                    value={this.state.alertType}
                    onChange={this.handleAlertTypeChange}
                    inputProps={{
                        name: 'Alert Type',
                        id: 'alert-type',
                    }}
                    style={{
                        width: this.state.width * 0.5 * 0.5
                    }}>
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
     * getAlertFilter returns a popover containing filter details
     * */
    getAlertFilter() {
        const {openFilterConfig, filterConfigAnchorEl, rows, filterValues} = this.state;
        const {muiTheme} = this.props;
        const {filterTableColumnNames} = Constants;
        return (
            <div
                style={{textAlign: 'right'}}>
                <IconButton
                    onClick={this.handleFilterClick}
                    style={{textAlign: 'right'}}
                >
                    <Search/>
                </IconButton>
                <Popover
                    open={openFilterConfig}
                    anchorEl={filterConfigAnchorEl}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    onClose={this.handleRequestClose}
                >
                    <div
                        style={{padding: 15}}>
                        {this.createNewAlertFilter()}
                        <div
                            style={{paddingTop: 10}}>
                            <CustomTable
                                tableColumnNames={filterTableColumnNames}
                                data={this.createFilterTableData()}
                                theme={muiTheme}
                                requirePagination={false}
                                noDataMessage='No filters available'
                            />
                        </div>
                        {Object.keys(filterValues).length > 0
                        && (
                            <div style={{textAlign: 'right'}}>
                                <IconButton
                                    onClick={() => {
                                        this.setState({
                                            filterValues: {},
                                            filteredRows: rows,
                                            invalidFilter: false
                                        }, this.setQueryParam)
                                    }}
                                    style={{color: '#dc3545'}}
                                >
                                    <ClearAll/>
                                </IconButton>
                            </div>
                        )}
                    </div>
                </Popover>
            </div>
        );
    }

    /**
     * handleFilterClick opens the filter detail popover
     * */
    handleFilterClick(event) {
        event.preventDefault();
        this.setState({
            openFilterConfig: true,
            filterConfigAnchorEl: event.currentTarget,
        });
    }

    /**
     * handleRequestClose closes the filter detail popover
     * */
    handleRequestClose() {
        this.setState({
            openFilterConfig: false,
        });
    }

    /**
     * createNewAlertFilter provide configurations to add a new filter
     * */
    createNewAlertFilter() {
        const {alertsHistoryTableColumnNames} = Constants;
        const {invalidFilter, newFilterColumn, newFilterValue, width} = this.state;
        return (
            <div
                style={{display: 'flex'}}>
                <div>
                    <Select
                        value={newFilterColumn}
                        onChange={(event) => {
                            this.setState({newFilterColumn: event.target.value})
                        }}
                        style={{width: width * 0.5 * 0.2}}
                    >
                        {alertsHistoryTableColumnNames.map(column => {
                            return (
                                <MenuItem value={column.toLowerCase()}>
                                    {column}
                                </MenuItem>
                            )
                        })}
                    </Select>
                    <TextField
                        placeholder='Filter by'
                        value={newFilterValue}
                        onChange={event => {
                            this.setState({newFilterValue: event.target.value}, this.validateNewFilter);
                        }}
                        style={{
                            width: width * 0.5 * 0.3,
                            paddingLeft: 10
                        }}
                        error={invalidFilter}
                        helperText={invalidFilter ? 'Filter already exists' : ''}
                    />
                </div>
                <div
                    style={{
                        paddingLeft: 10
                    }}
                >
                    <IconButton
                        style={{
                            backgroundColor: (invalidFilter || newFilterValue.length === 0) ?
                                'transparent' : '#F26621'
                        }}
                        disabled={invalidFilter || newFilterValue.length === 0}
                        onClick={this.addFilter}
                    >
                        <Add/>
                    </IconButton>
                </div>
            </div>
        )
    }

    /**
     * validateNewFilter check whether the filter already exists
     * */
    validateNewFilter() {
        let {filterValues, newFilterColumn, newFilterValue} = this.state;
        if (filterValues[newFilterColumn] && filterValues[newFilterColumn].indexOf(newFilterValue) !== -1) {
            this.setState({invalidFilter: true});
        } else {
            this.setState({invalidFilter: false});
        }
    }

    /**
     * addFilter adds a new filter
     * */
    addFilter() {
        let {filterValues, newFilterColumn, newFilterValue, filteredRows} = this.state;
        if (filterValues[newFilterColumn]) {
            let filters = filterValues[newFilterColumn];
            filters.push(newFilterValue);
            filterValues[newFilterColumn] = filters;
        } else {
            filterValues[newFilterColumn] = [newFilterValue];
        }
        filteredRows = this.filterDataUsingSingleFilter(filteredRows, newFilterColumn, newFilterValue);
        this.setState({
            filterValues,
            newFilterValue: '',
            filteredRows
        }, this.setQueryParam);
    }

    /**
     * filterDataUsingSingleFilter data using a single filter
     * */
    filterDataUsingSingleFilter(data, filterColumn, filterValue) {
        let filterResults = [];
        const {alertsHistoryTableColumnNames, message, severity, alertTypeKeys} = Constants;
        const {alertType} = this.state;
        const index = alertsHistoryTableColumnNames.indexOf(this.capitalizeCaseFirstChar(filterColumn));
        if (index !== -1) {
            if (alertType === alertTypeKeys.allAlerts) {
                data.forEach(dataUnit => {
                    if (filterColumn === severity && dataUnit[index].props.children.toString().toLowerCase()
                        .includes(filterValue.toString().toLowerCase())) {
                        filterResults.push(dataUnit);
                    } else if (dataUnit[index].toString().toLowerCase().includes(
                        filterValue.toString().toLowerCase())) {
                        filterResults.push(dataUnit);
                    }
                })
            } else {
                data.forEach(dataUnit => {
                    if (filterColumn === message) {
                        if (dataUnit[index].props.children.some(child =>
                            child && (child.props.children.props.children[0].props.children.toString().toLowerCase()
                                .includes(filterValue.toString().toLowerCase())
                            || child.props.children.props.children[2].toString().toLowerCase()
                                .includes(filterValue.toString().toLowerCase())))) {
                            filterResults.push(dataUnit);
                        }
                    } else if (filterColumn === severity && dataUnit[index].props.children.toString().toLowerCase()
                        .includes(filterValue.toString().toLowerCase())) {
                        filterResults.push(dataUnit);
                    } else if (dataUnit[index].toString().toLowerCase()
                        .includes(filterValue.toString().toLowerCase())) {
                        filterResults.push(dataUnit);
                    }
                })
            }
        } else {
            filterResults = data;
        }
        return filterResults;
    }

    /**
     * filterDataUsingAllFilters filter data using all filters
     * */
    filterDataUsingAllFilters(data) {
        const {filterValues} = this.state;
        let filteredRows = data;
        Object.keys(filterValues).forEach(column => {
            filterValues[column].forEach(value => {
                filteredRows = this.filterDataUsingSingleFilter(filteredRows, column, value);
            })
        });
        return filteredRows;
    }

    /**
     * createFilterTableData display the filters in a table
     * */
    createFilterTableData() {
        const {filterValues, rows} = this.state;
        let filterData = [];
        Object.keys(filterValues).forEach(column => {
            filterValues[column].forEach(value => {
                filterData.push([column, value,
                    <IconButton
                        onClick={() => {
                            let filtersForColumn = filterValues[column];
                            const index = filtersForColumn.indexOf(value);
                            filtersForColumn.splice(index, 1);
                            if (filtersForColumn.length > 0) {
                                filterValues[column] = filtersForColumn;
                            } else {
                                delete filterValues[column];
                            }
                            const filteredRows = this.filterDataUsingAllFilters(rows);
                            this.setState({filterValues, filteredRows}, this.setQueryParam);
                        }}
                        style={{color: '#dc3545'}}
                    >
                        <Delete/>
                    </IconButton>]);
            })
        });
        return filterData;
    }

    /**
     * setQueryParam set alert type and filters as query params
     * */
    setQueryParam() {
        const {queryParamKey} = Constants;
        const {alertType, filterValues} = this.state;
        if (Object.keys(filterValues).length > 0) {
            super.setGlobalState(queryParamKey, {
                type: alertType,
                filters: filterValues,
            });
        } else {
            super.setGlobalState(queryParamKey, {type: alertType});
        }
    }

    /**
     * render the alerts history table
     * */
    render() {
        const {alertsHistoryTableColumnNames} = Constants;
        const {width, filteredRows} = this.state;
        const {muiTheme} = this.props;
        return (
            <MuiThemeProvider
                theme={this.props.muiTheme.name === 'dark' ? darkTheme : lightTheme}>
                <Scrollbars
                    style={{height: this.state.height}}>
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
                            <div
                                style={{
                                    width: width * 0.5
                                }}>
                                {this.getAlertTypeSelector()}
                            </div>
                            <div
                                style={{
                                    width: width * 0.5,
                                    paddingTop: 15
                                }}>
                                {this.getAlertFilter()}
                            </div>
                        </div>
                        <CustomTable
                            tableColumnNames={alertsHistoryTableColumnNames}
                            data={filteredRows}
                            theme={muiTheme}
                            requirePagination={true}
                        />
                    </div>
                </Scrollbars>
            </MuiThemeProvider>
        );
    }
}

global.dashboard.registerWidget('APIMAlertsHistory', APIMAlertsHistory);