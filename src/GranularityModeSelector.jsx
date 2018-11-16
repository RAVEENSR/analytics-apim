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
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import IconButton from '@material-ui/core/IconButton';
import CustomTimeRangeSelector from './CustomTimeRangeSelector';
import Constants from "./Constants";
import {FormattedMessage} from "react-intl";
import Tooltip from "@material-ui/core/Tooltip";

export default class GranularityModeSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            granularityMode: this.getSelectedGranularityLevel(),
            granularityModeValue: 'none',
            open: false,
        };

        this.generateTabs = this.generateTabs.bind(this);
        this.switchGranularity = this.switchGranularity.bind(this);
        this.onGranularityModeChange = this.onGranularityModeChange.bind(this);
        this.generateGranularityModeSwitchButton = this.generateGranularityModeSwitchButton.bind(this);
        this.generateLeftArrow = this.generateLeftArrow.bind(this);
        this.generateRightArrow = this.generateRightArrow.bind(this);
        this.getCustomSelectButton = this.getCustomSelectButton.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleRequestClose = this.handleRequestClose.bind(this);
        this.getSelectedGranularityLevel = this.getSelectedGranularityLevel.bind(this);
    }

    onGranularityModeChange(value) {
        const {onChange} = this.props;

        this.setState({granularityModeValue: value});
        return onChange && onChange(value);
    }


    getCustomSelectButton() {
        const {
            options, onChangeCustom, theme, selectedTimeRange
        } = this.props;
        const {open, anchorEl} = this.state;
        const customButton = selectedTimeRange === 'custom'
            ? (
                <Tooltip title={
                    <FormattedMessage id='tooltip.date.range.picker.custom' defaultMessage='Add custom time range'/>}>
                    <Button
                        onClick={this.handleClick}
                        style={{
                            borderBottom: theme.name === 'dark' ? '1px solid red' : '1px solid gray',
                            textTransform: 'none'
                        }}
                    >
                        <FormattedMessage id='date.range.picker.custom' defaultMessage='Custom'/>
                    </Button>
                </Tooltip>
            )
            : (
                <Tooltip title={<FormattedMessage id='tooltip.date.range.picker.custom' defaultMessage='Filters'/>}>
                    <Button
                        onClick={this.handleClick}
                        style={{
                            borderBottom: 'none',
                            textTransform: 'none'
                        }}
                    >
                        <FormattedMessage id='date.range.picker.custom' defaultMessage='Custom'/>
                    </Button>
                </Tooltip>
            );

        return (
            <div
                style={{display: 'flex'}}
            >
                {customButton}
                <Popover
                    open={open}
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        horizontal: 'left',
                        vertical: 'bottom',
                    }}
                    transformOrigin={{
                        horizontal: 'left',
                        vertical: 'top',
                    }}
                    onClose={this.handleRequestClose}
                    PaperProps={{
                        style: {
                            width: 500,
                            paddingLeft: 15,
                            paddingRight: 15,
                            paddingBottom: 15,
                        }
                    }}
                >
                    <CustomTimeRangeSelector
                        options={options}
                        handleClose={this.handleRequestClose}
                        onChangeCustom={onChangeCustom}
                        theme={theme}
                    />
                </Popover>
            </div>
        );
    }

    getSelectedGranularityLevel() {
        const {getDateTimeRangeInfo, options, getTimeRangeName} = this.props;
        const {lowGranularityOptions, highGranularityOptions} = Constants;
        const selectedTimeRange = getDateTimeRangeInfo().range || '';

        if (lowGranularityOptions.indexOf(selectedTimeRange) > -1) {
            return 'low';
        } else if (highGranularityOptions.indexOf(selectedTimeRange) > -1) {
            return 'high';
        } else  {
            const defaultRange = getTimeRangeName(options.defaultRange) || '1w';
            if (lowGranularityOptions.indexOf(defaultRange) > -1) {
                return 'low';
            } else {
                return 'high';
            }
        }
    }

    handleClick(event) {
        event.preventDefault();

        this.setState({
            open: true,
            anchorEl: event.currentTarget,
        });
    }

    handleRequestClose() {
        this.setState({
            open: false,
        });
    }

    generateRightArrow() {
        return (
            <Tooltip title={
                <FormattedMessage id='tooltip.date.range.picker.high.granularity.options'
                                  defaultMessage='See higher order time range options'/>}>
                <IconButton
                    style={{verticalAlign: 'middle',}}
                    onClick={this.switchGranularity}
                >
                    <KeyboardArrowRight/>
                </IconButton>
            </Tooltip>
        );
    }

    generateLeftArrow() {
        return (
            <Tooltip title={
                <FormattedMessage id='tooltip.date.range.picker.low.granularity.options'
                                  defaultMessage='See lower order time range options'/>}>
                <IconButton
                    style={{verticalAlign: 'middle',}}
                    onClick={this.switchGranularity}
                >
                    <KeyboardArrowLeft/>
                </IconButton>
            </Tooltip>
        );
    }

    generateGranularityModeSwitchButton(granularityMode) {
        return granularityMode === 'low' ? this.generateRightArrow() : this.generateLeftArrow();
    }

    generateTabs(granularityMode) {
        const {theme, selectedTimeRange} = this.props;
        const {lowGranularityOptions, highGranularityOptions} = Constants;
        const options = granularityMode === 'high' ? highGranularityOptions : lowGranularityOptions;

        return options.map((option) => {
            if (selectedTimeRange === option) {
                return (
                    <Button
                        onClick={() => this.onGranularityModeChange(option)}
                        style={{
                            borderBottom: theme.name === 'dark' ? '1px solid red' : '1px solid gray',
                            textTransform: 'none',
                            borderRadius: 0,
                            minWidth: 35,
                        }}>
                        {option}
                    </Button>
                );
            } else {
                return (
                    <Button
                        onClick={() => this.onGranularityModeChange(option)}
                        style={{
                            borderBottom: 'none',
                            textTransform: 'none',
                            minWidth: 35,
                        }}
                    >
                        {option}
                    </Button>
                );
            }
        });
    }

    switchGranularity() {
        const {granularityMode} = this.state;

        this.setState({granularityMode: granularityMode === 'low' ? 'high' : 'low'});
    }

    render() {
        const {granularityMode} = this.state;

        return (
            <div
                style={{display: 'flex'}}>
                {this.generateTabs(granularityMode)}
                {this.generateGranularityModeSwitchButton(granularityMode)}
                {this.getCustomSelectButton()}
            </div>
        );
    }
}