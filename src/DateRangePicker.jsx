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
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import {Sync, SyncDisabled} from '@material-ui/icons/';
import Tooltip from '@material-ui/core/Tooltip';
import Moment from 'moment';
import {FormattedMessage} from "react-intl";
import GranularityModeSelector from './GranularityModeSelector';
import Constants from './Constants';

export default class DateRangePicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: props.widgetID,
            granularityMode: null,
            granularityValue: '',
            options: this.props.options,
            enableSync: false,
            syncButtonColor: '#BDBDBD',
            syncButton: <SyncDisabled/>,
        };

        this.publishTimeRange = this.publishTimeRange.bind(this);
        this.handleGranularityChange = this.handleGranularityChange.bind(this);
        this.handleGranularityChangeForCustom = this.handleGranularityChangeForCustom.bind(this);
        this.handleGranularityChangeForClickAll = this.handleGranularityChangeForClickAll.bind(this);
        this.getStartTime = this.getStartTime.bind(this);
        this.autoSyncClick = this.autoSyncClick.bind(this);
        this.setRefreshInterval = this.setRefreshInterval.bind(this);
        this.clearRefreshInterval = this.clearRefreshInterval.bind(this);
        this.getDateTimeRangeInfo = this.getDateTimeRangeInfo.bind(this);
        this.getTimeRangeName = this.getTimeRangeName.bind(this);
    }

    componentDidMount() {
        this.loadDefaultTimeRange();
    }

    componentWillUnmount() {
        clearInterval(this.state.refreshIntervalId);
    }

    /**
     * publishTimeRange publish selected time range
     * */
    publishTimeRange(message) {
        const {onChangeTime} = this.props;

        onChangeTime && onChangeTime(message.selectedRange, message.from, message.to);
    }

    /**
     * getDateTimeRangeInfo get time range info from query param
     * */
    getDateTimeRangeInfo() {
        const {getTimeRangeInfo} = this.props;

        return getTimeRangeInfo && getTimeRangeInfo();
    }

    /**
     * handleGranularityChange handle change in selected time range
     * */
    handleGranularityChange(mode) {
        this.clearRefreshInterval();
        const startTime = this.getStartTime(mode);
        const endTime = new Date();

        this.publishTimeRange({
            selectedRange: mode,
            from: startTime.getTime(),
            to: endTime.getTime(),
        });
        this.setRefreshInterval();
        this.setState({
            granularityMode: mode,
            startTime,
            endTime,
        });
    }

    /**
     * handleGranularityChangeForCustom handle change in selected custom time range
     * */
    handleGranularityChangeForCustom(startTime, endTime) {
        const {custom} = Constants;

        this.clearRefreshInterval();
        this.publishTimeRange({
            selectedRange: custom,
            from: startTime.getTime(),
            to: endTime.getTime(),
        });
        this.setState({
            granularityMode: custom,
            startTime,
            endTime,
            enableSync: false,
            syncButtonColor: '#BDBDBD',
            syncButton: <SyncDisabled/>,
        });
    }

    /**
     * handleGranularityChangeForClickAll handle on click of 'all' time option
     * */
    handleGranularityChangeForClickAll() {
        const {all} = Constants;
        const {onClickAll} = this.props;

        this.clearRefreshInterval();
        this.setState({granularityMode: all});
        this.setRefreshInterval();
        onClickAll && onClickAll();
    }

    /**
     * getStartTime for selected time range
     * */
    getStartTime(mode) {
        let startTime = null;

        switch (mode) {
            case '1mn':
                startTime = Moment().subtract(1, 'minutes').toDate();
                break;
            case '15mn':
                startTime = Moment().subtract(15, 'minutes').toDate();
                break;
            case '1h':
                startTime = Moment().subtract(1, 'hours').toDate();
                break;
            case '1d':
                startTime = Moment().subtract(1, 'days').toDate();
                break;
            case '1w':
                startTime = Moment().subtract(1, 'weeks').toDate();
                break;
            case '2w':
                startTime = Moment().subtract(2, 'weeks').toDate();
                break;
            case '1mo':
                startTime = Moment().subtract(1, 'months').toDate();
                break;
            case '3mo':
                startTime = Moment().subtract(3, 'months').toDate();
                break;
            case '6mo':
                startTime = Moment().subtract(6, 'months').toDate();
                break;
            case '1y':
                startTime = Moment().subtract(1, 'years').toDate();
                break;
            default:
            // do nothing
        }
        return startTime;
    }

    /**
     * getTimeRangeName get abbrv for time range
     * */
    getTimeRangeName(timeRange) {
        let name = '';

        if (timeRange) {
            switch (timeRange) {
                case '1 Min':
                    name = '1mn';
                    break;
                case '15 Min':
                    name = '15mn';
                    break;
                case '1 Hour':
                    name = '1h';
                    break;
                case '1 Day':
                    name = '1d';
                    break;
                case '1 Week':
                    name = '1w';
                    break;
                case '2 Weeks':
                    name = '2w';
                    break;
                case '1 Month':
                    name = '1mo';
                    break;
                case '3 Months':
                    name = '3mo';
                    break;
                case '6 Months':
                    name = '6mo';
                    break;
                case '1 Year':
                    name = '1y';
                    break;
                default:
                // do nothing
            }
        }
        return name;
    }

    /**
     * loadDefaultTimeRange initialize date range picker by loading default time range
     * */
    loadDefaultTimeRange() {
        const {custom} = Constants;
        const {options} = this.state;
        const {onChangeSyncTimeRange} = this.props;
        const dateTimeRangeInfo = this.getDateTimeRangeInfo();
        const defaultTimeRange = this.getTimeRangeName(options.defaultRange) || '1w';

        if (dateTimeRangeInfo.range) {
            if (dateTimeRangeInfo.range.toLowerCase() === custom) {
                if (dateTimeRangeInfo.from
                    && dateTimeRangeInfo.to) {
                    this.loadUserSpecifiedCustomTimeRange(dateTimeRangeInfo.from, dateTimeRangeInfo.to);
                } else {
                    this.handleGranularityChange(defaultTimeRange);
                }
            } else {
                if (dateTimeRangeInfo.sync) {
                    onChangeSyncTimeRange && onChangeSyncTimeRange(dateTimeRangeInfo.sync);
                    this.setState({
                        enableSync: true,
                        syncButtonColor: '#f17b31',
                        syncButton: <Sync/>,
                    }, this.setRefreshInterval);
                }
                this.loadUserSpecifiedTimeRange(dateTimeRangeInfo.range);
            }
        } else {
            this.handleGranularityChange(defaultTimeRange);
        }
    }

    /**
     * loadUserSpecifiedCustomTimeRange load user specified custom time range
     * */
    loadUserSpecifiedCustomTimeRange(start, end) {
        const {custom} = Constants;
        const startAndEndTime = this.formatTimeRangeDetails(start, end);

        if (startAndEndTime != null) {
            this.clearRefreshInterval();
            this.publishTimeRange({
                selectedRange: custom,
                from: startAndEndTime.startTime,
                to: startAndEndTime.endTime,
            });
            this.setState({
                granularityMode: custom,
                startTime: Moment(startAndEndTime.startTime).toDate(),
                endTime: Moment(startAndEndTime.endTime).toDate(),
            });
        } else {
            this.handleGranularityChange(this.getTimeRangeName(this.state.options.defaultRange) || '1w');
        }
    }

    /**
     * loadUserSpecifiedTimeRange load user specified time range
     * */
    loadUserSpecifiedTimeRange(timeRange) {
        const {all} = Constants;

        if (timeRange) {
            this.clearRefreshInterval();
            if(timeRange === all) {
                this.handleGranularityChangeForClickAll();
            } else {
                this.handleGranularityChange(timeRange);
            }
        } else {
            this.handleGranularityChange(this.getTimeRangeName(this.state.options.defaultRange) || '1w');
        }
    }

    /**
     * formatTimeRangeDetails format start and end time range details
     * */
    formatTimeRangeDetails(startTime, endTime) {
        let result = null;
        const timeFormat = 'YYYY-MMM-DD hh:mm:ss A';
        const start = Moment(startTime, timeFormat).valueOf();
        const end = Moment(endTime, timeFormat).valueOf();

        if (start !== 'Invalid date' && end !== 'Invalid date') {
            result = {startTime: start, endTime: end};
        }
        return result;
    }

    /**
     * autoSyncClick handle onclick of sync
     * */
    autoSyncClick() {
        const {onChangeSyncTimeRange} = this.props;

        if (!this.state.enableSync) {
            onChangeSyncTimeRange && onChangeSyncTimeRange(true);
            this.setState({
                enableSync: true,
                syncButtonColor: '#f17b31',
                syncButton: <Sync/>,
            }, this.setRefreshInterval);
        } else {
            onChangeSyncTimeRange && onChangeSyncTimeRange(false);
            this.setState({
                enableSync: false,
                syncButtonColor: '#BDBDBD',
                syncButton: <SyncDisabled/>,
            });
            this.clearRefreshInterval();
        }
    }

    /**
     * setRefreshInterval set auto-sync refresh interval
     * */
    setRefreshInterval() {
        if (this.state.enableSync) {
            const refreshInterval = this.state.options.autoSyncInterval * 1000 || 60000;
            const refresh = () => {
                this.publishTimeRange({
                    selectedRange: this.state.granularityMode,
                    from: this.getStartTime(this.state.granularityMode).getTime(),
                    to: new Date().getTime(),
                });
            };
            const intervalID = setInterval(refresh, refreshInterval);
            this.setState({
                refreshIntervalId: intervalID,
                endTime: new Date(),
            });
        }
    }

    /**
     * clearRefreshInterval clear auto0sync refresh interval
     * */
    clearRefreshInterval() {
        clearInterval(this.state.refreshIntervalId);
        this.setState({
            refreshIntervalId: null,
        });
    }

    render() {
        const {options, syncButtonColor, syncButton, granularityMode} = this.state;
        const {muiTheme} = this.props;
        const {custom, all} = Constants;

        return (
            <div
                style={{display: 'flex'}}
            >
                <Tooltip
                    title={
                        <FormattedMessage id='tooltip.date.range.picker.all'
                                          defaultMessage='Show all alerts history'/>}
                >
                    <Button
                        onClick={this.handleGranularityChangeForClickAll}
                        style={{
                            borderBottom: granularityMode === all ?
                                (muiTheme.name === 'dark' ? '1px solid red' : '1px solid gray') : '',
                            textTransform: 'none',
                            minWidth: 35,
                            borderRadius: granularityMode === all ? 0 : ''
                        }}
                    >
                        <FormattedMessage id='date.range.picker.all' defaultMessage='All'/>
                    </Button>
                </Tooltip>
                <GranularityModeSelector
                    onChange={this.handleGranularityChange}
                    onChangeCustom={this.handleGranularityChangeForCustom}
                    options={options}
                    getDateTimeRangeInfo={this.getDateTimeRangeInfo}
                    getTimeRangeName={this.getTimeRangeName}
                    selectedTimeRange={granularityMode}
                    theme={muiTheme}
                />
                <Tooltip
                    title={
                        <FormattedMessage id='tooltip.date.range.picker.sync' defaultMessage='Auto-sync alerts table'/>}
                >
                    <IconButton
                        onClick={this.autoSyncClick}
                        style={{color: granularityMode !== custom ? syncButtonColor : '#5e5e5e'}}
                        disabled={granularityMode === custom}
                    >
                        {syncButton}
                    </IconButton>
                </Tooltip>
            </div>
        );
    }
}