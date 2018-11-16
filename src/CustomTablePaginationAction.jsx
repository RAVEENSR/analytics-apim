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
import TextField from '@material-ui/core/TextField';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';
import {FormattedMessage} from "react-intl";

export default class CustomTablePaginationAction extends React.Component {
    constructor(props) {
        super(props);
        this.state = {selectedPage: this.props.page + 1};
    }

    /**
     * handleFirstPageButtonClick loads data of the first page
     * */
    handleFirstPageButtonClick = event => {
        this.state.selectedPage = 1;
        this.props.onChangePage(event, 0);
    };

    /**
     * handleBackButtonClick load data of the prev page
     * */
    handleBackButtonClick = event => {
        this.state.selectedPage = this.props.page;
        this.props.onChangePage(event, this.props.page - 1);
    };

    /**
     * handleNextButtonClick load data of the next page
     * */
    handleNextButtonClick = event => {
        this.state.selectedPage = this.props.page + 2;
        this.props.onChangePage(event, this.props.page + 1);
    };

    /**
     * handleLastPageButtonClick load data of the last page
     * */
    handleLastPageButtonClick = event => {
        this.state.selectedPage = Math.ceil(this.props.count / this.props.rowsPerPage);
        this.props.onChangePage(
            event,
            Math.max(0, Math.ceil(this.props.count / this.props.rowsPerPage) - 1),
        );
    };

    /**
     * handleSelectedPageChange handle changes in selected page
     * */
    handleSelectedPageChange = event => {
        const  { count, rowsPerPage, onChangePage } = this.props;
        if (event.target.value !== '') {
            let page = 0;
            if (event.target.value > 0) {
                const maxPage = Math.ceil(count / rowsPerPage);
                if (event.target.value > maxPage) {
                    page = maxPage - 1;
                } else {
                    page = event.target.value - 1;
                }
            }
            this.setState({selectedPage: page + 1});
            onChangePage(event, page);
        } else {
            this.setState({selectedPage: ''});
        }
    };

    /**
     * verifySelectedPageNumber check whether the selected page is valid
     * */
    verifySelectedPageNumber() {
        const { count, rowsPerPage } = this.props;
        const { selectedPage } = this.state;
        if (count === 0
            && selectedPage > 0) {
            this.setState({selectedPage: 0});
        } else if ((selectedPage === 0 && count > 0)
            || selectedPage > Math.ceil(count / rowsPerPage)) {
            this.setState({selectedPage: 1});
        }
    }

    /**
     * handleSelectedPageBlur handle empty selected page on blur of textfield
     * */
    handleSelectedPageBlur() {
        if (this.state.selectedPage === '') {
            this.setState({selectedPage: this.props.page+1});
        }
    }

    render() {
        const {count, page, rowsPerPage} = this.props;
        const { selectedPage } = this.state;
        this.verifySelectedPageNumber();

        return (
            <div
                style={{display: 'flex'}}>
                <div
                    style={{
                        paddingLeft: 35,
                        paddingRight: 30,
                        display: 'flex'
                    }}>
                    <TextField
                        inputProps={{
                            style: {
                                textAlign: 'right',
                                width: 'max-content'
                            },
                            min: 0,
                            onBlur:() => {this.handleSelectedPageBlur()}
                        }}
                        value={selectedPage}
                        type='number'
                        onChange={this.handleSelectedPageChange}
                    />
                    <div style={{
                        display: 'inline-block',
                        paddingTop: 15,
                        paddingLeft: 10,
                        width: 'max-content'
                    }}
                    >
                        <FormattedMessage id='tooltip.table.pagination.of' defaultMessage='of '/>
                        {Math.ceil(count / rowsPerPage)}
                        <FormattedMessage id='tooltip.table.pagination.pages' defaultMessage=' Page(s)'/>
                    </div>
                </div>
                <IconButton
                    onClick={this.handleFirstPageButtonClick}
                    disabled={page === 0}
                >
                    <FirstPageIcon/>
                </IconButton>
                <IconButton
                    onClick={this.handleBackButtonClick}
                    disabled={page === 0}
                >
                    <KeyboardArrowLeft/>
                </IconButton>
                <IconButton
                    onClick={this.handleNextButtonClick}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                >
                    <KeyboardArrowRight/>
                </IconButton>
                <IconButton
                    onClick={this.handleLastPageButtonClick}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                >
                    <LastPageIcon/>
                </IconButton>
            </div>
        );
    }
}