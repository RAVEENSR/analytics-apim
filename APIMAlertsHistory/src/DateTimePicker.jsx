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
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import {FormattedMessage} from 'react-intl';
import moment from 'moment';

export default class DateTimePicker extends React.Component {
    constructor(props) {
        super(props);
        const {initTime} = this.props;
        this.state = {
            year: initTime.year(),
            month: initTime.month(),
            days: initTime.date(),
            time: initTime.format('HH:mm:ss.000'),
        };

        this.generateDays = this.generateDays.bind(this);
        this.generateMonths = this.generateMonths.bind(this);
        this.generateYears = this.generateYears.bind(this);
    }

    /**
     * isLeapYear check whether selected year is leap
     * */
    isLeapYear(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }

    /**
     *  generateDays generate possible options for days
     * */
    generateDays(year, month, inputName, startTime) {
        const dayComponents = [];
        let days = 0;

        if (month === 1) {
            if (this.isLeapYear(year)) days = 29;
            else days = 28;
        } else if ((month < 7 && ((month + 1) % 2 === 1)) || (month > 6 && ((month + 1) % 2 === 0))) {
            days = 31;
        } else {
            days = 30;
        }
        if (inputName === 'startTime') {
            for (let i = 1; i <= days; i++) {
                dayComponents.push(
                    <MenuItem
                        value={i}
                    >
                        {i}
                    </MenuItem>
                );
            }
        } else if (inputName === 'endTime') {
            if (moment(startTime).month() === this.state.month) {
                const startDate = moment(startTime).date();
                for (let i = startDate; i <= days; i++) {
                    dayComponents.push(
                        <MenuItem
                            value={i}
                        >
                            {i}
                        </MenuItem>
                    );
                }
                if (this.state.days < startDate) {
                    this.setState({days: startDate + 1});
                    this.handleOnChange('days', startDate + 1);
                }
            } else {
                for (let i = 1; i <= days; i++) {
                    dayComponents.push(
                        <MenuItem
                            value={i}
                        >
                            {i}
                        </MenuItem>
                    );
                }
            }
        }

        return dayComponents;
    }

    /**
     *  generateMonths generate possible options for months
     * */
    generateMonths(inputName, startTime) {
        const monthComponents = [];
        const monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'];

        if (inputName === 'startTime') {
            for (let i = 0; i < monthArray.length; i++) {
                monthComponents.push(
                    <MenuItem
                        value={i}
                    >
                        {monthArray[i]}
                    </MenuItem>
                );
            }
        } else if (inputName === 'endTime') {
            const start = moment(startTime);
            const {year} = this.state;
            const yearDiff = year - start.year();
            if (yearDiff <= 0) {
                const startMonth = start.month();
                for (let i = startMonth; i < monthArray.length; i++) {
                    monthComponents.push(
                        <MenuItem
                            value={i}
                        >
                            {monthArray[i]}
                        </MenuItem>
                    );
                }
                const {month} = this.state;
                if (month < startMonth) {
                    this.setState({month: startMonth});
                    this.handleOnChange('month', startMonth);
                }
            } else if (yearDiff > 0) {
                for (let i = 0; i < monthArray.length; i++) {
                    monthComponents.push(
                        <MenuItem
                            value={i}
                        >
                            {monthArray[i]}
                        </MenuItem>
                    );
                }
            }
        }

        return monthComponents;
    }

    /**
     * generateYears generate possible options for years
     * */
    generateYears(inputName, startTime) {
        const yearArray = [];

        if (inputName === 'startTime') {
            for (let index = 1970; index <= 2099; index++) {
                yearArray.push(
                    <MenuItem
                        value={index}
                    >
                        {index}
                    </MenuItem>
                );
            }
        } else if (inputName === 'endTime') {
            const startYear = moment(startTime).year();
            for (let index = startYear; index <= 2099; index++) {
                yearArray.push(
                    <MenuItem
                        value={index}
                    >
                        {index}
                    </MenuItem>
                );
            }
            const {year} = this.state;
            if (year < startYear) {
                this.setState({year: startYear});
                this.handleOnChange('year', startYear);
            }
        }

        return yearArray;
    }

    /**
     * handleOnChange handle change in year, month and date
     * */
    handleOnChange(property, value) {
        const {onChange} = this.props;
        const {state} = this;

        state[property] = value;
        const date = moment(`${state.year}:${(state.month + 1)}:${state.days} ${state.time}`,
            'YYYY-MM-DD HH:mm:ss.000').toDate();
        this.setState(state);

        return onChange && onChange(date);
    }

    render() {
        const {year, month, days} = this.state;
        const {time} = this.state;
        const {inputName, startTime} = this.props;

        return (
            <div>
                <div>
                    <div style={{paddingTop: 5, paddingBottom: 5}}>
                        <Select
                            value={year}
                            onChange={(event) => {
                                this.handleOnChange('year', event.target.value);
                            }}
                            style={{width: '100%'}}
                        >
                            {this.generateYears(inputName, startTime)}
                        </Select>
                    </div>
                    <div style={{paddingTop: 5, paddingBottom: 5}}>
                        <Select
                            value={month}
                            onChange={(event) => {
                                this.handleOnChange('month', event.target.value);
                            }}
                            style={{width: '100%'}}
                        >
                            {this.generateMonths(inputName, startTime)}
                        </Select>
                    </div>
                    <div style={{paddingTop: 5, paddingBottom: 5}}>
                        <Select
                            value={days}
                            onChange={(event) => {
                                this.handleOnChange('days', event.target.value);
                            }}
                            style={{width: '100%'}}
                        >
                            {this.generateDays(year, month, inputName, startTime)}
                        </Select>
                    </div>
                </div>
                <div>
                    <br/>
                    <Typography>
                        <FormattedMessage id='date.range.picker.time' defaultMessage='Time'/>
                    </Typography>
                    <div>
                        <div>
                            <TextField
                                type="time"
                                value={time}
                                onChange={(evt) => {
                                    this.handleOnChange('time', evt.target.value);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}