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

import React from 'react';
import Tooltip from "@material-ui/core/Tooltip";
import {FormattedMessage} from "react-intl";
import IconButton from "@material-ui/core/IconButton";
import Search from "@material-ui/icons/Search";
import Popover from "@material-ui/core/Popover";
import ClearAll from "@material-ui/icons/ClearAll";
import Constants from "./Constants";
import CustomTable from "./CustomTable";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import Add from "@material-ui/icons/Add";
import Delete from "@material-ui/icons/Delete";

export default class AlertsFilter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filterValues: this.props.initFilterValues || {},
            openFilterConfig: false,
            filterConfigAnchorEl: null,
            newFilterErrorText: '',
            invalidFilter: false,
        };
        this.newFilterColumn = Constants.alertsHistoryTableColumnNames[0].toLowerCase();
        this.newFilterValue = '';

        this.handleFilterClick = this.handleFilterClick.bind(this);
        this.handleRequestClose = this.handleRequestClose.bind(this);
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
        const {invalidFilter, newFilterErrorText} = this.state;

        return (
            <div
                style={{display: 'flex'}}>
                <div style={{width: '95%'}}>
                    <Select
                        value={this.newFilterColumn}
                        onChange={(event) => {
                            this.newFilterColumn = event.target.value;
                            this.newFilterValue = '';
                            this.setState({
                                invalidFilter: false,
                                newFilterErrorText: ''
                            })
                        }}
                        style={{width: '40%'}}
                    >
                        {alertsHistoryTableColumnNames.map(column => {
                            return (
                                <MenuItem value={column.toLowerCase()}>
                                    {column}
                                </MenuItem>
                            )
                        })}
                    </Select>
                    <Tooltip
                        title={this.getTooltipForAddFilter()}>
                        <TextField
                            placeholder='Filter by'
                            // placeholder={<FormattedMessage id='filter.by' defaultMessage='Filter by'/>}
                            value={this.newFilterValue}
                            onChange={event => {
                                this.newFilterValue = event.target.value;
                                this.validateNewFilter();
                            }}
                            style={{
                                width: '55%',
                                paddingLeft: 10
                            }}
                            error={invalidFilter}
                            helperText={newFilterErrorText}
                        />
                    </Tooltip>
                </div>
                <div>
                    <Tooltip
                        title={<FormattedMessage id='filter.add' defaultMessage='Add filter'/>}>
                        <IconButton
                            style={{
                                backgroundColor: (invalidFilter || this.newFilterValue.length === 0) ?
                                    'transparent' : '#F26621'
                            }}
                            disabled={invalidFilter || this.newFilterValue.length === 0}
                            onClick={() => {this.addFilter()}}
                        >
                            <Add/>
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
        )
    }

    /**
     * getTooltipForAddFilter return tootip text for each column
     * */
    getTooltipForAddFilter() {
        const {tooltipForAddFilter, defaultTooltipForAddFilter} = Constants;

        if (tooltipForAddFilter[this.newFilterColumn]) {
            return (
                <FormattedMessage id={tooltipForAddFilter[this.newFilterColumn]}
                                  defaultMessage={defaultTooltipForAddFilter[this.newFilterColumn]}/>
            );
        } else {
            return ''
        }
    }

    /**
     * validateNewFilter check whether the filter is valid
     * */
    validateNewFilter() {
        const {type, severity, alertTypeCandidates, alertSeverityCandidates} = Constants;
        let {filterValues} = this.state;
        let invalidFilter = false;
        let newFilterErrorText = '';

        if (filterValues[this.newFilterColumn] && filterValues[this.newFilterColumn]
            .indexOf(this.newFilterValue) !== -1) {
            invalidFilter = true;
            newFilterErrorText = <FormattedMessage id='invalid.filter.message.filter.exist'
                                                   defaultMessage='Filter already exists.'/>;
        } else {
            if (this.newFilterValue !== '') {
                if (this.newFilterColumn === type) {
                    if (this.validateFilterValueStringCombinations(alertTypeCandidates, this.newFilterValue)) {
                        invalidFilter = true;
                        newFilterErrorText = <FormattedMessage id='invalid.filter.message.invalid.type'
                                                               defaultMessage='Invalid alert type.'/>;
                    }
                } else if (this.newFilterColumn === severity) {
                    if (this.validateFilterValueStringCombinations(alertSeverityCandidates, this.newFilterValue)) {
                        invalidFilter = true;
                        newFilterErrorText = <FormattedMessage id='invalid.filter.message.invalid.severity'
                                                               defaultMessage='Invalid severity level.'/>;
                    }
                }
            }
        }
        this.setState({
            invalidFilter,
            newFilterErrorText
        });
    }

    /**
     * validateFilterValueStringCombinations validate whether the entered string can be used to filter available options
     * */
    validateFilterValueStringCombinations(candidateValues, filterValue) {
        const possibleValues = [];

        candidateValues.forEach(candidate => {
            const parts = candidate.split(' ');
            let value = '';
            if (parts.length > 1) {
                for (let i = 0; i < parts.length - 1; i++) {
                    value = parts[i];
                    possibleValues.push(value);
                    for (let j = i + 1; j < parts.length; j++) {
                        value = value + parts[j];
                        possibleValues.push(value);
                    }
                }
            } else if (parts.length === 1) {
                possibleValues.push(parts[0]);
            }
        });
        return possibleValues.indexOf(filterValue.toString().toLowerCase()) === -1;
    }

    /**
     * addFilter adds a new filter
     * */
    addFilter() {
        let {filterValues} = this.state;
        const {onAddOrDeleteFilter} = this.props;

        if (filterValues[this.newFilterColumn]) {
            const filters = filterValues[this.newFilterColumn];
            filters.push(this.newFilterValue);
            filterValues[this.newFilterColumn] = filters;
        } else {
            filterValues[this.newFilterColumn] = [this.newFilterValue];
        }
        this.newFilterValue = '';
        this.setState({filterValues});
        onAddOrDeleteFilter && onAddOrDeleteFilter(filterValues);
    }


    /**
     * createFilterTableData display the filters in a table
     * */
    createFilterTableData() {
        const {filterValues} = this.state;
        let filterData = [];

        Object.keys(filterValues).forEach(column => {
            filterValues[column].forEach(value => {
                filterData.push([column, value,
                    <Tooltip title={<FormattedMessage id='filter.delete' defaultMessage='Delete filter'/>}>
                        <IconButton
                            onClick={() => {
                                this.deleteFilter(column, value)
                            }}
                            style={{color: '#dc3545'}}
                        >
                            <Delete/>
                        </IconButton>
                    </Tooltip>]);
            })
        });
        return filterData;
    }

    /**
     * deleteFilter deletes a filter
     * */
    deleteFilter(column, value) {
        const {onAddOrDeleteFilter} = this.props;
        const {filterValues} = this.state;
        let filtersForColumn = filterValues[column];
        const index = filtersForColumn.indexOf(value);

        filtersForColumn.splice(index, 1);
        if (filtersForColumn.length > 0) {
            filterValues[column] = filtersForColumn;
        } else {
            delete filterValues[column];
        }
        onAddOrDeleteFilter && onAddOrDeleteFilter(filterValues);
    }

    render() {
        const {openFilterConfig, filterConfigAnchorEl, filterValues} = this.state;
        const {muiTheme, onDeleteAllFilters} = this.props;
        const {filterTableColumnNames} = Constants;

        return (
            <div>
                <Tooltip title={<FormattedMessage id='filter.filters' defaultMessage='Filters'/>}>
                    <IconButton
                        onClick={this.handleFilterClick}
                    >
                        <Search/>
                    </IconButton>
                </Tooltip>
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
                    PaperProps={{style: {minWidth: 450}}}
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
                                noDataMessage={<FormattedMessage id='no.filters.available'
                                                                 defaultMessage='No filters available'/>}
                            />
                        </div>
                        {Object.keys(filterValues).length > 0
                        && (
                            <div style={{textAlign: 'right'}}>
                                <Tooltip title={
                                    <FormattedMessage id='filter.delete.all' defaultMessage='Delete all filters'/>}>
                                    <IconButton
                                        onClick={() => {
                                            onDeleteAllFilters && onDeleteAllFilters();
                                            this.setState({
                                                invalidFilter: false,
                                                filterValues: {}
                                            })
                                        }}
                                        style={{color: '#dc3545'}}
                                    >
                                        <ClearAll/>
                                    </IconButton>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </Popover>
            </div>
        );
    }
}