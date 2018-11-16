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

/* eslint-disable react/prop-types */
import React from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Moment from 'moment';
import DateTimePicker from './DateTimePicker';
import {FormattedMessage} from "react-intl";

export default class CustomTimeRangeSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            invalidDateRange: false,
        };

        this.startTime = Moment().subtract(1, 'days').toDate();
        this.endTime = new Date();
        this.handleStartTimeChange = this.handleStartTimeChange.bind(this);
        this.handleEndTimeChange = this.handleEndTimeChange.bind(this);
        this.publishCustomTimeRange = this.publishCustomTimeRange.bind(this);
    }

    /**
     * handleStartTimeChange handle change in start(from) time
     * */
    handleStartTimeChange(date) {
        this.startTime = date;

        if (Moment(this.startTime).unix()
            >= Moment(this.endTime).unix()) {
            this.setState({ invalidDateRange: true });
        } else {
            this.setState({ invalidDateRange: false });
        }
    }

    /**
     * handleEndTimeChange handle change in end(to) time
     * */
    handleEndTimeChange(date) {
        this.endTime = date;

        if (Moment(this.startTime).unix()
            >= Moment(this.endTime).unix()) {
            this.setState({ invalidDateRange: true });
        } else {
            this.setState({ invalidDateRange: false });
        }
    }

    /**
     * publishCustomTimeRange publish selected custom time range
     * */
    publishCustomTimeRange() {
        const { handleClose, onChangeCustom } = this.props;

        handleClose();
        onChangeCustom && onChangeCustom(this.startTime, this.endTime);
    }

    render() {
        const { theme } = this.props;
        const { invalidDateRange } = this.state;

        return (
            <div
                style={{ marginTop: 10 }}
            >
                <div style={{ display: 'flex' }}>
                    <div
                        style={{
                            width: '50%',
                            float: 'left',
                            paddingRight: 10,
                        }}
                    >
                        <Typography color='textSecondary' variant='subheading'>
                            <FormattedMessage id='date.range.picker.from' defaultMessage='From'/>
                        </Typography>
                        <DateTimePicker
                            onChange={this.handleStartTimeChange}
                            theme={theme}
                            initTime={Moment().subtract(1, 'days')}
                            inputName='startTime'
                        />
                    </div>
                    <div
                        style={{
                            width: '50%',
                            float: 'right',
                            paddingLeft: 10,
                        }}
                    >
                        <Typography color='textSecondary' variant='subheading'>
                            <FormattedMessage id='date.range.picker.to' defaultMessage='To'/>
                        </Typography>
                        <DateTimePicker
                            onChange={this.handleEndTimeChange}
                            theme={theme}
                            initTime={Moment()}
                            inputName='endTime'
                            startTime={this.startTime}
                        />
                    </div>
                </div>
                {invalidDateRange ? (
                    <div style={{ color: '#dc3545', paddingTop: 10 }}>
                        <FormattedMessage id='date.range.picker.invalid.time.range'
                                          defaultMessage='Invalid date range, Please select a valid date range.'/>
                        {' '}
                    </div>
                ) : ''}
                <Button
                    style={{
                        marginTop: 10,
                        float: 'right',
                        backgroundColor:invalidDateRange ? 'transparent' : '#F26621'
                    }}
                    disabled={invalidDateRange}
                    onClick={this.publishCustomTimeRange}
                >
                    <FormattedMessage id='date.range.picker.apply' defaultMessage='Apply'/>
                </Button>
            </div>
        );
    }
}